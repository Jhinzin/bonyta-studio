import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const COLOR_OPTIONS = [
  { value: 'pink',        label: 'Rosa',        bg: '#d4145a' },
  { value: 'dark-pink',   label: 'Pink Escuro', bg: '#8b004d' },
  { value: 'purple',      label: 'Roxo',        bg: '#7c3aed' },
  { value: 'blue',        label: 'Azul',        bg: '#2563eb' },
  { value: 'teal',        label: 'Turquesa',    bg: '#0d9488' },
  { value: 'green',       label: 'Verde',       bg: '#16a34a' },
  { value: 'orange',      label: 'Laranja',     bg: '#ea580c' },
  { value: 'black-theme', label: 'Preto',       bg: '#374151' },
]

export default function AuthGate({ children }) {
  const [session, setSession]       = useState(null)
  const [checking, setChecking]     = useState(true)
  const [authMode, setAuthMode]     = useState('login')  // 'login' | 'signup'
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [fullName, setFullName]     = useState('')
  const [phone, setPhone]           = useState('')
  const [color, setColor]           = useState('pink')
  const [error, setError]           = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setChecking(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // ── Login ────────────────────────────────────────────────
  const signIn = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError('E-mail ou senha inválidos. Verifique e tente novamente.')
    setSubmitting(false)
  }

  // ── Cadastro ─────────────────────────────────────────────
  const signUp = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!fullName.trim()) { setError('Informe seu nome completo.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirmPass) { setError('As senhas não coincidem.'); return }

    setSubmitting(true)

    // 1. Cria o usuário no Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message || 'Erro ao criar conta. Tente novamente.')
      setSubmitting(false)
      return
    }

    // 2. Se o email precisar de confirmação, avisa e encerra
    if (!signUpData?.session) {
      setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.')
      setSubmitting(false)
      setAuthMode('login')
      return
    }

    // 3. Cria profissional + perfil de acesso automaticamente via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('register_professional_account', {
      p_name:  fullName.trim(),
      p_phone: phone.replace(/\D/g, '') || null,
      p_color: color
    })

    if (rpcError || rpcData?.success === false) {
      setError(rpcData?.error || rpcError?.message || 'Erro ao configurar o perfil. Fale com a responsável.')
      setSubmitting(false)
      return
    }

    // Sucesso — o onAuthStateChange vai setar session e liberar o app
    setSubmitting(false)
  }

  const resetForm = () => {
    setError('')
    setSuccessMsg('')
    setEmail('')
    setPassword('')
    setConfirmPass('')
    setFullName('')
    setPhone('')
    setColor('pink')
  }

  const switchMode = (mode) => {
    resetForm()
    setAuthMode(mode)
  }

  // ── Loading ──────────────────────────────────────────────
  if (checking) {
    return (
      <div className="auth-screen">
        <div className="auth-card" style={{ textAlign: 'center', gap: 12 }}>
          <span className="auth-logo">B</span>
          <p>Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // ── Sessão ativa → renderiza o app ───────────────────────
  if (session) return <>{children}</>

  // ── Telas de auth ────────────────────────────────────────
  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span className="auth-logo">B</span>
          <h1 style={{ textAlign: 'center', fontSize: '1.5rem' }}>
            {authMode === 'login' ? 'Acesso da equipe' : 'Criar conta de profissional'}
          </h1>
          {authMode === 'login' && (
            <p style={{ fontSize: '0.85rem' }}>Entre para acessar a agenda do Bonyta Studio.</p>
          )}
        </div>

        {/* Toggle Login / Cadastro */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#0a090f',
          borderRadius: 12,
          padding: 4,
          border: '1px solid #2a1a24'
        }}>
          {[
            { id: 'login', label: 'Entrar' },
            { id: 'signup', label: 'Criar conta' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchMode(tab.id)}
              style={{
                padding: '10px 0',
                borderRadius: 9,
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: authMode === tab.id
                  ? 'linear-gradient(135deg, #d4145a, #8b004d)'
                  : 'transparent',
                color: authMode === tab.id ? '#fff' : '#aa9ba2',
                boxShadow: authMode === tab.id ? '0 4px 14px rgba(212,20,90,0.35)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── FORMULÁRIO LOGIN ── */}
        {authMode === 'login' && (
          <form onSubmit={signIn} style={{ display: 'grid', gap: 14 }}>
            <label>E-mail
              <input
                type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>Senha
              <input
                type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </label>
            {error && <div className="auth-error">{error}</div>}
            {successMsg && (
              <div style={{ ...successStyle }}>{successMsg}</div>
            )}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
            <a href="/" style={{ fontSize: '0.82rem' }}>Voltar para o site</a>
          </form>
        )}

        {/* ── FORMULÁRIO CADASTRO ── */}
        {authMode === 'signup' && (
          <form onSubmit={signUp} style={{ display: 'grid', gap: 14 }}>
            <label>Nome completo *
              <input
                type="text" required placeholder="Ex: Juliana Mendes"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>WhatsApp
              <input
                type="tel" placeholder="(11) 99999-9999"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>E-mail *
              <input
                type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>Senha * <small style={{ color: '#aa9ba2', marginLeft: 4 }}>(mín. 6 caracteres)</small>
              <input
                type="password" required autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>Confirmar senha *
              <input
                type="password" required autoComplete="new-password"
                value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                style={inputStyle}
              />
            </label>

            {/* Seletor de Cor */}
            <div>
              <span style={{ color: '#d8ccd2', fontSize: '0.8rem', display: 'block', marginBottom: 8 }}>
                Cor na agenda
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.label}
                    onClick={() => setColor(opt.value)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none',
                      background: opt.bg, cursor: 'pointer',
                      outline: color === opt.value ? `3px solid #fff` : '3px solid transparent',
                      outlineOffset: 2,
                      transform: color === opt.value ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s'
                    }}
                  />
                ))}
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {successMsg && <div style={successStyle}>{successMsg}</div>}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Criando conta...' : 'Criar minha conta'}
            </button>
            <p style={{ fontSize: '0.78rem', textAlign: 'center' }}>
              Seu acesso ficará ativo assim que a responsável confirmar o cadastro.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 7,
  padding: '11px 14px',
  background: '#0a090f',
  border: '1px solid #2a1a24',
  borderRadius: 10,
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none'
}

const successStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  background: 'rgba(16, 185, 129, 0.14)',
  color: '#6ee7b7',
  fontSize: '0.85rem'
}
