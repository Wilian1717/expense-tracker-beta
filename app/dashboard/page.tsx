'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Plus, LogOut, Wallet } from 'lucide-react'

export default function Dashboard() {
  const [expenses, setExpenses] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      window.location.href = '/login'
    } else {
      fetchExpenses(user.id)
    }
  }

  const fetchExpenses = async (userId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.log(error)
    } else {
      setExpenses(data || [])
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          
          <div className="flex items-center gap-2">
            <Wallet size={22} className="text-black" />
            <h1 className="text-xl font-medium tracking-tight text-black">
              Expenses
            </h1>
          </div>

          <div className="flex gap-2">
            
            <button
              onClick={() => router.push('/add-expense')}
              className="flex items-center gap-1 bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded-md text-sm transition"
            >
              <Plus size={16} />
              Add
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 border border-black text-black hover:bg-black hover:text-white px-3 py-1.5 rounded-md text-sm transition"
            >
              <LogOut size={16} />
            </button>

          </div>
        </div>

        {/* Empty state */}
        {expenses.length === 0 ? (
          <div className="text-center text-gray-400 mt-24">
            <p className="text-base">No expenses</p>
            <p className="text-sm mt-1">Start adding one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {exp.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </p>
                </div>

                <p className="text-sm font-medium text-black">
                  ${exp.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}