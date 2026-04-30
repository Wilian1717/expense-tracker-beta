'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Check, X, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms]       = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)
  const router = useRouter()

  // Password strength checks
  const checks = {
    length:   password.length >= 8,
    upper:    /[A-Z]/.test(password),
    number:   /[0-9]/.test(password),
  }
  const passwordStrong = Object.values(checks).every(Boolean)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''

  const handleRegister = async () => {
    setError('')

    if (!fullName.trim()) { setError('Please enter your name.'); return }
    if (!email.trim())    { setError('Please enter your email.'); return }
    if (!passwordStrong)  { setError('Password does not meet requirements.'); return }
    if (!passwordsMatch)  { setError('Passwords do not match.'); return }
    if (!agreedToTerms)   { setError('You must agree to the Terms & Conditions.'); return }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() }
      }
    })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center animate-fade-up">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={22} color="white" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-400 mb-6">
            We sent a verification link to <span className="text-black font-medium">{email}</span>. Click the link to activate your account.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all active:scale-[.98]"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-medium text-black">Terms & Conditions</h2>
              <button onClick={() => setShowTerms(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1 text-xs text-gray-600 space-y-4 leading-relaxed">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Last updated: April 2026</p>

              <div>
                <p className="font-semibold text-gray-800 mb-1">1. What this app does</p>
                <p>This is a personal finance tracking application that helps you record income, expenses, savings goals, and recurring bills. It is provided as-is for personal use.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">2. Your data</p>
                <p>By creating an account, you understand that your financial data (expenses, income, bills, savings goals) is stored in our database. As the app owner, I can technically see data stored in the database. Do not store sensitive information beyond what the app is designed for.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">3. No financial advice</p>
                <p>This app is a tracker only. Nothing in this app constitutes financial, investment, or legal advice. Always consult a qualified professional for financial decisions.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">4. Account responsibility</p>
                <p>You are responsible for keeping your login credentials secure. Do not share your account. You are responsible for all activity that occurs under your account.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">5. Data accuracy</p>
                <p>The app displays what you input. We make no guarantees about the accuracy of calculations or that data will never be lost. Always keep personal backups using the CSV export feature.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">6. Service availability</p>
                <p>This is a personal project. The service may go down, change, or be discontinued at any time without notice. There is no SLA or uptime guarantee.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">7. Privacy</p>
                <p>Your email and financial data are stored using Supabase. We do not sell or share your data with third parties. Data may be deleted upon request by contacting the app owner.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">8. Acceptable use</p>
                <p>You agree not to misuse this service, attempt to access other users' data, or use it for any illegal purpose. Violations may result in account termination.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">9. Changes to terms</p>
                <p>These terms may be updated at any time. Continued use of the app after changes means you accept the new terms.</p>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">10. Contact</p>
                <p>For questions, data deletion requests, or concerns, please reach out to the app owner directly.</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => { setAgreedToTerms(true); setShowTerms(false) }}
                className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all active:scale-[.98]">
                I agree to these terms
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Logo */}
          <div className="w-10 h-10 bg-black rounded-xl mx-auto mb-6 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-[3px]">
              <div className="w-[7px] h-[7px] bg-white rounded-[2px]" />
              <div className="w-[7px] h-[7px] bg-white/50 rounded-[2px]" />
              <div className="w-[7px] h-[7px] bg-white/50 rounded-[2px]" />
              <div className="w-[7px] h-[7px] bg-white rounded-[2px]" />
            </div>
          </div>

          <h1 className="text-xl font-medium text-gray-900 text-center mb-1 tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-gray-400 text-center mb-8">
            Start tracking your finances
          </p>

          <div className="space-y-3 mb-4">

            {/* Full name */}
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black
                  focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5
                  hover:border-gray-400 hover:bg-gray-50 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black
                  focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5
                  hover:border-gray-400 hover:bg-gray-50 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-black
                  focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5
                  hover:border-gray-400 hover:bg-gray-50 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="flex gap-3 px-0.5">
                {[
                  { label: '8+ chars', ok: checks.length },
                  { label: 'Uppercase', ok: checks.upper },
                  { label: 'Number', ok: checks.number },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${c.ok ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={`text-[10px] ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Confirm password */}
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm text-black
                  focus:outline-none focus:ring-2 focus:ring-black/5 transition-all
                  ${confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-green-400 focus:border-green-500'
                      : 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 focus:border-black'
                  }`}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 -mt-1 pl-0.5">Passwords don't match</p>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => setAgreedToTerms(v => !v)}
              className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                agreedToTerms ? 'bg-black border-black' : 'border-gray-300 hover:border-gray-500'
              }`}
            >
              {agreedToTerms && <Check size={10} color="white" strokeWidth={3} />}
            </button>
            <p className="text-xs text-gray-500 leading-relaxed">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-black underline underline-offset-2 hover:text-gray-600 transition-colors font-medium"
              >
                Terms & Conditions
              </button>
              . I understand this app stores my financial data and the app owner can access it.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 active:scale-[0.98] text-white py-2.5 rounded-lg
              text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-5">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-black font-medium hover:text-gray-600 transition-colors underline underline-offset-2"
            >
              Sign in
            </button>
          </p>

        </div>
      </div>
    </>
  )
}