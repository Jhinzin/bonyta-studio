import React, { useEffect, useRef } from 'react'
import { formatDateToISO, SHORT_DAYS } from '../utils'

export default function WeekDaysStrip({ selectedDate, onSelect, theme }) {
  const scrollRef = useRef(null)

  const isLight = theme === 'light';
  const textUnselected = isLight ? '#444444' : '#b3b3b3';
  const textLabelUnselected = isLight ? '#666666' : '#888888';
  const bgUnselected = isLight ? '#f0f0f0' : 'transparent';

  const days = Array.from({ length: 45 }, (_, i) => {
    const d = new Date(selectedDate)
    d.setDate(selectedDate.getDate() - 15 + i)
    return d
  })

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('.active')
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [selectedDate])

  return (
    <section 
      className="week-days-strip" 
      ref={scrollRef}
      style={{ 
        display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '6px 4px',
        borderBottom: isLight ? '1px solid #e0e0e0' : '1px solid #2a2a3c', alignItems: 'center',
        background: isLight ? '#ffffff' : '#0f0f14'
      }}
    >
      {days.map((d, i) => {
        const isSelected = formatDateToISO(d) === formatDateToISO(selectedDate)
        const isTodayReal = formatDateToISO(d) === formatDateToISO(new Date()) 
        const isFirstDayOfMonth = d.getDate() === 1
        const monthName = d.toLocaleDateString('pt-BR', { month: 'short' })

        return (
          <React.Fragment key={i}>
            {isFirstDayOfMonth && (
              <div style={{
                padding: '0 10px', color: 'var(--primary-color, #e91e63)', fontWeight: '800',
                textTransform: 'uppercase', fontSize: '0.7rem', borderLeft: isLight ? '2px dashed #ccc' : '2px dashed #444',
                height: '28px', display: 'flex', alignItems: 'center', flexShrink: 0
              }}>
                {monthName}
              </div>
            )}
            
            <div
              className={`day-strip-item ${isSelected ? 'active' : ''}`}
              onClick={() => onSelect(d)}
              style={{
                minWidth: '44px', padding: '6px 3px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer', borderRadius: '10px', flexShrink: 0,
                background: isSelected ? 'var(--primary-color, #e91e63)' : bgUnselected,
                color: isSelected ? '#fff' : textUnselected,
                margin: '0 2px',
                border: isTodayReal && !isSelected ? '2px solid var(--primary-color, #e91e63)' : '2px solid transparent',
                boxShadow: isLight && !isSelected ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ 
                fontSize: '0.64rem', 
                fontWeight: '700',
                color: isSelected ? '#fff' : (isTodayReal ? 'var(--primary-color, #e91e63)' : textLabelUnselected),
                textTransform: 'uppercase',
                marginBottom: '1px'
              }}>
                {SHORT_DAYS[d.getDay()]}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: '800' }}>
                {d.getDate()}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </section>
  )
}
