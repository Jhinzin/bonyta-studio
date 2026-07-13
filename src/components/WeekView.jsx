import { formatDateToISO } from '../utils'

export default function WeekView({ appointments, selectedDate, profFilter, professionals }) {
  const startOfWeek = new Date(selectedDate)
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())

  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i + 1) // Seg a Sáb
    return d
  })

  return (
    <div className="weekly-cards-container">
      {days.map((d, i) => {
        const iso = formatDateToISO(d)
        const dayApps = appointments.filter(
          (a) => a.date === iso && (profFilter === 'todos' || a.professional_id === profFilter)
        )
        return (
          <div className="weekly-day-board" key={i}>
            <h4>{d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</h4>
            {dayApps.length === 0 ? (
              <div className="weekly-board-row" style={{ color: 'var(--text-secondary)' }}>
                Nenhum procedimento agendado
              </div>
            ) : (
              dayApps.map((app) => (
                <div className="weekly-board-row" key={app.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><b>{app.time.slice(0, 5)}</b> - {app.client_name}</span>
                    <span style={{ color: 'var(--accent-pink)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {(professionals.find((p) => p.id === app.professional_id)?.name || '').toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{app.service} ({app.duration_minutes}m)</span>
                  
                  {/* Observação na Semana */}
                  {app.observation && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic', background: 'var(--bg-color)', padding: '4px', borderRadius: '4px' }}>
                      <i className="fa-solid fa-circle-info" style={{ marginRight: '4px' }}></i>
                      {app.observation}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
