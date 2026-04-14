'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AddExpense() {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')

  const handleAdd = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      alert('Not logged in')
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
      alert(error.message)
    } else {
      alert('Expense added')
      setTitle('')
      setAmount('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Add Expense</h1>

      <input
        type="text"
        placeholder="Title"
        className="border p-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount"
        className="border p-2"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={handleAdd} className="bg-blue-500 text-white p-2">
        Add Expense
      </button>
    </div>
  )
}