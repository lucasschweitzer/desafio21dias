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
          👋 Bem-vindo(a) ao desafio Reset 21!
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
  const [completed, setCompleted] = useState<Record<string, any>>({})
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  const START_DATE = new Date('2026-04-06')

  const getCurrentDay = () => {
    const now = new Date()
    const diffTime = now.getTime() - START_DATE.getTime()
    const diffDays =
      Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

    return Math.max(1, Math.min(diffDays, 21))
  }

  const getCurrentWeek = () => {
    return Math.ceil(getCurrentDay() / 7)
  }

  const currentDay = getCurrentDay()
  const currentWeek = getCurrentWeek()

  const [selectedDay, setSelectedDay] = useState<number>(currentDay)
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek)

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
        .select('challenge_id, image_url')
        .eq('user_id', currentUser.id)

      const completedMap: Record<string, any> = {}

      submissionsData?.forEach((sub) => {
        completedMap[sub.challenge_id] = sub.image_url
      })

      setCompleted(completedMap)
      setLoading(false)
    }

    init()
  }, [])

  const getImageUrl = (path: any) => {
    if (!path || typeof path !== 'string') return ''

    const { data } = supabase.storage
      .from('challenge_images')
      .getPublicUrl(path)

    return data.publicUrl
  }

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    challengeId: string
  ) => {
    if (!e.target.files || !user) return

    const file = e.target.files[0]
    setUploading(challengeId)

    const filePath = `${user.id}/${challengeId}-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('challenge_images')
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
      [challengeId]: filePath,
    }))

    setUploading(null)
  }

  const isDayUnlocked = (day: number) => {
    return day === currentDay
  }

  const getDaysFromWeek = (week: number) => {
    const start = (week - 1) * 7 + 1
    return Array.from({ length: 7 }, (_, i) => start + i)
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
    <div className="max-w-5xl mx-auto px-2 md:px-0">
      <div className="bg-[#0f172a]/70 backdrop-blur-xl p-4 md:p-6 rounded-2xl shadow-lg">

        {/* HEADER */}
        <h3 className="text-xl md:text-2xl font-bold mb-2">
          🚀 Desafio 21 Dias
        </h3>

        <p className="text-sm md:text-base text-[#ded0e7]/70 mb-6">
          Construa hábitos e acompanhe sua evolução diária
        </p>

        {/* PROGRESSO */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between text-xs md:text-sm mb-2">
            <span className="text-[#ded0e7]/70">Progresso</span>
            <span className="font-semibold text-[#8ac64c]">
              {progressPercentage}%
            </span>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-2 md:h-3 overflow-hidden">
            <div
              className="bg-[#8ac64c] h-2 md:h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* SEMANAS */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {[1, 2, 3].map((week) => {
            const unlockedWeek = week === currentWeek

            return (
              <button
                key={week}
                disabled={!unlockedWeek}
                onClick={() => {
                  setSelectedWeek(week)
                  setSelectedDay((week - 1) * 7 + 1)
                }}
                className={`min-w-[100px] px-4 py-3 rounded-xl text-sm ${
                  unlockedWeek
                    ? selectedWeek === week
                      ? 'bg-[#ad3372] text-white'
                      : 'bg-gray-800 text-gray-400'
                    : 'bg-gray-800 opacity-30'
                }`}
              >
                Semana {week}
              </button>
            )
          })}
        </div>

        {/* DIAS */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {getDaysFromWeek(selectedWeek).map((day) => {
            const unlocked = isDayUnlocked(day)
            const isActive = selectedDay === day

            return (
              <button
                key={day}
                disabled={!unlocked}
                onClick={() => unlocked && setSelectedDay(day)}
                className={`min-w-[80px] px-3 py-3 rounded-xl text-sm
                  ${
                    isActive
                      ? 'bg-[#ad3372] text-white'
                      : unlocked
                      ? 'bg-gray-800'
                      : 'bg-gray-800 opacity-30'
                  }
                `}
              >
                {day === currentDay ? `🔥 Dia ${day}` : '🔒'}
              </button>
            )
          })}
        </div>

        {/* DESAFIOS */}
        {filteredChallenges.length === 0 && (
          <p className="text-[#ded0e7]/70 text-sm">
            Nenhum desafio para este dia.
          </p>
        )}

        {filteredChallenges.map((challenge) => {
          const imagePath = completed[challenge.id]
          const isDone = !!imagePath

          return (
            <div
              key={challenge.id}
              className="bg-gray-900 p-4 md:p-5 rounded-xl mb-4 border border-gray-800"
            >
              <div className="flex justify-between items-center mb-2">

                <div className="flex-1">
                  <p className="font-semibold text-base md:text-lg">
                    {challenge.title}
                  </p>

                  {isDone && (
                    <span className="text-[#8ac64c] text-xs md:text-sm">
                      ✅ Concluído
                    </span>
                  )}
                </div>

                {isDone && typeof imagePath === 'string' && (
                  <img
                    src={getImageUrl(imagePath)}
                    alt="comprovacao"
                    className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-lg"
                  />
                )}
              </div>

              <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
                {challenge.description}
              </p>

              {!isDone && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleUpload(e, challenge.id)
                    }
                    className="hidden"
                    id={`upload-${challenge.id}`}
                  />

                  <label
                    htmlFor={`upload-${challenge.id}`}
                    className="inline-block bg-[#8ac64c] px-3 md:px-4 py-2 rounded-lg cursor-pointer text-xs md:text-sm font-medium"
                  >
                    {uploading === challenge.id
                      ? 'Enviando...'
                      : 'Enviar'}
                  </label>
                </div>
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
