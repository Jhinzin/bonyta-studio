import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMsg('')

    if (isSignUp) {
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.')
        setSubmitting(false)
        return
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        setSubmitting(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      })

      if (signUpError) {
        setError(signUpError.message || 'Erro ao criar conta.')
      } else if (data.session) {
        setSession(data.session)
      } else {
        setSuccessMsg('Conta criada com sucesso! Você já pode entrar com seu e-mail e senha.')
        setIsSignUp(false)
        setPassword('')
        setConfirmPassword('')
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError('E-mail ou senha inválidos.')
    }

    setSubmitting(false)
  }

  if (checking) {
    return <div className="auth-screen"><div className="auth-card">Carregando...</div></div>
  }

  if (!session) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <span className="auth-logo">B</span>
          <h1>{isSignUp ? 'Criar conta da equipe' : 'Acesso da equipe'}</h1>
          <p>
            {isSignUp
              ? 'Cadastre seu login para acessar a agenda da equipe no Bonyta Studio.'
              : 'Entre para acessar agenda, clientes e finanças do Bonyta Studio.'}
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--bg-tertiary, #171721)', padding: '4px', borderRadius: '12px' }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                background: !isSignUp ? 'var(--primary-color, #e91e63)' : 'transparent',
                color: '#fff',
                fontWeight: !isSignUp ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                background: isSignUp ? 'var(--primary-color, #e91e63)' : 'transparent',
                color: '#fff',
                fontWeight: isSignUp ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              Criar conta
            </button>
          </div>

          {successMsg && (
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0', fontSize: '0.85rem', marginBottom: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <i className="fa-solid fa-check-circle" style={{ marginRight: '6px' }}></i> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            {isSignUp && (
              <label>Nome completo
                <input
                  type="text"
                  required
                  placeholder="Ex: Carol Silva"
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </label>
            )}

            <label>E-mail
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </label>

            <label>Senha
              <input
                type="password"
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
            </label>

            {isSignUp && (
              <label>Confirmar senha
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                />
              </label>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" disabled={submitting} style={{ marginTop: '8px' }}>
              {submitting
                ? (isSignUp ? 'Cadastrando...' : 'Entrando...')
                : (isSignUp ? 'Criar minha conta' : 'Entrar')}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <a href="/" style={{ color: 'var(--text-secondary, #aaa)', fontSize: '0.8rem', textDecoration: 'none' }}>
              Voltar para o site
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
    </>
  )
}
