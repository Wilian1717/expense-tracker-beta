'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  // Auto redirect if already logged in
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      router.push('/dashboard')
    }
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email to verify your account before logging in')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">

        {/* Title */}
        <h1 className="text-2xl font-medium text-gray-900 mb-8 text-center">
          LOGIN
        </h1>

        {/* Form */}
        <div className="space-y-4">

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black transition  text-black"
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black transition  text-black"
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Login button */}
          <button
            onClick={handleLogin}
            className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded-md text-sm transition"
          >
            Login
          </button>

          {/* Register button */}
          <button
            onClick={handleRegister}
            className="w-full border border-black text-black hover:bg-black hover:text-white py-2 rounded-md text-sm transition"
          >
            Register
          </button>

        </div>
      </div>
    </div>
  )
}