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
        {user && (
          <div className="flex items-center gap-4">

            {/* INFO */}
            <div className="flex items-center gap-3 bg-gray-900 px-3 py-2 rounded-xl border border-gray-800">

              {/* AVATAR */}
              <div className="w-8 h-8 rounded-full bg-[#ad3372] flex items-center justify-center text-sm font-bold">
                {user.profile?.name?.charAt(0) || 'U'}
              </div>

              {/* TEXTO */}
              <div className="text-sm">
                <p className="font-medium">
                  {user.profile?.name || 'Usuário'}
                </p>
                <p className="text-[#ded0e7]/60 text-xs">
                  {user.email}
                </p>
              </div>
            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="bg-[#ad3372] hover:opacity-90 transition px-3 py-2 rounded-lg text-sm font-medium"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}