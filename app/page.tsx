'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'


export default function Home() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'tarefas' | 'ranking'>('tarefas')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  // 🔒 enquanto verifica login
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto mb-8">

      {/* HEADER DA PÁGINA */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-1">
          👋 Bem-vindo ao desafio
        </h2>

        <p className="text-[#ded0e7]/70">
          Complete suas tarefas diárias e suba no ranking 🚀
        </p>
      </div>

      {/* TABS */}
      <div className="flex bg-gray-900 p-1 rounded-xl w-fit border border-gray-800">
        <button
          onClick={() => setActiveTab('tarefas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'tarefas'
              ? 'bg-[#ad3372] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📝 Tarefas do Dia
        </button>

        <button
          onClick={() => setActiveTab('ranking')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ranking'
              ? 'bg-[#ad3372] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🏆 Classificação
        </button>
      </div>

      {/* CONTEÚDO */}
      <div className="bg-gray-900 p-6 rounded-lg mt-4">
        {activeTab === 'tarefas' && <Tarefas />}
        {activeTab === 'ranking' && <Ranking />}
      </div>
    </div>
  )
}

function Tarefas() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(1)




  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData.user
      setUser(currentUser)

      if (!currentUser) {
        setLoading(false)
        return
      }

      const { data: challengesData } = await supabase
        .from('challenges')
        .select('*')
        .order('day_number', { ascending: true })

      setChallenges(challengesData || [])

      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('challenge_id')
        .eq('user_id', currentUser.id)

      const completedMap: Record<string, boolean> = {}

      submissionsData?.forEach((sub) => {
        completedMap[sub.challenge_id] = true
      })

      setCompleted(completedMap)
      setLoading(false)
    }

    init()
  }, [])

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    challengeId: string
  ) => {
    if (!e.target.files || !user) return

    const file = e.target.files[0]
    setUploading(challengeId)

    const filePath = `${user.id}/${challengeId}-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(filePath, file)

    if (uploadError) {
      console.error(uploadError)
      setUploading(null)
      return
    }

    const { error: insertError } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        image_url: filePath,
      })

    if (insertError) {
      console.error(insertError)
      setUploading(null)
      return
    }

    setCompleted((prev) => ({
      ...prev,
      [challengeId]: true,
    }))

    setUploading(null)
  }

  const isDayUnlocked = (day: number) => {
    if (day === 1) return true

    const previousDayChallenges = challenges.filter(
      (c) => Number(c.day_number) === day - 1
    )

    return previousDayChallenges.every(
      (c) => completed[c.id]
    )
  }

  if (loading) return <p>Carregando tarefas...</p>

  const filteredChallenges = challenges.filter(
    (c) => Number(c.day_number) === selectedDay
  )

  const totalChallenges = challenges.length
  const totalCompleted = Object.keys(completed).length
  const progressPercentage =
    totalChallenges > 0
      ? Math.round((totalCompleted / totalChallenges) * 100)
      : 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-[#0f172a]/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg">

        {/* HEADER */}
        <h3 className="text-2xl font-bold mb-2">
          🚀 Desafio 21 Dias
        </h3>

        <p className="text-gray-400 mb-6">
          Construa hábitos e acompanhe sua evolução diária
        </p>

        {/* PROGRESSO */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progresso</span>
            <span className="font-semibold text-[#8ac64c]">
              {progressPercentage}%
            </span>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#8ac64c] h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* DIAS */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
          {Array.from({ length: 21 }, (_, i) => i + 1).map((day) => {
            const unlocked = isDayUnlocked(day)
            const isActive = selectedDay === day

            return (
              <button
                key={day}
                disabled={!unlocked}
                onClick={() => unlocked && setSelectedDay(day)}
                className={`min-w-[70px] px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${
                    isActive
                      ? 'bg-[#ad3372] text-white shadow-md scale-105'
                      : unlocked
                      ? 'bg-gray-800 hover:bg-gray-700'
                      : 'bg-gray-800 opacity-30 cursor-not-allowed'
                  }
                `}
              >
                {unlocked ? `Dia ${day}` : '🔒'}
              </button>
            )
          })}
        </div>

        {/* DESAFIOS */}
        {filteredChallenges.length === 0 && (
          <p className="text-gray-400">
            Nenhum desafio para este dia.
          </p>
        )}

        {filteredChallenges.map((challenge) => {
          const isDone = completed[challenge.id]

          return (
            <div
              key={challenge.id}
              className="bg-gray-900 hover:bg-gray-800 transition-all p-5 rounded-xl mb-4 border border-gray-800"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-lg">
                  {challenge.title}
                </p>

                {isDone && (
                  <span className="text-[#8ac64c]text-sm font-medium">
                    ✅ Concluído
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-4">
                {challenge.description}
              </p>

              {!isDone && (
                <label className="inline-block bg-gradient-to-r bg-[#8ac64c] px-4 py-2 rounded-lg cursor-pointer text-sm font-medium hover:opacity-90">
                  {uploading === challenge.id
                    ? 'Enviando...'
                    : 'Enviar Comprovação'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) =>
                      handleUpload(e, challenge.id)
                    }
                  />
                </label>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Ranking() {
  const [ranking, setRanking] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser()
      setUser(userData.user)

      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')

      if (error) {
        console.error(error)
      } else {
        setRanking(data || [])
      }

      setLoading(false)
    }

    init()
  }, [])

  if (loading) return <p>Carregando ranking...</p>

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        Classificação Geral
      </h3>

      <div className="space-y-3">
        {ranking.map((userRank, index) => {
          const position = index + 1
          const isCurrentUser = userRank.user_id === user?.id

          let medal = ''
          if (position === 1) medal = '🥇'
          if (position === 2) medal = '🥈'
          if (position === 3) medal = '🥉'

          return (
            <div
              key={userRank.user_id}
              className={`flex items-center justify-between p-4 rounded ${
                isCurrentUser
                  ? 'bg-[#ad3372]/20 border border-blue-500'
                  : position <= 3
                  ? 'bg-yellow-500/10 border border-yellow-500'
                  : 'bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={userRank.avatar_url}
                  alt="avatar"
                  className="w-10 h-10 rounded-full"
                />

                <div>
                  <p className="font-medium">
                    {medal} {userRank.name}
                    {isCurrentUser && ' (Você)'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {position}º lugar
                  </p>
                </div>
              </div>

              <span className="font-bold">
                {userRank.total_points} pts
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}



//criar card para quem acessou o encontro ao vivo - +2 pontos, 
//constancia de 7 dias ganha +3 pontos
