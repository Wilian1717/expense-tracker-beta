'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const observerRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(prev => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('[data-observe]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const features = [
    { label: 'Track every cent', sub: 'Expenses & income', val: 'Rp 7.2jt', desc: 'spent this month' },
    { label: 'Set smart budgets', sub: 'Category limits', val: 'Rp 3.1jt', desc: 'under budget limit' },
    { label: 'Build your savings', sub: 'Goal tracking', val: '68%', desc: 'of goal reached' },
    { label: 'Know your bills', sub: 'Recurring payments', val: '5 bills', desc: 'tracked this month' },
  ]

  const featureCards = [
    { icon: '↕', title: 'Expense Tracking', desc: 'Log every transaction instantly. 10+ categories with full search, sort, and filtering.', tag: 'Core' },
    { icon: '◎', title: 'Budget Alerts', desc: 'Set monthly limits per category. Live warnings before you overspend — never go blind.', tag: 'Smart' },
    { icon: '◈', title: 'Savings Goals', desc: 'Name your goal, set a target, watch progress grow. Track multiple goals at once.', tag: 'Goals' },
    { icon: '⟳', title: 'Recurring Bills', desc: 'Add monthly, weekly, or daily bills. Paid status persists across sessions.', tag: 'Bills' },
    { icon: '◰', title: 'Smart Insights', desc: 'Automatic analysis. See trends, top spending categories, and projected spend.', tag: 'Analytics' },
    { icon: '⤓', title: 'CSV Export', desc: 'Download your full financial history any time as a clean spreadsheet.', tag: 'Export' },
  ]

  const testimonials = [
    { q: 'Finally a finance app that doesn\'t try to do too much. Just clean tracking.', name: 'A.P.', role: 'Freelancer' },
    { q: 'The budget alerts saved me from overspending on food three months in a row.', name: 'R.L.', role: 'Student' },
    { q: 'Bills stay paid after I log back in. That was always the issue with other apps.', name: 'W.N.', role: 'Professional' },
    { q: 'Savings goals feature is genuinely motivating. Watching the bar fill is satisfying.', name: 'D.K.', role: 'Designer' },
    { q: 'Simple, fast, and free. Recommended it to everyone on my team.', name: 'M.S.', role: 'Team Lead' },
    { q: 'Finally a finance app that doesn\'t try to do too much. Just clean tracking.', name: 'A.P.', role: 'Freelancer' },
    { q: 'The budget alerts saved me from overspending on food three months in a row.', name: 'R.L.', role: 'Student' },
    { q: 'Bills stay paid after I log back in. That was always the issue with other apps.', name: 'W.N.', role: 'Professional' },
    { q: 'Savings goals feature is genuinely motivating. Watching the bar fill is satisfying.', name: 'D.K.', role: 'Designer' },
    { q: 'Simple, fast, and free. Recommended it to everyone on my team.', name: 'M.S.', role: 'Team Lead' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --white: #ffffff;
          --off-white: #f8f8f6;
          --cream: #f2f1ed;
          --gray-1: #f0efeb;
          --gray-2: #e4e3de;
          --gray-3: #c8c7c0;
          --gray-4: #8a8980;
          --gray-5: #5a5950;
          --black: #111110;
          --black-soft: #1e1d1b;
          --accent: #111110;
        }

        html { scroll-behavior: smooth; }
        body {
          background: var(--white);
          color: var(--black);
          font-family: 'Sora', sans-serif;
          font-weight: 300;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          transition: all 0.4s ease;
        }
        .nav.scrolled {
          padding: 14px 48px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--gray-2);
          box-shadow: 0 1px 24px rgba(0,0,0,0.06);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .nav-logo-img {
          width: 32px; height: 32px;
          border-radius: 8px;
          object-fit: cover;
        }
        .nav-logo-text {
          font-size: 16px; font-weight: 700;
          color: var(--black);
          letter-spacing: -0.02em;
        }
        .nav-links {
          display: flex; align-items: center; gap: 36px; list-style: none;
        }
        .nav-links a {
          font-size: 13px; font-weight: 400;
          color: var(--gray-4);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--black); }
        .nav-cta { display: flex; gap: 8px; }

        /* ── Buttons ── */
        .btn {
          font-family: 'Sora', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.01em;
          text-decoration: none;
          padding: 10px 22px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-black {
          background: var(--black);
          color: var(--white);
        }
        .btn-black:hover { background: var(--black-soft); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .btn-outline {
          background: transparent;
          color: var(--black);
          border: 1.5px solid var(--gray-2);
        }
        .btn-outline:hover { border-color: var(--black); background: var(--gray-1); }
        .btn-lg { font-size: 14px; padding: 14px 32px; border-radius: 12px; }
        .btn-xl { font-size: 15px; padding: 16px 40px; border-radius: 14px; }

        /* ── Hero ── */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          text-align: center;
          padding: 120px 48px 80px;
          position: relative;
          overflow: hidden;
          background: var(--white);
        }
        .hero-bg {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,0,0,0.04) 0%, transparent 70%),
            linear-gradient(180deg, var(--off-white) 0%, var(--white) 30%);
        }
        .hero-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse 70% 50% at 50% 0%, black 0%, transparent 80%);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--gray-1);
          border: 1px solid var(--gray-2);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 11px; font-weight: 500;
          color: var(--gray-5);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 28px;
          position: relative; z-index: 1;
        }
        .hero-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.4); }
        }
        .hero-title {
          font-size: clamp(48px, 8vw, 96px);
          font-weight: 800;
          line-height: 1.0;
          letter-spacing: -0.04em;
          color: var(--black);
          margin-bottom: 24px;
          position: relative; z-index: 1;
          max-width: 800px;
        }
        .hero-title .accent-line {
          position: relative; display: inline-block;
        }
        .hero-title .accent-line::after {
          content: '';
          position: absolute;
          bottom: 4px; left: 0; right: 0;
          height: 6px;
          background: rgba(0,0,0,0.08);
          border-radius: 3px;
          z-index: -1;
        }
        .hero-sub {
          font-size: 17px; font-weight: 300;
          color: var(--gray-4);
          line-height: 1.7;
          max-width: 480px;
          margin: 0 auto 40px;
          position: relative; z-index: 1;
        }
        .hero-actions {
          display: flex; gap: 12px; align-items: center; justify-content: center;
          flex-wrap: wrap;
          position: relative; z-index: 1;
          margin-bottom: 64px;
        }
        .hero-social-proof {
          display: flex; align-items: center; gap: 16px;
          position: relative; z-index: 1;
        }
        .hero-avatars {
          display: flex;
        }
        .hero-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 2px solid var(--white);
          background: var(--gray-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600;
          color: var(--gray-5);
          margin-left: -8px;
        }
        .hero-avatar:first-child { margin-left: 0; }
        .hero-proof-text {
          font-size: 12px; color: var(--gray-4);
          font-weight: 400;
        }
        .hero-proof-text strong { color: var(--black); font-weight: 600; }

        /* ── Mock Dashboard Preview ── */
        .hero-preview {
          position: relative; z-index: 1;
          margin-top: 72px;
          width: 100%;
          max-width: 760px;
        }
        .preview-frame {
          background: var(--white);
          border: 1.5px solid var(--gray-2);
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.04),
            0 20px 60px rgba(0,0,0,0.1),
            0 60px 120px rgba(0,0,0,0.06);
          position: relative;
        }
        .preview-bar {
          background: var(--gray-1);
          border-bottom: 1px solid var(--gray-2);
          padding: 12px 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .preview-dot { width: 10px; height: 10px; border-radius: 50%; }
        .preview-url {
          flex: 1;
          background: var(--white);
          border: 1px solid var(--gray-2);
          border-radius: 6px;
          padding: 4px 12px;
          font-family: 'DM Mono', monospace;
          font-size: 11px; color: var(--gray-4);
          text-align: center;
          margin: 0 8px;
        }
        .preview-body {
          padding: 24px;
        }
        .preview-header-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px;
        }
        .preview-logo {
          display: flex; align-items: center; gap: 8px;
        }
        .preview-logo-box {
          width: 28px; height: 28px; border-radius: 7px;
          background: var(--black);
          overflow: hidden;
        }
        .preview-logo-box img { width: 100%; height: 100%; object-fit: cover; }
        .preview-logo-name {
          font-size: 13px; font-weight: 700; color: var(--black);
          letter-spacing: -0.02em;
        }
        .preview-header-btns {
          display: flex; gap: 6px;
        }
        .preview-btn-sm {
          padding: 5px 12px;
          border-radius: 7px;
          font-size: 10px; font-weight: 600;
          border: none; cursor: default;
        }
        .preview-btn-sm.light { background: var(--gray-1); color: var(--gray-5); border: 1px solid var(--gray-2); }
        .preview-btn-sm.dark { background: var(--black); color: var(--white); }
        .preview-greeting {
          font-size: 11px; color: var(--gray-4); margin-bottom: 12px;
        }
        .preview-greeting strong { color: var(--gray-5); font-weight: 600; }
        .preview-balance-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          margin-bottom: 14px;
        }
        .preview-bal-card {
          padding: 14px;
          border-radius: 12px;
        }
        .preview-bal-card.dark { background: var(--black); }
        .preview-bal-card.light { background: var(--gray-1); border: 1px solid var(--gray-2); }
        .preview-bal-label {
          font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .preview-bal-card.dark .preview-bal-label { color: rgba(255,255,255,0.5); }
        .preview-bal-card.light .preview-bal-label { color: var(--gray-4); }
        .preview-bal-val {
          font-size: 18px; font-weight: 700; line-height: 1;
          letter-spacing: -0.03em;
        }
        .preview-bal-card.dark .preview-bal-val { color: var(--white); }
        .preview-bal-card.light .preview-bal-val { color: var(--black); }
        .preview-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
          margin-bottom: 14px;
        }
        .preview-stat {
          background: var(--gray-1);
          border: 1px solid var(--gray-2);
          border-radius: 10px;
          padding: 10px;
        }
        .preview-stat-label { font-size: 8px; color: var(--gray-4); margin-bottom: 4px; text-transform: uppercase; font-weight: 500; letter-spacing: 0.06em; }
        .preview-stat-val { font-size: 13px; font-weight: 700; color: var(--black); }
        .preview-stat-sub { font-size: 8px; color: var(--gray-4); margin-top: 2px; }
        .preview-rows {
          display: flex; flex-direction: column; gap: 6px;
        }
        .preview-row {
          display: flex; align-items: center; gap: 10px;
          background: var(--off-white);
          border: 1px solid var(--gray-2);
          border-radius: 10px;
          padding: 9px 12px;
        }
        .preview-row-icon {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; flex-shrink: 0;
        }
        .preview-row-title { font-size: 11px; font-weight: 600; color: var(--black); }
        .preview-row-cat { font-size: 9px; color: var(--gray-4); }
        .preview-row-amount { margin-left: auto; font-size: 12px; font-weight: 700; color: var(--black); }
        .preview-row-date { font-size: 9px; color: var(--gray-4); text-align: right; }

        /* ── Ticker ── */
        .ticker {
          background: var(--black);
          color: var(--white);
          overflow: hidden;
          padding: 13px 0;
          white-space: nowrap;
        }
        .ticker-inner {
          display: inline-flex;
          animation: ticker 28s linear infinite;
        }
        .ticker-item {
          display: inline-flex; align-items: center; gap: 24px;
          padding-right: 60px;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
        }
        .ticker-item strong { color: var(--white); }
        .ticker-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.3); flex-shrink: 0; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── Section ── */
        .section { padding: 100px 48px; }
        .section-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gray-4);
          margin-bottom: 20px;
        }
        .section-tag::before {
          content: '';
          width: 24px; height: 1px;
          background: var(--gray-3);
        }
        .section-title {
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: var(--black);
          margin-bottom: 16px;
        }
        .section-sub {
          font-size: 16px; font-weight: 300;
          color: var(--gray-4);
          line-height: 1.7;
          max-width: 480px;
        }

        /* ── Fade in on scroll ── */
        [data-observe] {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        [data-observe].visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Stats ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border: 1.5px solid var(--gray-2);
          border-radius: 20px;
          overflow: hidden;
          margin-top: 60px;
        }
        .stat-box {
          padding: 48px 36px;
          border-right: 1.5px solid var(--gray-2);
          transition: background 0.3s;
        }
        .stat-box:last-child { border-right: none; }
        .stat-box:hover { background: var(--off-white); }
        .stat-num {
          font-size: clamp(40px, 4vw, 64px);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--black);
          line-height: 1;
          margin-bottom: 8px;
        }
        .stat-lbl {
          font-size: 12px; font-weight: 400;
          color: var(--gray-4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── Feature Cards ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5px;
          background: var(--gray-2);
          border: 1.5px solid var(--gray-2);
          border-radius: 20px;
          overflow: hidden;
          margin-top: 60px;
        }
        .feature-card {
          background: var(--white);
          padding: 40px 36px;
          position: relative;
          transition: background 0.25s;
        }
        .feature-card:hover { background: var(--off-white); }
        .feature-icon-box {
          width: 44px; height: 44px;
          background: var(--gray-1);
          border: 1.5px solid var(--gray-2);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          margin-bottom: 24px;
        }
        .feature-tag-pill {
          position: absolute; top: 28px; right: 28px;
          background: var(--gray-1);
          border: 1px solid var(--gray-2);
          border-radius: 100px;
          padding: 3px 10px;
          font-size: 9px; font-weight: 600;
          color: var(--gray-4);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .feature-title {
          font-size: 17px; font-weight: 700;
          color: var(--black);
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .feature-desc {
          font-size: 13px; font-weight: 300;
          color: var(--gray-4);
          line-height: 1.7;
        }

        /* ── Live Switcher ── */
        .live-panel {
          display: grid; grid-template-columns: 1fr 320px;
          gap: 0;
          border: 1.5px solid var(--gray-2);
          border-radius: 20px;
          overflow: hidden;
          margin-top: 60px;
        }
        .live-list { padding: 40px; border-right: 1.5px solid var(--gray-2); }
        .live-list-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gray-3);
          margin-bottom: 28px;
        }
        .live-item {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 0;
          border-bottom: 1px solid var(--gray-2);
          cursor: pointer;
          transition: all 0.2s;
        }
        .live-item:last-child { border-bottom: none; }
        .live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--gray-2);
          flex-shrink: 0;
          transition: background 0.3s;
        }
        .live-item.active .live-dot { background: var(--black); }
        .live-item-text { flex: 1; }
        .live-item-title {
          font-size: 15px; font-weight: 400;
          color: var(--gray-4);
          transition: color 0.3s;
        }
        .live-item.active .live-item-title { color: var(--black); font-weight: 600; }
        .live-item-sub { font-size: 11px; color: var(--gray-3); margin-top: 1px; }
        .live-display {
          background: var(--off-white);
          padding: 40px;
          display: flex; flex-direction: column; justify-content: center;
        }
        .live-display-tag {
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gray-4);
          margin-bottom: 16px;
        }
        .live-display-val {
          font-size: 52px; font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--black);
          line-height: 1;
          margin-bottom: 8px;
        }
        .live-display-sub { font-size: 13px; color: var(--gray-4); }

        /* ── How it works ── */
        .steps-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border: 1.5px solid var(--gray-2);
          border-radius: 20px;
          overflow: hidden;
          margin-top: 60px;
        }
        .step-card {
          padding: 48px 40px;
          border-right: 1.5px solid var(--gray-2);
          position: relative;
        }
        .step-card:last-child { border-right: none; }
        .step-num {
          font-size: 72px; font-weight: 800;
          letter-spacing: -0.06em;
          color: var(--gray-2);
          line-height: 1;
          margin-bottom: 28px;
        }
        .step-title {
          font-size: 18px; font-weight: 700;
          color: var(--black);
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .step-desc { font-size: 13px; font-weight: 300; color: var(--gray-4); line-height: 1.8; }
        .step-arrow {
          position: absolute; right: -16px; top: 48px;
          width: 32px; height: 32px;
          background: var(--white);
          border: 1.5px solid var(--gray-2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; color: var(--gray-4);
          z-index: 2;
        }

        /* ── Testimonials ── */
        .marquee-track {
          display: flex; gap: 16px;
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        .marquee-card {
          background: var(--off-white);
          border: 1.5px solid var(--gray-2);
          border-radius: 16px;
          padding: 28px 30px;
          width: 300px; flex-shrink: 0;
        }
        .marquee-quote {
          font-size: 13px; font-weight: 300;
          color: var(--gray-5);
          line-height: 1.8;
          margin-bottom: 20px;
        }
        .marquee-author { display: flex; align-items: center; gap: 10px; }
        .marquee-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: var(--gray-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          color: var(--gray-5);
        }
        .marquee-name { font-size: 12px; font-weight: 600; color: var(--black); }
        .marquee-role { font-size: 11px; color: var(--gray-4); }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── CTA ── */
        .cta-section {
          margin: 0 48px 100px;
          background: var(--black);
          border-radius: 24px;
          padding: 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-bg-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .cta-title {
          font-size: clamp(40px, 6vw, 80px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.0;
          color: var(--white);
          margin-bottom: 20px;
          position: relative; z-index: 1;
        }
        .cta-sub {
          font-size: 16px; font-weight: 300;
          color: rgba(255,255,255,0.5);
          margin-bottom: 40px;
          position: relative; z-index: 1;
        }
        .cta-actions {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          position: relative; z-index: 1;
        }
        .btn-white {
          background: var(--white);
          color: var(--black);
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 600;
          padding: 14px 32px;
          border-radius: 12px;
          border: none; cursor: pointer;
          transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 6px;
          text-decoration: none;
        }
        .btn-white:hover { background: var(--off-white); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .btn-ghost {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 500;
          padding: 14px 32px;
          border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.15);
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 6px;
          text-decoration: none;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); color: var(--white); }
        .cta-note {
          font-family: 'DM Mono', monospace;
          font-size: 10px; color: rgba(255,255,255,0.25);
          letter-spacing: 0.1em;
          margin-top: 20px;
          position: relative; z-index: 1;
        }

        /* ── Footer ── */
        footer {
          padding: 60px 48px 40px;
          border-top: 1.5px solid var(--gray-2);
        }
        .footer-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 60px;
        }
        .footer-brand { max-width: 240px; }
        .footer-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .footer-logo-img { width: 28px; height: 28px; border-radius: 7px; object-fit: cover; }
        .footer-logo-name { font-size: 15px; font-weight: 700; color: var(--black); letter-spacing: -0.02em; }
        .footer-tagline { font-size: 12px; color: var(--gray-4); line-height: 1.6; }
        .footer-links { display: flex; gap: 64px; }
        .footer-col-title { font-size: 11px; font-weight: 600; color: var(--black); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
        .footer-col-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-col-list a { font-size: 13px; color: var(--gray-4); text-decoration: none; transition: color 0.2s; }
        .footer-col-list a:hover { color: var(--black); }
        .footer-bottom {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 24px;
          border-top: 1px solid var(--gray-2);
        }
        .footer-copy { font-size: 12px; color: var(--gray-4); }
        .footer-badge {
          font-family: 'DM Mono', monospace;
          font-size: 10px; color: var(--gray-4);
          letter-spacing: 0.08em;
          background: var(--gray-1);
          border: 1px solid var(--gray-2);
          padding: 5px 12px; border-radius: 100px;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .nav { padding: 16px 20px; }
          .nav.scrolled { padding: 12px 20px; }
          .nav-links { display: none; }
          .hero { padding: 100px 20px 60px; }
          .section { padding: 72px 20px; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .stat-box:nth-child(2) { border-right: none; }
          .stat-box:nth-child(1), .stat-box:nth-child(2) { border-bottom: 1.5px solid var(--gray-2); }
          .features-grid { grid-template-columns: 1fr; }
          .live-panel { grid-template-columns: 1fr; }
          .live-display { border-top: 1.5px solid var(--gray-2); }
          .steps-grid { grid-template-columns: 1fr; }
          .step-card { border-right: none; border-bottom: 1.5px solid var(--gray-2); }
          .step-card:last-child { border-bottom: none; }
          .step-arrow { display: none; }
          .cta-section { margin: 0 20px 80px; padding: 60px 32px; }
          .footer-top { flex-direction: column; gap: 40px; }
          .footer-links { gap: 40px; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="#" className="nav-logo">
          <img src="/logo.png" alt="ExpenseFlow" className="nav-logo-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <span className="nav-logo-text">ExpenseFlow</span>
        </a>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
        </ul>
        <div className="nav-cta">
          <button className="btn btn-outline" onClick={() => router.push('/login')}>Sign in</button>
          <button className="btn btn-black" onClick={() => router.push('/register')}>Get started →</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-dots" />

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Free forever · No credit card needed
        </div>

        <h1 className="hero-title">
          Know where your<br />
          <span className="accent-line">money goes.</span>
        </h1>

        <p className="hero-sub">
          ExpenseFlow is the personal finance tracker built for people who take money seriously — clean, fast, and completely free.
        </p>

        <div className="hero-actions">
          <button className="btn btn-black btn-xl" onClick={() => router.push('/register')}>
            Start tracking free →
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => router.push('/login')}>
            Sign in
          </button>
        </div>

        <div className="hero-social-proof">
          <div className="hero-avatars">
            {['A','R','W','D','M'].map((l, i) => (
              <div key={i} className="hero-avatar">{l}</div>
            ))}
          </div>
          <p className="hero-proof-text"><strong>100+ users</strong> tracking finances with ExpenseFlow</p>
        </div>

        {/* Dashboard Preview */}
        <div className="hero-preview">
          <div className="preview-frame">
            <div className="preview-bar">
              <div className="preview-dot" style={{ background: '#FF5F57' }} />
              <div className="preview-dot" style={{ background: '#FEBC2E' }} />
              <div className="preview-dot" style={{ background: '#28C840' }} />
              <div className="preview-url">expenseflow.app/dashboard</div>
            </div>
            <div className="preview-body">
              <div className="preview-header-row">
                <div className="preview-logo">
                  <div className="preview-logo-box">
                    <img src="/logo.png" alt="" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                  </div>
                  <span className="preview-logo-name">ExpenseFlow</span>
                </div>
                <div className="preview-header-btns">
                  <span className="preview-btn-sm light">Income</span>
                  <span className="preview-btn-sm dark">+ Expense</span>
                </div>
              </div>

              <div className="preview-greeting">Welcome back, <strong>Alex</strong></div>

              <div className="preview-balance-row">
                <div className="preview-bal-card dark">
                  <div className="preview-bal-label">Total Balance</div>
                  <div className="preview-bal-val">Rp 42.1jt</div>
                </div>
                <div className="preview-bal-card light">
                  <div className="preview-bal-label">This Month</div>
                  <div className="preview-bal-val">Rp 8.3jt</div>
                </div>
              </div>

              <div className="preview-stats">
                {[
                  { l: 'Income', v: 'Rp 15.5jt', s: '2 entries' },
                  { l: 'Expenses', v: 'Rp 7.2jt', s: '↓ 12%' },
                  { l: 'Spend Rate', v: '46%', s: 'Of income' },
                  { l: 'Avg/day', v: 'Rp 240k', s: 'This month' },
                ].map(s => (
                  <div key={s.l} className="preview-stat">
                    <div className="preview-stat-label">{s.l}</div>
                    <div className="preview-stat-val">{s.v}</div>
                    <div className="preview-stat-sub">{s.s}</div>
                  </div>
                ))}
              </div>

              <div className="preview-rows">
                {[
                  { icon: '🍜', bg: '#f0fdf4', title: 'Lunch', cat: 'Food & dining', amount: '- Rp 45k', date: 'Today' },
                  { icon: '⚡', bg: '#ecfeff', title: 'Electricity', cat: 'Utilities', amount: '- Rp 220k', date: 'May 4' },
                  { icon: '🛍', bg: '#fffbeb', title: 'Groceries', cat: 'Shopping', amount: '- Rp 180k', date: 'May 3' },
                ].map(r => (
                  <div key={r.title} className="preview-row">
                    <div className="preview-row-icon" style={{ background: r.bg }}>{r.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="preview-row-title">{r.title}</div>
                      <div className="preview-row-cat">{r.cat}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="preview-row-amount">{r.amount}</div>
                      <div className="preview-row-date">{r.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="ticker">
        <div className="ticker-inner">
          {[...Array(2)].map((_, outer) => (
            ['Track Expenses', 'Monitor Income', 'Set Budgets', 'Build Savings', 'Manage Bills', 'Smart Insights', 'Export CSV', 'Free Forever'].map((item, i) => (
              <span key={`${outer}-${i}`} className="ticker-item">
                <strong>{item}</strong>
                <span className="ticker-dot" />
              </span>
            ))
          ))}
        </div>
      </div>

      {/* ── About ── */}
      <section className="section" id="about">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            id="about-head"
            data-observe
            className={visible['about-head'] ? 'visible' : ''}
          >
            <div className="section-tag">01 — What is ExpenseFlow</div>
            <h2 className="section-title">Built for clarity.<br />Designed for action.</h2>
            <p className="section-sub">
              Everything you need to understand and control your personal finances — without the complexity.
            </p>
          </div>

          <div
            id="stats-grid"
            data-observe
            className={visible['stats-grid'] ? 'visible' : ''}
            style={{ transitionDelay: '0.1s' }}
          >
            <div className="stats-grid">
              {[
                { n: '100%', l: 'Free to use' },
                { n: '<1s', l: 'Load time' },
                { n: '10+', l: 'Categories' },
                { n: '∞', l: 'Transactions' },
              ].map(s => (
                <div key={s.l} className="stat-box">
                  <div className="stat-num">{s.n}</div>
                  <div className="stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section" id="features" style={{ paddingTop: 0 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            id="feat-head"
            data-observe
            className={visible['feat-head'] ? 'visible' : ''}
          >
            <div className="section-tag">02 — Features</div>
            <h2 className="section-title">Every tool you need.</h2>
            <p className="section-sub">Six core features that cover the full picture of your personal finances.</p>
          </div>

          <div
            id="feat-grid"
            data-observe
            className={visible['feat-grid'] ? 'visible' : ''}
            style={{ transitionDelay: '0.15s' }}
          >
            <div className="features-grid">
              {featureCards.map(f => (
                <div key={f.title} className="feature-card">
                  <div className="feature-tag-pill">{f.tag}</div>
                  <div className="feature-icon-box">{f.icon}</div>
                  <div className="feature-title">{f.title}</div>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Live switcher */}
          <div
            id="live-panel"
            data-observe
            className={visible['live-panel'] ? 'visible' : ''}
            style={{ transitionDelay: '0.2s', marginTop: 60 }}
          >
            <div className="live-panel">
              <div className="live-list">
                <div className="live-list-label">What you can do</div>
                {features.map((f, i) => (
                  <div
                    key={i}
                    className={`live-item ${activeFeature === i ? 'active' : ''}`}
                    onClick={() => setActiveFeature(i)}
                  >
                    <div className="live-dot" />
                    <div className="live-item-text">
                      <div className="live-item-title">{f.label}</div>
                      <div className="live-item-sub">{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="live-display">
                <div className="live-display-tag">{features[activeFeature].sub}</div>
                <div className="live-display-val">{features[activeFeature].val}</div>
                <div className="live-display-sub">{features[activeFeature].desc}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <div style={{ padding: '60px 0', overflow: 'hidden', borderTop: '1.5px solid var(--gray-2)', borderBottom: '1.5px solid var(--gray-2)' }}>
        <div className="marquee-track">
          {testimonials.map((t, i) => (
            <div key={i} className="marquee-card">
              <p className="marquee-quote">"{t.q}"</p>
              <div className="marquee-author">
                <div className="marquee-avatar">{t.name[0]}</div>
                <div>
                  <div className="marquee-name">{t.name}</div>
                  <div className="marquee-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="section" id="how">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            id="how-head"
            data-observe
            className={visible['how-head'] ? 'visible' : ''}
          >
            <div className="section-tag">03 — How it works</div>
            <h2 className="section-title">Simple. Powerful.</h2>
            <p className="section-sub">Up and running in under 60 seconds.</p>
          </div>

          <div
            id="steps"
            data-observe
            className={visible['steps'] ? 'visible' : ''}
            style={{ transitionDelay: '0.15s' }}
          >
            <div className="steps-grid">
              {[
                { n: '1', title: 'Create your account', desc: 'Sign up in under 30 seconds. No credit card, no trial period — ExpenseFlow is completely free.' },
                { n: '2', title: 'Add income & expenses', desc: 'Log your money in and out. Set category budgets, add recurring bills, and create savings goals.' },
                { n: '3', title: 'Track and grow', desc: 'Watch your dashboard fill with insights. Get alerts, hit savings targets, and export your data.' },
              ].map((s, i) => (
                <div key={s.n} className="step-card">
                  {i < 2 && <div className="step-arrow">→</div>}
                  <div className="step-num">{s.n}</div>
                  <div className="step-title">{s.title}</div>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div
        id="cta-block"
        data-observe
        className={visible['cta-block'] ? 'visible' : ''}
      >
        <div className="cta-section">
          <div className="cta-bg-grid" />
          <h2 className="cta-title">Start today.<br />It's free.</h2>
          <p className="cta-sub">No subscription. No hidden costs. Just a clean dashboard that helps you own your finances.</p>
          <div className="cta-actions">
            <button className="btn-white" onClick={() => router.push('/register')}>
              Create account →
            </button>
            <button className="btn-ghost" onClick={() => router.push('/login')}>
              Already have an account
            </button>
          </div>
          <p className="cta-note">Free · No credit card · Indonesian Rupiah (IDR)</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/logo.png" alt="" className="footer-logo-img" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
              <span className="footer-logo-name">ExpenseFlow</span>
            </div>
            <p className="footer-tagline">Personal finance tracking for people who mean business.</p>
          </div>
          <div className="footer-links">
            <div>
              <div className="footer-col-title">Product</div>
              <ul className="footer-col-list">
                <li><a href="#features">Features</a></li>
                <li><a href="#how">How it works</a></li>
                <li><a href="#about">About</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Account</div>
              <ul className="footer-col-list">
                <li><a href="#" onClick={e => { e.preventDefault(); router.push('/login') }}>Sign in</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); router.push('/register') }}>Register</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); router.push('/dashboard') }}>Dashboard</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 ExpenseFlow. Personal use only.</span>
          <span className="footer-badge">Next.js + Supabase</span>
        </div>
      </footer>
    </>
  )
}