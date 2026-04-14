'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AddExpense() {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleAdd = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      setMessage('You must be logged in')
      return
    }

    const { error } = await supabase.from('expenses').insert([
      {
        user_id: user.id,
        title: title,
        amount: parseInt(amount),
      },
    ])

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Expense added successfully')
      setTitle('')
      setAmount('')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium text-black">
            Add Expense
          </h1>
          <p className="text-sm text-black mt-1">
            Track your spending
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">

          {/* Title */}
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition"
          />

          {/* Amount */}
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition"
          />

          {/* Button */}
          <button
            onClick={handleAdd}
            className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded-md text-sm transition"
          >
            Add Expense
          </button>

          {/* Back button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full border border-black text-black hover:bg-black hover:text-white py-2 rounded-md text-sm transition"
          >
            Back
          </button>

          {/* Message */}
          {message && (
            <p className="text-sm text-black text-center mt-2">
              {message}
            </p>
          )}

        </div>
      </div>
    </div>
  )
}