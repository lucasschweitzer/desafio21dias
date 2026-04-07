'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      // 🔥 busca profile (nome + avatar)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      setUser({
        ...data.user,
        profile,
      })
    }

    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

          const name =
  user?.user_metadata?.name ||
  user?.user_metadata?.full_name ||
  user?.email?.split('@')[0]

  return (
    <header className="border-b border-[#ad3372]/20 bg-[#0f172a]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">🚀</div>
          <div>
            <p className="font-bold text-lg">
              Desafio 21 Dias
            </p>
            <p className="text-xs text-[#ded0e7]/70">
              Crie hábitos consistentes
            </p>
          </div>
        </div>

        {/* USER */}
       <div className="flex items-center gap-4">
  <div className="bg-[#0f172a] px-4 py-2 rounded-xl border border-white/10">
    <p className="text-sm text-[#ded0e7]/70">
      Olá,
    </p>
    <p className="font-semibold text-white">
      {name} 👋
    </p>
  </div>

  <button
    onClick={handleLogout}
    className="bg-[#ad3372] px-4 py-2 rounded-lg text-white font-medium hover:opacity-90"
  >
    Sair
  </button>
</div>
      </div>
    </header>
  )
}