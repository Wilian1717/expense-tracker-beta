'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) router.push('/dashboard')
  }

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) alert(error.message)
    else router.push('/dashboard')
  }

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Check your email to verify your account')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Logo mark */}
        <div className="w-10 h-10 bg-black rounded-xl mx-auto mb-6 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-[3px]">
            <div className="w-[7px] h-[7px] bg-white rounded-[2px]" />
            <div className="w-[7px] h-[7px] bg-white/50 rounded-[2px]" />
            <div className="w-[7px] h-[7px] bg-white/50 rounded-[2px]" />
            <div className="w-[7px] h-[7px] bg-white rounded-[2px]" />
          </div>
        </div>

        <h1 className="text-xl font-medium text-gray-900 text-center mb-1 tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          Sign in to your account
        </p>

        <div className="space-y-3 mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {/* email icon */}
            </span>
            <input
              type="email"
              placeholder="Email address"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-9 text-sm text-black
                focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5
                hover:border-gray-400 hover:bg-gray-50 transition-all"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-9 text-sm text-black
                focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5
                hover:border-gray-400 hover:bg-gray-50 transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 active:scale-[0.98] text-white py-2.5 rounded-lg
              text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
          onClick={() => router.push('/register')}
          className="w-full border border-gray-300 hover:border-black hover:bg-gray-50
            active:scale-[0.98] text-black py-2.5 rounded-lg text-sm font-medium transition-all"
        >
            Create an account
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5 cursor-pointer hover:text-black transition-colors">
          Forgot your password?
        </p>

      </div>
    </div>
  )
}