'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [isLogin, setIsLogin] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const [loading, setLoading] = useState(false)

  // 🔥 Redireciona se já estiver logado
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        router.push('/')
      }
    }

    checkUser()
  }, [router])

  const handleAuth = async () => {
    setLoading(true)

    if (isLogin) {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } else {
      // CADASTRO
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }

      // 🔥 cria profile manualmente
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          name,
        })
      }

      alert('Conta criada com sucesso! 🎉')
      setIsLogin(true)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">

      <div className="bg-[#0f172a]/80 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md border border-gray-800 shadow-lg">

        <h1 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Entrar' : 'Criar Conta'}
        </h1>

        {!isLogin && (
          <input
            type="text"
            placeholder="Seu nome"
            className="w-full mb-3 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-[#ad3372]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-[#ad3372]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          className="w-full mb-4 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-[#ad3372]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full bg-[#ad3372] hover:opacity-90 transition p-3 rounded-lg font-medium"
        >
          {loading
            ? 'Carregando...'
            : isLogin
            ? 'Entrar'
            : 'Criar Conta'}
        </button>

        <p
          className="text-sm mt-4 text-center text-[#ded0e7]/70 cursor-pointer hover:text-white transition"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? 'Não tem conta? Criar'
            : 'Já tem conta? Entrar'}
        </p>
      </div>
    </div>
  )
}