'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import {
  Plus, LogOut, Wallet, TrendingUp, TrendingDown,
  ShoppingBag, Car, UtensilsCrossed, HeartPulse, MoreHorizontal,
  Calendar, Target, Receipt
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = 'food' | 'transport' | 'shopping' | 'health' | 'other'

interface Expense {
  id: string
  user_id: string
  title: string
  amount: number
  category: Category
  note?: string
  created_at: string
}

interface Budget {
  id: string
  user_id: string
  category: Category
  limit_amount: number
  month: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Category, {
  label: string
  icon: React.ReactNode
  bg: string
  text: string
  border: string
}> = {
  food: {
    label: 'Food & dining',
    icon: <UtensilsCrossed size={14} />,
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  transport: {
    label: 'Transport',
    icon: <Car size={14} />,
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  shopping: {
    label: 'Shopping',
    icon: <ShoppingBag size={14} />,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  health: {
    label: 'Health',
    icon: <HeartPulse size={14} />,
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
  },
  other: {
    label: 'Other',
    icon: <MoreHorizontal size={14} />,
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2
  }).format(amount)
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7) // "2025-04"
}

function getMonthLabel(iso: string) {
  const [year, month] = iso.split('-')
  return `${MONTHS[parseInt(month) - 1]} ${year.slice(2)}`
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [activeFilter, setActiveFilter] = useState<Category | 'all'>('all')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) { router.push('/login'); return }
    setUserEmail(user.email ?? '')
    await Promise.all([fetchExpenses(user.id), fetchBudgets(user.id)])
    setLoading(false)
  }

  const fetchExpenses = async (userId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error) setExpenses(data || [])
  }

  const fetchBudgets = async (userId: string) => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth() + '-01')
    if (!error) setBudgets(data || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ─── Derived Data ──────────────────────────────────────────────────────────

  const thisMonthExpenses = useMemo(() =>
    expenses.filter(e => e.created_at.startsWith(selectedMonth)),
    [expenses, selectedMonth]
  )

  const lastMonthExpenses = useMemo(() => {
    const d = new Date(selectedMonth + '-01')
    d.setMonth(d.getMonth() - 1)
    const lm = d.toISOString().slice(0, 7)
    return expenses.filter(e => e.created_at.startsWith(lm))
  }, [expenses, selectedMonth])

  const thisMonthTotal = useMemo(() =>
    thisMonthExpenses.reduce((s, e) => s + e.amount, 0),
    [thisMonthExpenses]
  )

  const lastMonthTotal = useMemo(() =>
    lastMonthExpenses.reduce((s, e) => s + e.amount, 0),
    [lastMonthExpenses]
  )

  const totalAllTime = useMemo(() =>
    expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  )

  const avgPerDay = useMemo(() => {
    const day = new Date().getDate()
    return thisMonthTotal / day
  }, [thisMonthTotal])

  const monthOverMonthPct = useMemo(() => {
    if (lastMonthTotal === 0) return 0
    return ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
  }, [thisMonthTotal, lastMonthTotal])

  // Last 6 months bar chart data
  const last6Months = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      const total = expenses
        .filter(e => e.created_at.startsWith(key))
        .reduce((s, e) => s + e.amount, 0)
      result.push({ key, label: MONTHS[d.getMonth()], total })
    }
    return result
  }, [expenses])

  const maxMonthly = Math.max(...last6Months.map(m => m.total), 1)

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const totals: Partial<Record<Category, number>> = {}
    thisMonthExpenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    })
    return totals
  }, [thisMonthExpenses])

  // Filtered transactions
  const filteredExpenses = useMemo(() =>
    activeFilter === 'all'
      ? thisMonthExpenses
      : thisMonthExpenses.filter(e => e.category === activeFilter),
    [thisMonthExpenses, activeFilter]
  )

  // Budget spend per category
  const budgetSpend = useMemo(() => {
    const map: Partial<Record<Category, number>> = {}
    thisMonthExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount
    })
    return map
  }, [thisMonthExpenses])

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-7">

        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Wallet size={15} color="white" />
            </div>
            <div>
              <h1 className="text-base font-medium text-black leading-none tracking-tight">
                Expenses
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Month picker */}
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600">
              <Calendar size={13} className="text-gray-400" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs text-gray-700 outline-none cursor-pointer"
              >
                {last6Months.map(m => (
                  <option key={m.key} value={m.key}>{getMonthLabel(m.key)}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => router.push('/add-expense')}
              className="flex items-center gap-1.5 bg-black hover:bg-gray-800 active:scale-[.98]
                text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            >
              <Plus size={14} />
              Add
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center border border-gray-200 hover:border-black hover:bg-gray-50
                active:scale-[.98] text-gray-600 hover:text-black p-1.5 rounded-lg transition-all"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'This month',
              value: fmt(thisMonthTotal),
              sub: lastMonthTotal > 0
                ? `${monthOverMonthPct > 0 ? '↑' : '↓'} ${Math.abs(monthOverMonthPct).toFixed(0)}% vs last month`
                : 'No prior data',
              up: monthOverMonthPct <= 0,
            },
            {
              label: 'Last month',
              value: fmt(lastMonthTotal),
              sub: `${lastMonthExpenses.length} transactions`,
              up: null,
            },
            {
              label: 'All time',
              value: fmt(totalAllTime),
              sub: `${expenses.length} total`,
              up: null,
            },
            {
              label: 'Daily avg',
              value: fmt(avgPerDay),
              sub: 'This month',
              up: null,
            },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-xl font-medium text-black">{s.value}</p>
              {s.up !== null ? (
                <p className={`text-xs mt-1 flex items-center gap-1 ${s.up ? 'text-green-700' : 'text-red-600'}`}>
                  {s.up ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                  {s.sub}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">

          {/* Monthly bar chart */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Monthly spending
            </p>
            <div className="flex flex-col gap-2">
              {last6Months.map(m => (
                <div key={m.key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-6 shrink-0">{m.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        m.key === selectedMonth ? 'bg-black' : 'bg-gray-400'
                      }`}
                      style={{ width: m.total ? `${(m.total / maxMonthly) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right shrink-0">
                    {m.total ? `$${(m.total / 1000).toFixed(1)}k` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              By category
            </p>
            {thisMonthTotal === 0 ? (
              <p className="text-xs text-gray-300 text-center mt-6">No data this month</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
                  const spent = categoryTotals[cat] || 0
                  const pct = thisMonthTotal > 0 ? (spent / thisMonthTotal) * 100 : 0
                  if (spent === 0) return null
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16 shrink-0 truncate">
                        {CATEGORY_CONFIG[cat].label.split(' ')[0]}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-7 text-right shrink-0">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Budget Tracker ── */}
        {budgets.length > 0 && (
          <div className="border border-gray-100 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={13} className="text-gray-400" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Budget tracker
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {budgets.map(b => {
                const spent = budgetSpend[b.category] || 0
                const pct = Math.min((spent / b.limit_amount) * 100, 100)
                const over = spent > b.limit_amount
                return (
                  <div key={b.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">
                        {CATEGORY_CONFIG[b.category].label}
                      </span>
                      <span className={`text-xs font-medium ${over ? 'text-red-600' : 'text-gray-500'}`}>
                        {fmt(spent)} / {fmt(b.limit_amount)}
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-black'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {over && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Over by {fmt(spent - b.limit_amount)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Transactions ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt size={13} className="text-gray-400" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Transactions
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1">
              {(['all', 'food', 'transport', 'shopping', 'health', 'other'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeFilter === f
                      ? 'bg-black text-white'
                      : 'text-gray-400 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  {f === 'all' ? 'All' : CATEGORY_CONFIG[f].label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <Wallet size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No expenses yet</p>
              <p className="text-xs mt-1">
                {activeFilter === 'all' ? 'Start adding one' : `No ${activeFilter} expenses this month`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredExpenses.map(exp => {
                const cfg = CATEGORY_CONFIG[exp.category]
                return (
                  <div
                    key={exp.id}
                    className="flex items-center gap-3 border border-gray-100 rounded-xl
                      px-4 py-3 hover:bg-gray-50 active:scale-[.99] transition-all cursor-pointer"
                    onClick={() => router.push(`/expense/${exp.id}`)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <span className={cfg.text}>{cfg.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{exp.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        {exp.note && (
                          <span className="text-xs text-gray-400 truncate">{exp.note}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-black">{fmt(exp.amount)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(exp.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}