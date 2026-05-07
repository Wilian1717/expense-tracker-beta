'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Shield, LogOut, Users, ToggleLeft, ToggleRight, AlertTriangle, Check } from 'lucide-react'

// ── Change this to your own secret password ──────────────────────────────────
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASS ?? ''
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed]             = useState(false)
  const [pass, setPass]                 = useState('')
  const [passError, setPassError]       = useState('')
  const [regEnabled, setRegEnabled]     = useState<boolean | null>(null)
  const [userCount, setUserCount]       = useState<number | null>(null)
  const [toggling, setToggling]         = useState(false)
  const [savedMsg, setSavedMsg]         = useState('')
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    if (authed) fetchData()
  }, [authed])

  const fetchData = async () => {
    setLoading(true)
    // Fetch registration setting
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'registration_enabled')
      .single()

    if (setting) setRegEnabled(setting.value === 'true')

    // Fetch user count from auth (uses admin API via supabase)
    const { count } = await supabase
      .from('expenses')
      .select('user_id', { count: 'exact', head: true })

    setUserCount(count ?? null)
    setLoading(false)
  }

  const handleLogin = () => {
    if (pass === ADMIN_PASSWORD) {
      setAuthed(true)
      setPassError('')
    } else {
      setPassError('Incorrect password.')
      setPass('')
    }
  }

  const handleToggle = async () => {
    if (regEnabled === null) return
    setToggling(true)
    const newVal = !regEnabled

    const { error } = await supabase
      .from('app_settings')
      .update({ value: String(newVal), updated_at: new Date().toISOString() })
      .eq('key', 'registration_enabled')

    if (!error) {
      setRegEnabled(newVal)
      setSavedMsg(newVal ? 'Registration opened' : 'Registration closed')
      setTimeout(() => setSavedMsg(''), 3000)
    }
    setToggling(false)
  }

  /* ── Password gate ── */
  if (!authed) {
    return (
      <>
        <style>{styles}</style>
        <div className="ad-root">
          <div className="ad-bg-dots" />
          <div className="ad-gate">
            <div className="ad-gate-icon">
              <Shield size={22} color="white" strokeWidth={2} />
            </div>
            <h1 className="ad-gate-title">Admin access</h1>
            <p className="ad-gate-sub">ExpenseFlow · Private area</p>

            <div className="ad-gate-field">
              <input
                className="ad-input"
                type="password"
                placeholder="Enter admin password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
              />
            </div>

            {passError && (
              <div className="ad-gate-error">
                <AlertTriangle size={13} />
                {passError}
              </div>
            )}

            <button className="ad-btn-primary" onClick={handleLogin}>
              Enter
            </button>
          </div>
        </div>
      </>
    )
  }

  /* ── Admin dashboard ── */
  return (
    <>
      <style>{styles}</style>
      <div className="ad-root">
        <div className="ad-bg-dots" />

        <div className="ad-dashboard">

          {/* Header */}
          <div className="ad-header">
            <div className="ad-header-left">
              <div className="ad-header-icon">
                <Shield size={16} color="white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="ad-header-title">ExpenseFlow Admin</h1>
                <p className="ad-header-sub">Registration control panel</p>
              </div>
            </div>
            <button className="ad-logout" onClick={() => setAuthed(false)}>
              <LogOut size={14} />
              Sign out
            </button>
          </div>

          {/* Status card */}
          <div className={`ad-status-card ${regEnabled ? 'open' : 'closed'}`}>
            <div className="ad-status-left">
              <div className={`ad-status-dot ${regEnabled ? 'active' : ''}`} />
              <div>
                <p className="ad-status-title">
                  {regEnabled === null
                    ? 'Loading...'
                    : regEnabled
                      ? 'Registration is open'
                      : 'Registration is closed'
                  }
                </p>
                <p className="ad-status-sub">
                  {regEnabled
                    ? 'Anyone can create an account right now'
                    : 'New signups are blocked — users see a closed message'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Main toggle card */}
          <div className="ad-card">
            <div className="ad-card-row">
              <div className="ad-card-info">
                <p className="ad-card-label">Public registration</p>
                <p className="ad-card-desc">
                  {regEnabled
                    ? 'Turn off to block new signups. Existing users are unaffected.'
                    : 'Turn on to allow new users to register.'
                  }
                </p>
              </div>

              {/* Toggle switch */}
              <button
                className={`ad-toggle ${regEnabled ? 'on' : 'off'} ${toggling ? 'loading' : ''}`}
                onClick={handleToggle}
                disabled={toggling || regEnabled === null}
              >
                <div className="ad-toggle-thumb" />
              </button>
            </div>

            {/* Saved confirmation */}
            {savedMsg && (
              <div className={`ad-saved ${regEnabled ? 'green' : 'gray'}`}>
                <Check size={13} />
                {savedMsg}
              </div>
            )}
          </div>

          {/* Info cards row */}
          <div className="ad-info-row">
            <div className="ad-info-card">
              <div className="ad-info-icon">
                <Users size={15} />
              </div>
              <p className="ad-info-label">Active data</p>
              <p className="ad-info-val">
                {loading ? '—' : userCount !== null ? `${userCount} records` : 'N/A'}
              </p>
            </div>

            <div className="ad-info-card">
              <div className="ad-info-icon">
                <Shield size={15} />
              </div>
              <p className="ad-info-label">Access</p>
              <p className="ad-info-val">Password protected</p>
            </div>

            <div className="ad-info-card">
              <div className={`ad-info-icon ${regEnabled ? 'green' : ''}`}>
                {regEnabled ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
              </div>
              <p className="ad-info-label">Signups</p>
              <p className={`ad-info-val ${regEnabled ? 'green' : ''}`}>
                {regEnabled === null ? '—' : regEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          {/* Instruction box */}
          <div className="ad-instruction">
            <p className="ad-instruction-title">How to use</p>
            <div className="ad-instruction-steps">
              <div className="ad-instruction-step">
                <div className="ad-instruction-num">1</div>
                <p>Friend wants to join → they message you</p>
              </div>
              <div className="ad-instruction-step">
                <div className="ad-instruction-num">2</div>
                <p>You open this page and flip the toggle ON</p>
              </div>
              <div className="ad-instruction-step">
                <div className="ad-instruction-num">3</div>
                <p>Friend registers at <span className="mono">/register</span></p>
              </div>
              <div className="ad-instruction-step">
                <div className="ad-instruction-num">4</div>
                <p>You flip the toggle OFF immediately after</p>
              </div>
            </div>
          </div>

          <p className="ad-footer">ExpenseFlow · Admin · {new Date().getFullYear()}</p>
        </div>
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sora', sans-serif; background: #f8f8f6; color: #111110; }

  .ad-root {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 40px 20px; position: relative;
  }
  .ad-bg-dots {
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, #d4d3cc 1px, transparent 1px);
    background-size: 28px 28px; opacity: 0.5;
    pointer-events: none; z-index: 0;
  }

  /* ── Gate ── */
  .ad-gate {
    width: 100%; max-width: 340px;
    background: #ffffff;
    border: 1.5px solid #e4e3de;
    border-radius: 20px; padding: 36px;
    text-align: center;
    box-shadow: 0 4px 32px rgba(0,0,0,0.07);
    position: relative; z-index: 1;
    animation: adFadeUp 0.5s ease both;
  }
  .ad-gate-icon {
    width: 48px; height: 48px; background: #111110;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .ad-gate-title {
    font-size: 20px; font-weight: 800;
    letter-spacing: -0.04em; color: #111110; margin-bottom: 4px;
  }
  .ad-gate-sub {
    font-size: 12px; color: #8a8980; margin-bottom: 24px;
  }
  .ad-gate-field { margin-bottom: 10px; }
  .ad-gate-error {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 12px; color: #dc2626;
    background: #fff5f5; border: 1px solid #fecaca;
    border-radius: 8px; padding: 8px 12px; margin-bottom: 12px;
  }

  /* ── Dashboard ── */
  .ad-dashboard {
    width: 100%; max-width: 520px;
    position: relative; z-index: 1;
    animation: adFadeUp 0.5s ease both;
    display: flex; flex-direction: column; gap: 12px;
  }
  .ad-header {
    background: #111110;
    border-radius: 16px; padding: 20px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ad-header-left { display: flex; align-items: center; gap: 12px; }
  .ad-header-icon {
    width: 36px; height: 36px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .ad-header-title {
    font-size: 15px; font-weight: 700;
    color: #ffffff; letter-spacing: -0.02em;
  }
  .ad-header-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px; }
  .ad-logout {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; padding: 7px 12px;
    font-family: 'Sora', sans-serif;
    font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.6);
    cursor: pointer; transition: all 0.2s;
  }
  .ad-logout:hover { background: rgba(255,255,255,0.14); color: white; }

  /* Status card */
  .ad-status-card {
    border-radius: 14px; padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between;
    border: 1.5px solid;
    transition: all 0.3s;
  }
  .ad-status-card.open { background: #f0fdf4; border-color: #bbf7d0; }
  .ad-status-card.closed { background: #fafaf8; border-color: #e4e3de; }
  .ad-status-left { display: flex; align-items: center; gap: 12px; }
  .ad-status-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: #d1d0c8; flex-shrink: 0;
    transition: background 0.3s;
  }
  .ad-status-dot.active {
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
    animation: adPulse 2s ease-in-out infinite;
  }
  .ad-status-title {
    font-size: 14px; font-weight: 700; color: #111110; margin-bottom: 2px;
  }
  .ad-status-sub { font-size: 12px; color: #8a8980; line-height: 1.5; }

  /* Main toggle card */
  .ad-card {
    background: #ffffff;
    border: 1.5px solid #e4e3de;
    border-radius: 16px; padding: 20px 24px;
  }
  .ad-card-row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .ad-card-info { flex: 1; }
  .ad-card-label {
    font-size: 14px; font-weight: 700; color: #111110; margin-bottom: 4px;
  }
  .ad-card-desc { font-size: 12px; color: #8a8980; line-height: 1.5; }

  /* Toggle switch */
  .ad-toggle {
    width: 52px; height: 28px;
    border-radius: 14px; border: none;
    cursor: pointer; position: relative;
    flex-shrink: 0;
    transition: background 0.3s;
  }
  .ad-toggle.on { background: #111110; }
  .ad-toggle.off { background: #d1d0c8; }
  .ad-toggle.loading { opacity: 0.6; cursor: not-allowed; }
  .ad-toggle-thumb {
    width: 22px; height: 22px;
    border-radius: 50%; background: #ffffff;
    position: absolute; top: 3px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    transition: left 0.3s;
  }
  .ad-toggle.on .ad-toggle-thumb { left: 27px; }
  .ad-toggle.off .ad-toggle-thumb { left: 3px; }

  .ad-saved {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 500;
    margin-top: 14px; padding: 8px 12px;
    border-radius: 8px;
    animation: adFadeUp 0.3s ease;
  }
  .ad-saved.green { background: #f0fdf4; color: #16a34a; }
  .ad-saved.gray { background: #f8f8f6; color: #5a5950; }

  /* Info row */
  .ad-info-row {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  }
  .ad-info-card {
    background: #ffffff;
    border: 1.5px solid #e4e3de;
    border-radius: 14px; padding: 16px;
  }
  .ad-info-icon {
    width: 30px; height: 30px;
    background: #f8f8f6; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #8a8980; margin-bottom: 10px;
    transition: all 0.2s;
  }
  .ad-info-icon.green { background: #f0fdf4; color: #16a34a; }
  .ad-info-label {
    font-size: 10px; font-weight: 600; color: #a8a89a;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
  }
  .ad-info-val { font-size: 13px; font-weight: 600; color: #111110; }
  .ad-info-val.green { color: #16a34a; }

  /* Instructions */
  .ad-instruction {
    background: #ffffff;
    border: 1.5px solid #e4e3de;
    border-radius: 16px; padding: 20px 24px;
  }
  .ad-instruction-title {
    font-size: 12px; font-weight: 700; color: #111110;
    text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 14px;
  }
  .ad-instruction-steps { display: flex; flex-direction: column; gap: 10px; }
  .ad-instruction-step {
    display: flex; align-items: center; gap: 12px;
    font-size: 13px; color: #5a5950;
  }
  .ad-instruction-num {
    width: 22px; height: 22px;
    background: #f8f8f6; border: 1px solid #e4e3de;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #8a8980;
    flex-shrink: 0;
  }
  .mono {
    font-family: 'DM Mono', monospace;
    font-size: 12px; background: #f8f8f6;
    border: 1px solid #e4e3de; border-radius: 4px;
    padding: 1px 6px; color: #5a5950;
  }

  .ad-footer {
    text-align: center; font-size: 11px; color: #c8c7c0;
    font-family: 'DM Mono', monospace; letter-spacing: 0.06em;
    margin-top: 4px;
  }

  /* ── Shared ── */
  .ad-input {
    width: 100%;
    border: 1.5px solid #e4e3de; border-radius: 10px;
    padding: 11px 14px;
    font-family: 'Sora', sans-serif;
    font-size: 14px; color: #111110;
    background: #ffffff; outline: none;
    text-align: center;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ad-input:focus { border-color: #111110; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
  .ad-input::placeholder { color: #c8c7c0; }

  .ad-btn-primary {
    width: 100%;
    background: #111110; color: #ffffff;
    border: none; border-radius: 10px;
    padding: 13px 20px;
    font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .ad-btn-primary:hover {
    background: #1e1d1b;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.18);
  }

  @keyframes adFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes adPulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
    50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
  }

  @media (max-width: 520px) {
    .ad-info-row { grid-template-columns: 1fr 1fr; }
    .ad-header { flex-direction: column; gap: 12px; align-items: flex-start; }
  }
`