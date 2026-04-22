'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import {
  Plus, LogOut, Wallet, TrendingUp, TrendingDown,
  ShoppingBag, Car, UtensilsCrossed, HeartPulse, MoreHorizontal,
  Calendar, Target, Receipt, Pencil, Trash2, X, Check,
  DollarSign, Briefcase, BarChart2, PiggyBank, ArrowUpCircle, ArrowDownCircle,
  Lightbulb, AlertTriangle, Flag, Flame, Search, RefreshCw, ChevronDown,
  User, Home, Zap, Menu, ChevronLeft, ChevronRight
} from 'lucide-react'

type Category = 'food' | 'transport' | 'shopping' | 'health' | 'personal' | 'housing' | 'utilities' | 'other'
type IncomeCategory = 'salary' | 'freelance' | 'business' | 'investment' | 'other'
type Frequency = 'daily' | 'weekly' | 'monthly'

interface Expense {
  id: string; user_id: string; title: string; amount: number
  category: Category; note?: string; created_at: string
}
interface Income {
  id: string; user_id: string; title: string; amount: number
  category: IncomeCategory; note?: string; created_at: string
}
interface Budget {
  id: string; user_id: string; category: Category; limit_amount: number; month: string
}
interface SavingsGoal {
  id: string; user_id: string; title: string; target_amount: number
  current_amount: number; deadline?: string; created_at: string
}
interface RecurringExpense {
  id: string; user_id: string; title: string; amount: number
  category: Category; frequency: Frequency; next_due: string; note?: string; created_at: string
}

const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  food:      { label: 'Food & dining', icon: <UtensilsCrossed size={14} />, bg: 'bg-green-50',   text: 'text-green-800'  },
  transport: { label: 'Transport',     icon: <Car size={14} />,             bg: 'bg-blue-50',    text: 'text-blue-800'   },
  shopping:  { label: 'Shopping',      icon: <ShoppingBag size={14} />,     bg: 'bg-amber-50',   text: 'text-amber-800'  },
  health:    { label: 'Health',        icon: <HeartPulse size={14} />,      bg: 'bg-red-50',     text: 'text-red-800'    },
  personal:  { label: 'Personal',      icon: <User size={14} />,            bg: 'bg-purple-50',  text: 'text-purple-800' },
  housing:   { label: 'Housing',       icon: <Home size={14} />,            bg: 'bg-orange-50',  text: 'text-orange-800' },
  utilities: { label: 'Utilities',     icon: <Zap size={14} />,             bg: 'bg-cyan-50',    text: 'text-cyan-800'   },
  other:     { label: 'Other',         icon: <MoreHorizontal size={14} />,  bg: 'bg-gray-100',   text: 'text-gray-700'   },
}
const INCOME_CONFIG: Record<IncomeCategory, { label: string; icon: React.ReactNode }> = {
  salary:     { label: 'Salary',     icon: <Briefcase size={14} />  },
  freelance:  { label: 'Freelance',  icon: <DollarSign size={14} /> },
  business:   { label: 'Business',   icon: <BarChart2 size={14} />  },
  investment: { label: 'Investment', icon: <TrendingUp size={14} /> },
  other:      { label: 'Other',      icon: <PiggyBank size={14} />  },
}
const FREQ_LABELS: Record<Frequency, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}
function fmtShort(amount: number): string {
  if (amount >= 1_000_000_000_000) return `Rp ${(amount / 1_000_000_000_000).toFixed(2)}T`
  if (amount >= 1_000_000_000)     return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`
  if (amount >= 1_000_000)         return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000)             return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount}`
}
function currentMonth() { return new Date().toISOString().slice(0, 7) }
function getMonthLabel(iso: string) {
  const [year, month] = iso.split('-')
  return `${MONTHS[parseInt(month) - 1]} '${year.slice(2)}`
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function CollapsibleSection({ title, icon, children, defaultOpen = true, headerRight }: {
  title: string; icon: React.ReactNode; children: React.ReactNode
  defaultOpen?: boolean; headerRight?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-100 rounded-xl mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 flex-1 text-left">
          <span className="text-gray-400">{icon}</span>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          <ChevronDown size={12} className={`text-gray-300 transition-transform duration-300 ml-0.5 ${open ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {headerRight && <div className="ml-2">{headerRight}</div>}
      </div>
      <div style={{ maxHeight: open ? '2000px' : '0px', opacity: open ? 1 : 0, transition: 'max-height 0.35s ease, opacity 0.25s ease', overflow: 'hidden' }}>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Add Recurring Modal ──────────────────────────────────────────────────────
function AddRecurringModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (data: { title: string; amount: number; category: Category; frequency: Frequency; next_due: string; note: string }) => Promise<void>
}) {
  const [title, setTitle]         = useState('')
  const [amount, setAmount]       = useState('')
  const [category, setCategory]   = useState<Category>('food')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [next_due, setNextDue]    = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return
    setSaving(true)
    await onSave({ title: title.trim(), amount: parseFloat(amount), category, frequency, next_due, note: note.trim() })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Add recurring expense</h2><p className="text-xs text-gray-400 mt-0.5">Fixed or repeating costs</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map(c => {
              const cfg = CATEGORY_CONFIG[c]; const active = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                  <span className={active ? cfg.text : 'text-gray-400'}>{cfg.icon}</span>
                  <span className="text-[10px] leading-none">{cfg.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setAmount(v) }} placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Netflix, Rent, Gym..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition bg-white">
              {(Object.keys(FREQ_LABELS) as Frequency[]).map(f => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Next due date</label>
            <input type="date" value={next_due} onChange={e => setNextDue(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Savings Goal Modal ───────────────────────────────────────────────────
function AddGoalModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (data: { title: string; target_amount: number; current_amount: number; deadline: string }) => Promise<void>
}) {
  const [title, setTitle]       = useState('')
  const [target, setTarget]     = useState('')
  const [current, setCurrent]   = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !target || parseFloat(target) <= 0) return
    setSaving(true)
    await onSave({ title: title.trim(), target_amount: parseFloat(target), current_amount: parseFloat(current) || 0, deadline })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">New savings goal</h2><p className="text-xs text-gray-400 mt-0.5">Set a target to work towards</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Goal name</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Emergency fund, New laptop..." autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Target amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={target} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setTarget(v) }} placeholder="0"
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {target && !isNaN(parseFloat(target)) && parseFloat(target) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(target))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Already saved (Rp) <span className="text-gray-300">(optional)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={current} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setCurrent(v) }} placeholder="0"
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Target date <span className="text-gray-300">(optional)</span></label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !target || parseFloat(target) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Create goal</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Funds Modal ──────────────────────────────────────────────────────────
function AddFundsModal({ goal, onClose, onSave }: {
  goal: SavingsGoal; onClose: () => void; onSave: (newAmount: number) => Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const remaining = goal.target_amount - goal.current_amount

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setSaving(true); await onSave(goal.current_amount + parseFloat(amount)); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <div><h2 className="text-base font-medium text-black">Add funds</h2><p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{goal.title}</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <p className="text-xs text-gray-400 mb-3">Still need: <span className="font-medium text-black">{fmt(remaining)}</span></p>
        <div className="relative mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
          <input type="text" inputMode="numeric" value={amount} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setAmount(v) }} placeholder="0" autoFocus
            className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Confirm</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (data: { title: string; amount: number; category: Category; note: string }) => Promise<void>
}) {
  const [title, setTitle]       = useState('')
  const [amount, setAmount]     = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up" onKeyDown={e => e.key === 'Escape' && onClose()}>
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Add expense</h2><p className="text-xs text-gray-400 mt-0.5">Record a new expense</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map(c => {
              const cfg = CATEGORY_CONFIG[c]; const active = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                  <span className={active ? cfg.text : 'text-gray-400'}>{cfg.icon}</span>
                  <span className="text-[10px] leading-none">{cfg.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setAmount(v) }} placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lunch, Gas, Groceries..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !amount || parseFloat(amount) <= 0}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Expense Modal ───────────────────────────────────────────────────────
function EditExpenseModal({ expense, onClose, onSave }: {
  expense: Expense; onClose: () => void; onSave: (updated: Partial<Expense>) => Promise<void>
}) {
  const [title, setTitle]       = useState(expense.title)
  const [amount, setAmount]     = useState(String(expense.amount))
  const [category, setCategory] = useState<Category>(expense.category)
  const [note, setNote]         = useState(expense.note ?? '')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Edit expense</h2><p className="text-xs text-gray-400 mt-0.5">Update the details below</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map(c => {
              const cfg = CATEGORY_CONFIG[c]; const active = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                  <span className={active ? cfg.text : 'text-gray-400'}>{cfg.icon}</span>
                  <span className="text-[10px] leading-none">{cfg.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setAmount(v) }}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Income Modal ─────────────────────────────────────────────────────────
function AddIncomeModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (income: { title: string; amount: number; category: IncomeCategory; note: string }) => Promise<void>
}) {
  const [title, setTitle]       = useState('')
  const [amount, setAmount]     = useState('')
  const [category, setCategory] = useState<IncomeCategory>('salary')
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !amount) return
    setSaving(true); await onSave({ title: title.trim(), amount: parseFloat(amount), category, note: note.trim() }); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div><h2 className="text-base font-medium text-black">Add income</h2><p className="text-xs text-gray-400 mt-0.5">Record incoming money</p></div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-all"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setAmount(v) }} placeholder="0" autoFocus
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition font-medium" />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && <p className="text-xs text-gray-400 mt-1 pl-1">{fmt(parseFloat(amount))}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. April Salary, Freelance project..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as IncomeCategory)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition bg-white">
              {(Object.keys(INCOME_CONFIG) as IncomeCategory[]).map(c => <option key={c} value={c}>{INCOME_CONFIG[c].label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note <span className="text-gray-300">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !amount}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ title, onConfirm, onCancel, deleting }: {
  title: string; onConfirm: () => void; onCancel: () => void; deleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-2xl w-full max-w-xs p-5 shadow-xl text-center animate-slide-up">
        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={18} className="text-red-500" /></div>
        <h2 className="text-base font-medium text-black mb-1">Delete expense?</h2>
        <p className="text-xs text-gray-500 mb-1 truncate px-4">"{title}"</p>
        <p className="text-xs text-gray-300 mb-5">This action cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Smart Insights Content ───────────────────────────────────────────────────
function SmartInsightsContent({ thisMonthTotal, lastMonthTotal, avgPerDay, categoryTotals, thisMonthIncomeTot, netSavings, budgets, budgetSpend }: {
  thisMonthTotal: number; lastMonthTotal: number; avgPerDay: number
  categoryTotals: Partial<Record<Category, number>>; thisMonthIncomeTot: number
  netSavings: number; budgets: Budget[]; budgetSpend: Partial<Record<Category, number>>
}) {
  const insights: { icon: React.ReactNode; text: string; color: string; bg: string }[] = []

  if (lastMonthTotal > 0 && thisMonthTotal > 0) {
    const pct = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    if (pct > 10) insights.push({ icon: <TrendingUp size={13} />, text: `Spending is up ${pct.toFixed(0)}% vs last month`, color: 'text-red-700', bg: 'bg-red-50' })
    else if (pct < -10) insights.push({ icon: <TrendingDown size={13} />, text: `Great! Spending is down ${Math.abs(pct).toFixed(0)}% vs last month`, color: 'text-green-700', bg: 'bg-green-50' })
  }
  const topCat = (Object.keys(categoryTotals) as Category[]).sort((a, b) => (categoryTotals[b] || 0) - (categoryTotals[a] || 0))[0]
  if (topCat && thisMonthTotal > 0) {
    const pct = ((categoryTotals[topCat] || 0) / thisMonthTotal) * 100
    if (pct > 40) insights.push({ icon: <Flame size={13} />, text: `${CATEGORY_CONFIG[topCat].label} is ${pct.toFixed(0)}% of your spending this month`, color: 'text-amber-700', bg: 'bg-amber-50' })
  }
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const projected = avgPerDay * daysInMonth
  if (lastMonthTotal > 0 && projected > lastMonthTotal * 1.15)
    insights.push({ icon: <TrendingUp size={13} />, text: `On pace for ${fmtShort(projected)} this month — ${fmtShort(projected - lastMonthTotal)} more than last month`, color: 'text-orange-700', bg: 'bg-orange-50' })
  if (thisMonthIncomeTot > 0) {
    const savingsRate = (netSavings / thisMonthIncomeTot) * 100
    if (savingsRate >= 20) insights.push({ icon: <PiggyBank size={13} />, text: `Saving ${savingsRate.toFixed(0)}% of income this month — solid!`, color: 'text-green-700', bg: 'bg-green-50' })
    else if (savingsRate < 0) insights.push({ icon: <AlertTriangle size={13} />, text: `Spending exceeds income by ${fmtShort(Math.abs(netSavings))} this month`, color: 'text-red-700', bg: 'bg-red-50' })
  }
  budgets.forEach(b => {
    const spent = budgetSpend[b.category] || 0; const pct = (spent / b.limit_amount) * 100
    if (pct >= 80 && pct < 100) insights.push({ icon: <AlertTriangle size={13} />, text: `${CATEGORY_CONFIG[b.category].label} budget is ${pct.toFixed(0)}% used`, color: 'text-amber-700', bg: 'bg-amber-50' })
    else if (pct >= 100) insights.push({ icon: <AlertTriangle size={13} />, text: `${CATEGORY_CONFIG[b.category].label} budget exceeded by ${fmtShort(spent - b.limit_amount)}`, color: 'text-red-700', bg: 'bg-red-50' })
  })

  if (insights.length === 0) return <p className="text-xs text-gray-300 py-2 text-center">No insights yet — keep tracking!</p>

  return (
    <div className="flex flex-col gap-2">
      {insights.map((ins, i) => (
        <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 ${ins.bg}`}>
          <span className={`mt-0.5 shrink-0 ${ins.color}`}>{ins.icon}</span>
          <p className={`text-xs leading-relaxed ${ins.color}`}>{ins.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [expenses, setExpenses]               = useState<Expense[]>([])
  const [income, setIncome]                   = useState<Income[]>([])
  const [budgets, setBudgets]                 = useState<Budget[]>([])
  const [savingsGoals, setSavingsGoals]       = useState<SavingsGoal[]>([])
  const [recurring, setRecurring]             = useState<RecurringExpense[]>([])
  const [activeFilter, setActiveFilter]       = useState<Category | 'all'>('all')
  const [activeTab, setActiveTab]             = useState<'expenses' | 'income' | 'recurring'>('expenses')
  const [selectedMonth, setSelectedMonth]     = useState(currentMonth())
  const [userEmail, setUserEmail]             = useState('')
  const [loading, setLoading]                 = useState(true)
  const [searchQuery, setSearchQuery]         = useState('')
  const [showSearch, setShowSearch]           = useState(false)
  const [showAddExpense, setShowAddExpense]   = useState(false)
  const [editingExpense, setEditingExpense]   = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting]           = useState(false)
  const [showAddIncome, setShowAddIncome]     = useState(false)
  const [showAddGoal, setShowAddGoal]         = useState(false)
  const [addingFundsGoal, setAddingFundsGoal] = useState<SavingsGoal | null>(null)
  const [deletingGoalId, setDeletingGoalId]   = useState<string | null>(null)
  const [showAddRecurring, setShowAddRecurring] = useState(false)
  const [deletingRecurringId, setDeletingRecurringId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen]               = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { init() }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const init = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) { router.push('/login'); return }
    setUserEmail(user.email ?? '')
    await Promise.all([fetchExpenses(user.id), fetchIncome(user.id), fetchBudgets(user.id), fetchGoals(user.id), fetchRecurring(user.id)])
    setLoading(false)
  }

  const fetchExpenses  = async (uid: string) => { const { data } = await supabase.from('expenses').select('*').eq('user_id', uid).order('created_at', { ascending: false }); setExpenses(data || []) }
  const fetchIncome    = async (uid: string) => { const { data } = await supabase.from('income').select('*').eq('user_id', uid).order('created_at', { ascending: false }); setIncome(data || []) }
  const fetchBudgets   = async (uid: string) => { const { data } = await supabase.from('budgets').select('*').eq('user_id', uid).eq('month', currentMonth() + '-01'); setBudgets(data || []) }
  const fetchGoals     = async (uid: string) => { const { data } = await supabase.from('savings_goals').select('*').eq('user_id', uid).order('created_at', { ascending: true }); setSavingsGoals(data || []) }
  const fetchRecurring = async (uid: string) => { const { data } = await supabase.from('recurring_expenses').select('*').eq('user_id', uid).order('next_due', { ascending: true }); setRecurring(data || []) }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const handleAddExpense = async (data: { title: string; amount: number; category: Category; note: string }) => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user; if (!user) return
    const { data: inserted, error } = await supabase.from('expenses').insert({ ...data, user_id: user.id }).select().single()
    if (!error && inserted) setExpenses(prev => [inserted, ...prev])
    setShowAddExpense(false)
  }
  const handleSaveEdit = async (updated: Partial<Expense>) => {
    if (!editingExpense) return
    const { error } = await supabase.from('expenses').update(updated).eq('id', editingExpense.id)
    if (!error) setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...e, ...updated } : e))
    setEditingExpense(null)
  }
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return
    setIsDeleting(true)
    const { error } = await supabase.from('expenses').delete().eq('id', deletingExpense.id)
    if (!error) setExpenses(prev => prev.filter(e => e.id !== deletingExpense.id))
    setIsDeleting(false); setDeletingExpense(null)
  }
  const handleAddIncome = async (data: { title: string; amount: number; category: IncomeCategory; note: string }) => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user; if (!user) return
    const { data: inserted, error } = await supabase.from('income').insert({ ...data, user_id: user.id }).select().single()
    if (!error && inserted) setIncome(prev => [inserted, ...prev])
    setShowAddIncome(false)
  }
  const handleDeleteIncome = async (id: string) => {
    const { error } = await supabase.from('income').delete().eq('id', id)
    if (!error) setIncome(prev => prev.filter(i => i.id !== id))
  }
  const handleAddGoal = async (data: { title: string; target_amount: number; current_amount: number; deadline: string }) => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user; if (!user) return
    const { data: inserted, error } = await supabase.from('savings_goals').insert({ ...data, user_id: user.id }).select().single()
    if (!error && inserted) setSavingsGoals(prev => [...prev, inserted])
    setShowAddGoal(false)
  }
  const handleAddFunds = async (goalId: string, newAmount: number) => {
    const { error } = await supabase.from('savings_goals').update({ current_amount: newAmount }).eq('id', goalId)
    if (!error) setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newAmount } : g))
    setAddingFundsGoal(null)
  }
  const handleDeleteGoal = async (id: string) => {
    setDeletingGoalId(id)
    const { error } = await supabase.from('savings_goals').delete().eq('id', id)
    if (!error) setSavingsGoals(prev => prev.filter(g => g.id !== id))
    setDeletingGoalId(null)
  }
  const handleAddRecurring = async (data: { title: string; amount: number; category: Category; frequency: Frequency; next_due: string; note: string }) => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user; if (!user) return
    const { data: inserted, error } = await supabase.from('recurring_expenses').insert({ ...data, user_id: user.id }).select().single()
    if (!error && inserted) setRecurring(prev => [...prev, inserted])
    setShowAddRecurring(false)
  }
  const handleDeleteRecurring = async (id: string) => {
    setDeletingRecurringId(id)
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
    if (!error) setRecurring(prev => prev.filter(r => r.id !== id))
    setDeletingRecurringId(null)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const thisMonthExpenses  = useMemo(() => expenses.filter(e => e.created_at.startsWith(selectedMonth)), [expenses, selectedMonth])
  const lastMonthExpenses  = useMemo(() => {
    const d = new Date(selectedMonth + '-01'); d.setMonth(d.getMonth() - 1)
    return expenses.filter(e => e.created_at.startsWith(d.toISOString().slice(0, 7)))
  }, [expenses, selectedMonth])
  const thisMonthIncome    = useMemo(() => income.filter(i => i.created_at.startsWith(selectedMonth)), [income, selectedMonth])
  const thisMonthTotal     = useMemo(() => thisMonthExpenses.reduce((s, e) => s + e.amount, 0), [thisMonthExpenses])
  const lastMonthTotal     = useMemo(() => lastMonthExpenses.reduce((s, e) => s + e.amount, 0), [lastMonthExpenses])
  const thisMonthIncomeTot = useMemo(() => thisMonthIncome.reduce((s, i) => s + i.amount, 0), [thisMonthIncome])
  const netSavings         = thisMonthIncomeTot - thisMonthTotal
  const avgPerDay          = useMemo(() => thisMonthTotal / new Date().getDate(), [thisMonthTotal])
  const monthOverMonthPct  = lastMonthTotal === 0 ? 0 : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
  const last6Months = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      const total = expenses.filter(e => e.created_at.startsWith(key)).reduce((s, e) => s + e.amount, 0)
      result.push({ key, label: MONTHS[d.getMonth()], total })
    }
    return result
  }, [expenses])
  const maxMonthly     = Math.max(...last6Months.map(m => m.total), 1)
  const categoryTotals = useMemo(() => {
    const totals: Partial<Record<Category, number>> = {}
    thisMonthExpenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount })
    return totals
  }, [thisMonthExpenses])
  const budgetSpend = useMemo(() => {
    const map: Partial<Record<Category, number>> = {}
    thisMonthExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    return map
  }, [thisMonthExpenses])
  const filteredExpenses = useMemo(() => {
    let list = activeFilter === 'all' ? thisMonthExpenses : thisMonthExpenses.filter(e => e.category === activeFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(e => e.title.toLowerCase().includes(q) || e.note?.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
    }
    return list
  }, [thisMonthExpenses, activeFilter, searchQuery])
  const filteredIncome = useMemo(() => {
    if (!searchQuery.trim()) return thisMonthIncome
    const q = searchQuery.toLowerCase()
    return thisMonthIncome.filter(i => i.title.toLowerCase().includes(q) || i.note?.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
  }, [thisMonthIncome, searchQuery])
  const recurringDueSoon = useMemo(() => {
    const now = Date.now()
    return recurring.filter(r => new Date(r.next_due).getTime() - now <= 7 * 86_400_000).length
  }, [recurring])

  const monthIndex = last6Months.findIndex(m => m.key === selectedMonth)
  const canGoPrev  = monthIndex > 0
  const canGoNext  = monthIndex < last6Months.length - 1

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your finances...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.2s ease both; }
        .stat-card { animation: slideUp 0.3s ease both; }
        .stat-card:nth-child(1) { animation-delay: 0.03s; }
        .stat-card:nth-child(2) { animation-delay: 0.07s; }
        .stat-card:nth-child(3) { animation-delay: 0.11s; }
        .stat-card:nth-child(4) { animation-delay: 0.15s; }
        .row-item { animation: slideUp 0.22s ease both; }
      `}</style>

      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-5 py-5 sm:py-7">

          {/* ── Header ── */}
          <div className="flex justify-between items-center mb-6 sm:mb-7">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
                <Wallet size={15} color="white" />
              </div>
              <div>
                <h1 className="text-base font-medium text-black leading-none tracking-tight">Expenses</h1>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{userEmail}</p>
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => setShowSearch(v => !v)}
                className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[.98] ${showSearch ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black hover:bg-gray-50 text-gray-600 hover:text-black'}`}>
                <Search size={14} />
              </button>
              {/* Income — same weight as Expenses */}
              <button onClick={() => setShowAddIncome(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:border-black hover:bg-gray-50 text-gray-600 hover:text-black px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[.98]">
                <ArrowUpCircle size={14} /> Income
              </button>
              {/* Expenses — primary CTA, balanced with Income */}
              <button onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-1.5 bg-black hover:bg-gray-800 active:scale-[.98] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all">
                <ArrowDownCircle size={14} /> Expenses
              </button>
              <button onClick={handleLogout}
                className="flex items-center border border-gray-200 hover:border-black hover:bg-gray-50 active:scale-[.98] text-gray-600 hover:text-black p-1.5 rounded-lg transition-all">
                <LogOut size={15} />
              </button>
            </div>

            {/* Mobile: search + hamburger */}
            <div className="flex sm:hidden items-center gap-1.5" ref={menuRef}>
              <button onClick={() => setShowSearch(v => !v)}
                className={`p-1.5 rounded-lg border transition-all ${showSearch ? 'bg-black border-black text-white' : 'border-gray-200 text-gray-600'}`}>
                <Search size={15} />
              </button>
              <div className="relative">
                <button onClick={() => setMenuOpen(v => !v)}
                  className={`p-1.5 border rounded-lg transition-all ${menuOpen ? 'bg-black border-black text-white' : 'border-gray-200 text-gray-600'}`}>
                  <Menu size={15} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1.5 animate-slide-up">
                    <button onClick={() => { setShowAddIncome(true); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <ArrowUpCircle size={14} className="text-green-600" /> Add Income
                    </button>
                    <button onClick={() => { setShowAddExpense(true); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <ArrowDownCircle size={14} /> Add Expense
                    </button>
                    <button onClick={() => { setShowAddRecurring(true); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <RefreshCw size={14} className="text-blue-500" /> Recurring
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="relative mb-4 animate-slide-up">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search expenses, income, notes..."
                className="w-full border border-gray-200 rounded-lg pl-9 pr-9 py-2.5 text-sm text-black focus:outline-none focus:border-black transition" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"><X size={14} /></button>
              )}
            </div>
          )}

          {/* ── Month selector — above stat cards ── */}
          <div className="flex items-center gap-1 mb-3">
            <button onClick={() => canGoPrev && setSelectedMonth(last6Months[monthIndex - 1].key)} disabled={!canGoPrev}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-black hover:bg-gray-100 transition-all disabled:opacity-25">
              <ChevronLeft size={13} />
            </button>
            <div className="flex items-center gap-1.5 px-1">
              <Calendar size={11} className="text-gray-400" />
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-medium text-black outline-none cursor-pointer">
                {last6Months.map(m => <option key={m.key} value={m.key}>{getMonthLabel(m.key)}</option>)}
              </select>
            </div>
            <button onClick={() => canGoNext && setSelectedMonth(last6Months[monthIndex + 1].key)} disabled={!canGoNext}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-black hover:bg-gray-100 transition-all disabled:opacity-25">
              <ChevronRight size={13} />
            </button>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
            {[
              { label: 'Income',    value: fmtShort(thisMonthIncomeTot), sub: `${thisMonthIncome.length} entries`,       color: 'text-green-700', icon: <ArrowUpCircle size={11} /> },
              { label: 'Expenses',  value: fmtShort(thisMonthTotal),     sub: lastMonthTotal > 0 ? `${monthOverMonthPct > 0 ? '↑' : '↓'} ${Math.abs(monthOverMonthPct).toFixed(0)}% vs last month` : 'No prior data', color: monthOverMonthPct > 0 ? 'text-red-600' : 'text-green-700', icon: <ArrowDownCircle size={11} /> },
              { label: 'Balance',   value: fmtShort(netSavings),         sub: netSavings >= 0 ? 'Surplus' : 'Deficit',   color: netSavings >= 0 ? 'text-green-700' : 'text-red-600', icon: netSavings >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} /> },
              { label: 'Avg / day', value: fmtShort(avgPerDay),          sub: 'This month',                              color: 'text-gray-400',  icon: null },
            ].map((s, i) => (
              <div key={i} className="stat-card bg-gray-50 rounded-xl p-3 sm:p-3.5">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-base sm:text-lg font-medium text-black">{s.value}</p>
                <p className={`text-xs mt-1 flex items-center gap-1 ${s.color}`}>{s.icon}<span className="truncate">{s.sub}</span></p>
              </div>
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Monthly expenses</p>
              <div className="flex flex-col gap-2">
                {last6Months.map(m => (
                  <div key={m.key} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6 shrink-0">{m.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${m.key === selectedMonth ? 'bg-black' : 'bg-gray-400'}`}
                        style={{ width: m.total ? `${(m.total / maxMonthly) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-xs text-gray-400 w-14 text-right shrink-0">{m.total ? fmtShort(m.total) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">By category</p>
              {thisMonthTotal === 0 ? (
                <p className="text-xs text-gray-300 text-center mt-6">No data this month</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
                    const spent = categoryTotals[cat] || 0
                    const pct   = thisMonthTotal > 0 ? (spent / thisMonthTotal) * 100 : 0
                    if (spent === 0) return null
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16 shrink-0 truncate">{CATEGORY_CONFIG[cat].label.split(' ')[0]}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-7 text-right shrink-0">{pct.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Smart Insights — collapsible ── */}
          <CollapsibleSection title="Smart insights" icon={<Lightbulb size={13} />} defaultOpen={true}>
            <SmartInsightsContent
              thisMonthTotal={thisMonthTotal} lastMonthTotal={lastMonthTotal} avgPerDay={avgPerDay}
              categoryTotals={categoryTotals} thisMonthIncomeTot={thisMonthIncomeTot}
              netSavings={netSavings} budgets={budgets} budgetSpend={budgetSpend}
            />
          </CollapsibleSection>

          {/* ── Budget Tracker ── */}
          {budgets.length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Target size={13} className="text-gray-400" />
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Budget tracker</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {budgets.map(b => {
                  const spent = budgetSpend[b.category] || 0
                  const pct   = Math.min((spent / b.limit_amount) * 100, 100)
                  const over  = spent > b.limit_amount
                  const warn  = !over && pct >= 80
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          {CATEGORY_CONFIG[b.category].label}
                          {over && <AlertTriangle size={11} className="text-red-500 shrink-0" />}
                          {warn && <AlertTriangle size={11} className="text-amber-500 shrink-0" />}
                        </span>
                        <span className={`text-xs font-medium ${over ? 'text-red-600' : warn ? 'text-amber-600' : 'text-gray-500'}`}>
                          {fmtShort(spent)} / {fmtShort(b.limit_amount)}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-black'}`} style={{ width: `${pct}%` }} />
                      </div>
                      {over && <p className="text-xs text-red-500 mt-0.5">Over by {fmtShort(spent - b.limit_amount)}</p>}
                      {warn && <p className="text-xs text-amber-500 mt-0.5">{pct.toFixed(0)}% used — approaching limit</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Savings Goals — collapsible ── */}
          <CollapsibleSection
            title="Savings goals"
            icon={<Flag size={13} />}
            defaultOpen={true}
            headerRight={
              <button onClick={() => setShowAddGoal(true)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors">
                <Plus size={12} /> Add
              </button>
            }
          >
            {savingsGoals.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-300">No goals yet</p>
                <button onClick={() => setShowAddGoal(true)} className="text-xs text-gray-400 hover:text-black transition-colors mt-1 underline underline-offset-2">
                  Create your first goal
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {savingsGoals.map(goal => {
                  const pct       = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                  const done      = goal.current_amount >= goal.target_amount
                  const remaining = goal.target_amount - goal.current_amount
                  let daysLeft: number | null = null
                  if (goal.deadline) daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000)
                  return (
                    <div key={goal.id}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="flex items-center gap-1.5">
                            {done && <span className="text-green-500">✓</span>}
                            <p className="text-sm font-medium text-gray-900 truncate">{goal.title}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {fmtShort(goal.current_amount)} of {fmtShort(goal.target_amount)}
                            {daysLeft !== null && (
                              <span className={`ml-2 ${daysLeft < 7 ? 'text-red-500' : 'text-gray-400'}`}>
                                · {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!done && (
                            <button onClick={() => setAddingFundsGoal(goal)}
                              className="text-xs px-2 py-1 rounded-md bg-black text-white hover:bg-gray-800 transition-all">
                              + Add
                            </button>
                          )}
                          <button onClick={() => handleDeleteGoal(goal.id)} disabled={deletingGoalId === goal.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all disabled:opacity-50">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-green-500' : pct >= 75 ? 'bg-black' : 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                        {!done && <span className="text-xs text-gray-400">{fmtShort(remaining)} to go</span>}
                        {done  && <span className="text-xs text-green-500 font-medium">Goal reached! 🎉</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CollapsibleSection>

          {/* ── Transactions / Recurring Tab ── */}
          <div>
            {/* Tab row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
                <button onClick={() => setActiveTab('expenses')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'expenses' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
                  <span className="flex items-center gap-1.5"><Receipt size={11} /> Expenses</span>
                </button>
                <button onClick={() => setActiveTab('income')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'income' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
                  <span className="flex items-center gap-1.5"><ArrowUpCircle size={11} /> Income</span>
                </button>
                <button onClick={() => setActiveTab('recurring')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'recurring' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={11} /> Recurring
                    {recurringDueSoon > 0 && <span className="bg-red-500 text-white rounded-full text-[9px] w-3.5 h-3.5 flex items-center justify-center">{recurringDueSoon}</span>}
                  </span>
                </button>
              </div>
            </div>

            {/* ── Category filter — icon pills, single scrollable row ── */}
            {activeTab === 'expenses' && !searchQuery && (
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                {(['all', ...Object.keys(CATEGORY_CONFIG)] as (Category | 'all')[]).map(f => {
                  const isAll    = f === 'all'
                  const active   = activeFilter === f
                  const cfg      = isAll ? null : CATEGORY_CONFIG[f as Category]
                  return (
                    <button key={f} onClick={() => setActiveFilter(f)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                        active ? 'bg-black text-white border-black' : 'text-gray-500 border-gray-200 hover:border-gray-400 bg-white'
                      }`}>
                      {!isAll && (
                        <span className={active ? 'text-white' : cfg!.text}>{cfg!.icon}</span>
                      )}
                      {isAll ? 'All' : cfg!.label.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Expenses list ── */}
            {activeTab === 'expenses' && (
              filteredExpenses.length === 0 ? (
                <div className="text-center py-16 text-gray-300">
                  <Wallet size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{searchQuery ? 'No results found' : 'No expenses yet'}</p>
                  <p className="text-xs mt-1">{searchQuery ? `No matches for "${searchQuery}"` : activeFilter === 'all' ? 'Start by adding an expense' : `No ${activeFilter} expenses this month`}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {searchQuery && <p className="text-xs text-gray-400 mb-1">{filteredExpenses.length} result{filteredExpenses.length !== 1 ? 's' : ''}</p>}
                  {filteredExpenses.map((exp, idx) => {
                    const cfg = CATEGORY_CONFIG[exp.category]
                    return (
                      <div key={exp.id} className="row-item flex items-center gap-3 border border-gray-100 rounded-xl px-3 sm:px-4 py-3 hover:bg-gray-50 transition-all group"
                        style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <span className={cfg.text}>{cfg.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{exp.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                            {exp.note && <span className="text-xs text-gray-400 truncate hidden sm:inline">{exp.note}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 mr-1 sm:mr-2">
                          <p className="text-sm font-medium text-black">{fmt(exp.amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(exp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => setEditingExpense(exp)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-black transition-all"><Pencil size={13} /></button>
                          <button onClick={() => setDeletingExpense(exp)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* ── Income list ── */}
            {activeTab === 'income' && (
              filteredIncome.length === 0 ? (
                <div className="text-center py-16 text-gray-300">
                  <ArrowUpCircle size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{searchQuery ? 'No results found' : 'No income yet'}</p>
                  <p className="text-xs mt-1">{searchQuery ? `No matches for "${searchQuery}"` : 'Tap "Income" in the header to add'}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredIncome.map((inc, idx) => {
                    const cfg = INCOME_CONFIG[inc.category]
                    return (
                      <div key={inc.id} className="row-item flex items-center gap-3 border border-gray-100 rounded-xl px-3 sm:px-4 py-3 hover:bg-gray-50 transition-all group"
                        style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50">
                          <span className="text-green-700">{cfg.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{inc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">{cfg.label}</span>
                            {inc.note && <span className="text-xs text-gray-400 truncate hidden sm:inline">{inc.note}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 mr-1 sm:mr-2">
                          <p className="text-sm font-medium text-green-700">+{fmt(inc.amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(inc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => handleDeleteIncome(inc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* ── Recurring list ── */}
            {activeTab === 'recurring' && (
              <div>
                <div className="flex justify-end mb-3">
                  <button onClick={() => setShowAddRecurring(true)}
                    className="hidden sm:flex items-center gap-1.5 border border-gray-200 hover:border-black hover:bg-gray-50 text-gray-600 hover:text-black px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                    <Plus size={13} /> Add recurring
                  </button>
                </div>
                {recurring.length === 0 ? (
                  <div className="text-center py-16 text-gray-300">
                    <RefreshCw size={28} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No recurring expenses</p>
                    <p className="text-xs mt-1">Add fixed costs like rent, subscriptions, etc.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {recurring.map((r, idx) => {
                      const cfg      = CATEGORY_CONFIG[r.category]
                      const dueDate  = new Date(r.next_due)
                      const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86_400_000)
                      const overdue  = daysLeft < 0
                      const dueSoon  = daysLeft >= 0 && daysLeft <= 7
                      return (
                        <div key={r.id} className="row-item flex items-center gap-3 border border-gray-100 rounded-xl px-3 sm:px-4 py-3 hover:bg-gray-50 transition-all group"
                          style={{ animationDelay: `${idx * 0.03}s` }}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                            <span className={cfg.text}>{cfg.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{FREQ_LABELS[r.frequency]}</span>
                              <span className={`text-xs ${overdue ? 'text-red-500' : dueSoon ? 'text-amber-500' : 'text-gray-400'}`}>
                                {overdue ? `Overdue by ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 mr-1 sm:mr-2">
                            <p className="text-sm font-medium text-black">{fmt(r.amount)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => handleDeleteRecurring(r.id)} disabled={deletingRecurringId === r.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Modals ── */}
        {showAddExpense    && <AddExpenseModal   onClose={() => setShowAddExpense(false)}    onSave={handleAddExpense} />}
        {editingExpense    && <EditExpenseModal  expense={editingExpense} onClose={() => setEditingExpense(null)} onSave={handleSaveEdit} />}
        {deletingExpense   && <DeleteConfirm     title={deletingExpense.title} onConfirm={handleConfirmDelete} onCancel={() => setDeletingExpense(null)} deleting={isDeleting} />}
        {showAddIncome     && <AddIncomeModal    onClose={() => setShowAddIncome(false)}     onSave={handleAddIncome} />}
        {showAddGoal       && <AddGoalModal      onClose={() => setShowAddGoal(false)}       onSave={handleAddGoal} />}
        {addingFundsGoal   && <AddFundsModal     goal={addingFundsGoal} onClose={() => setAddingFundsGoal(null)} onSave={(amt) => handleAddFunds(addingFundsGoal.id, amt)} />}
        {showAddRecurring  && <AddRecurringModal onClose={() => setShowAddRecurring(false)}  onSave={handleAddRecurring} />}
      </div>
    </>
  )
}