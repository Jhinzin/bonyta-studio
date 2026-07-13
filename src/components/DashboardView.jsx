import React, { useState } from 'react';

export default function DashboardView({ appointments, professionals, theme }) {
  const [refDate, setRefDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('numeros'); 
  const [dashProfFilter, setDashProfFilter] = useState('todos');
  
  const isLight = theme === 'light';
  const textMain = isLight ? '#333' : '#fff';
  const textSec = isLight ? '#666' : '#aaa';
  const bgMain = isLight ? '#f9f9f9' : '#121212';
  const bgCard = isLight ? '#ffffff' : '#1e1e1e';
  const borderCol = isLight ? '#eee' : '#333';

  const monthName = refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const prevMonth = () => setRefDate(new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1));
  const nextMonth = () => setRefDate(new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1));

  const currentMonthISO = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`;
  
  const validAppointments = appointments.filter(a => 
    a.status === 'concluido' && 
    a.date.startsWith(currentMonthISO) &&
    (dashProfFilter === 'todos' || a.professional_id === dashProfFilter)
  );

  const faturamentoBruto = validAppointments.reduce((sum, a) => sum + (Number(a.total_price) || 0), 0);
  const custosTotais = validAppointments.reduce((sum, a) => sum + (Number(a.total_cost) || 0), 0);
  const lucroLiquido = faturamentoBruto - custosTotais;

  // Prepara os dados para as colunas do gráfico
  const chartData = professionals
    .filter(p => dashProfFilter === 'todos' || p.id === dashProfFilter)
    .map(prof => {
      const profApps = validAppointments.filter(a => a.professional_id === prof.id);
      const totalValue = profApps.reduce((sum, a) => sum + (Number(a.total_price) || 0), 0);
      return { name: prof.name, value: totalValue };
    });

  // Descobre a coluna mais alta para servir de teto (100%)
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', background: bgMain, minHeight: '100vh' }}>
      
      {/* 1. SELETOR DE DUPLA VISÃO */}
      <div style={{ display: 'flex', justifyContent: 'center', background: bgCard, padding: '4px', borderRadius: '10px', marginBottom: '20px', border: `1px solid ${borderCol}` }}>
        <button onClick={() => setViewMode('numeros')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', background: viewMode === 'numeros' ? 'var(--primary-color, #e91e63)' : 'transparent', color: viewMode === 'numeros' ? '#fff' : textSec, transition: 'all 0.2s' }}>
          <i className="fa-solid fa-list-ol" style={{ marginRight: '6px' }}></i> Numérica
        </button>
        <button onClick={() => setViewMode('grafico')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', background: viewMode === 'grafico' ? 'var(--primary-color, #e91e63)' : 'transparent', color: viewMode === 'grafico' ? '#fff' : textSec, transition: 'all 0.2s' }}>
          <i className="fa-solid fa-chart-column" style={{ marginRight: '6px' }}></i> Gráfica
        </button>
      </div>

      {/* 2. FILTRO E NAVEGADOR DE MESES */}
      <div style={{ background: bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${borderCol}`, marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: textSec, marginBottom: '8px', fontWeight: 'bold' }}>Filtrar Desempenho por Profissional:</label>
        <select 
          value={dashProfFilter} 
          onChange={(e) => setDashProfFilter(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${borderCol}`, background: bgMain, color: textMain, outline: 'none', marginBottom: '16px', fontWeight: 'bold' }}
        >
          <option value="todos">Visão Geral do Estúdio (Todas)</option>
          {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={prevMonth} style={{ background: bgMain, border: `1px solid ${borderCol}`, color: textMain, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-chevron-left"></i></button>
          <h2 style={{ margin: 0, textTransform: 'capitalize', color: 'var(--primary-color, #e91e63)', fontSize: '1.1rem', fontWeight: '800' }}>{monthName}</h2>
          <button onClick={nextMonth} style={{ background: bgMain, border: `1px solid ${borderCol}`, color: textMain, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>

      {/* MODO 1: VISÃO DE NÚMEROS */}
      {viewMode === 'numeros' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary-color, #e91e63) 0%, #ff758c 100%)', borderRadius: '16px', padding: '24px', color: '#fff', boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px', fontWeight: '600' }}>Lucro Líquido</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '900' }}>R$ {lucroLiquido.toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, background: bgCard, borderRadius: '16px', padding: '16px', border: `1px solid ${borderCol}` }}>
                <div style={{ fontSize: '0.8rem', color: textSec, fontWeight: 'bold' }}>Faturamento</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10b981' }}>R$ {faturamentoBruto.toFixed(2)}</div>
              </div>
              <div style={{ flex: 1, background: bgCard, borderRadius: '16px', padding: '16px', border: `1px solid ${borderCol}` }}>
                <div style={{ fontSize: '0.8rem', color: textSec, fontWeight: 'bold' }}>Custos</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ef4444' }}>R$ {custosTotais.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <h3 style={{ fontSize: '1rem', color: textMain, marginBottom: '16px', borderBottom: `1px solid ${borderCol}`, paddingBottom: '8px', fontWeight: 'bold' }}>
            Comandas Fechadas ({validAppointments.length})
          </h3>
          {validAppointments.map(app => (
            <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgCard, padding: '16px', borderRadius: '12px', border: `1px solid ${borderCol}`, marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: textMain, fontSize: '0.95rem' }}>{app.client_name}</div>
                <div style={{ fontSize: '0.8rem', color: textSec, marginTop: '2px' }}>{app.date.split('-').reverse().join('/')} - {app.service}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '900', color: '#10b981' }}>R$ {Number(app.total_price).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* MODO 2: VISÃO GRÁFICA (COLUNAS VERTICAIS) */}
      {viewMode === 'grafico' && (
        <div style={{ background: bgCard, padding: '24px 16px', borderRadius: '16px', border: `1px solid ${borderCol}` }}>
          <h3 style={{ margin: '0 0 4px 0', color: textMain, fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>Comparativo de Receita</h3>
          <p style={{ margin: '0 0 32px 0', color: textSec, fontSize: '0.8rem', textAlign: 'center' }}>Faturamento bruto por profissional (Mês vigente)</p>

          {faturamentoBruto === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: textSec, fontStyle: 'italic' }}>
              Sem dados financeiros registrados neste mês.
            </div>
          ) : (
            // PALCO DO GRÁFICO (Flexbox alinhado por baixo)
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', // Faz as colunas grudarem no chão
              justifyContent: 'space-around', 
              height: '250px', // Altura fixa do gráfico
              paddingBottom: '10px', 
              borderBottom: `2px solid ${borderCol}`, // A linha de base (o "chão")
              marginTop: '20px' 
            }}>
              {chartData.map((data, idx) => {
                const percentage = (data.value / maxChartValue) * 100;
                
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                    
                    {/* Valor financeiro coroando a barra */}
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: textMain }}>
                      R$ {data.value.toFixed(0)}
                    </span>
                    
                    {/* A COLUNA VERTICAL */}
                    <div style={{
                      width: 'clamp(30px, 10vw, 60px)', // Largura da barra responsiva
                      height: `${percentage}%`, // A altura é definida pelo lucro!
                      minHeight: '4px', // Garante que se for R$ 0,00, aparece um tracinho
                      background: 'linear-gradient(to top, var(--primary-color, #e91e63) 0%, #ff758c 100%)',
                      borderRadius: '6px 6px 0 0', // Arredonda só o topo
                      transition: 'height 1s ease-in-out',
                      boxShadow: '0 4px 10px rgba(233, 30, 99, 0.2)'
                    }} />
                    
                  </div>
                );
              })}
            </div>
          )}

          {/* Eixo X: Nomes das profissionais embaixo das barras */}
          {faturamentoBruto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '12px' }}>
              {chartData.map((data, idx) => (
                <div key={`name-${idx}`} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: textSec, fontWeight: '700' }}>
                  {data.name.split(' ')[0]} {/* Pega apenas o 1º nome para não quebrar a tela */}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}