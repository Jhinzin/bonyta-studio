import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
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

  const signIn = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError('E-mail ou senha inválidos.')
    setSubmitting(false)
  }

  if (checking) {
    return <div className="auth-screen"><div className="auth-card">Carregando...</div></div>
  }

  if (!session) {
    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={signIn}>
          <span className="auth-logo">B</span>
          <h1>Acesso da equipe</h1>
          <p>Entre para acessar agenda, clientes e finanças do Bonyta Studio.</p>
          <label>E-mail
            <input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          <label>Senha
            <input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={submitting}>{submitting ? 'Entrando...' : 'Entrar'}</button>
          <a href="/">Voltar para o site</a>
        </form>
      </div>
    )
  }

  return (
    <>
      {children}
      <button className="auth-signout" type="button" onClick={() => supabase.auth.signOut()} title="Sair do painel">
        <i className="fa-solid fa-arrow-right-from-bracket" />
      </button>
    </>
  )
}
