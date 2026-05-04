import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function Calendario({ ventas = [], gastos = [] }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  // Build a map of day -> { ventas, gastos } from real data
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthData = {};

  ventas
    .filter(v => v.date?.startsWith(monthPrefix))
    .forEach(v => {
      if (!monthData[v.date]) monthData[v.date] = { ventas: 0, gastos: 0 };
      monthData[v.date].ventas += v.amount;
    });

  gastos
    .filter(g => g.date?.startsWith(monthPrefix))
    .forEach(g => {
      if (!monthData[g.date]) monthData[g.date] = { ventas: 0, gastos: 0 };
      monthData[g.date].gastos += g.amount;
    });

  const totalMonthVentas = Object.values(monthData).reduce((a, d) => a + d.ventas, 0);
  const totalMonthGastos = Object.values(monthData).reduce((a, d) => a + d.gastos, 0);

  // Weekly summary from real data
  const getWeeklyBalance = () => {
    const weeks = {};
    Object.entries(monthData).forEach(([dateStr, data]) => {
      const d = new Date(dateStr + 'T00:00:00');
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeks[weekKey]) weeks[weekKey] = { ventas: 0, gastos: 0 };
      weeks[weekKey].ventas += data.ventas;
      weeks[weekKey].gastos += data.gastos;
    });
    return Object.entries(weeks).map(([start, data]) => ({
      start,
      ...data,
      balance: data.ventas - data.gastos,
    }));
  };

  const weeklyData = getWeeklyBalance();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDay(null);
  };

  const dayKey = selectedDay
    ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const dayData = dayKey ? monthData[dayKey] : null;

  return (
    <div className="dashboard-content">
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-title"><TrendingUp size={16} /> Ventas del Mes</div>
          <div className="summary-value positive">${totalMonthVentas.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><TrendingDown size={16} /> Gastos del Mes</div>
          <div className="summary-value negative">${totalMonthGastos.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><CalendarIcon size={16} /> Balance Mensual</div>
          <div className={`summary-value ${totalMonthVentas - totalMonthGastos >= 0 ? 'positive' : 'negative'}`}>
            ${(totalMonthVentas - totalMonthGastos).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-header-nav">
          <button className="icon-btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
          <h2>{monthNames[currentMonth]} {currentYear}</h2>
          <button className="icon-btn" onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>

        <div className="calendar-grid">
          {dayNames.map(d => <div className="calendar-day-name" key={d}>{d}</div>)}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="calendar-cell empty"></div>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const data = monthData[key];
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
            const isSelected = day === selectedDay;
            return (
              <div
                key={day}
                className={`calendar-cell ${data ? 'has-data' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => data && setSelectedDay(day)}
              >
                <span className="day-number">{day}</span>
                {data && (
                  <span className={`day-amount ${data.ventas - data.gastos >= 0 ? 'gain' : 'loss'}`}>
                    ${((data.ventas - data.gastos) / 1000).toFixed(1)}k
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {dayData && (
        <div className="day-detail-card fade-in">
          <h3>Detalle del {selectedDay} de {monthNames[currentMonth]}</h3>
          <div className="day-detail-row">
            <span>Ventas</span><strong className="positive">${dayData.ventas.toLocaleString()}</strong>
          </div>
          <div className="day-detail-row">
            <span>Gastos</span><strong className="negative">-${dayData.gastos.toLocaleString()}</strong>
          </div>
          <div className="day-detail-row total">
            <span>Balance</span>
            <strong className={dayData.ventas - dayData.gastos >= 0 ? 'positive' : 'negative'}>
              ${(dayData.ventas - dayData.gastos).toLocaleString()}
            </strong>
          </div>
        </div>
      )}

      {weeklyData.length > 0 && (
        <>
          <div className="controls-bar" style={{ marginTop: '2rem' }}>
            <h2><CalendarIcon className="icon" /> Balance Semanal</h2>
          </div>
          <div className="entries-list">
            {weeklyData.map((w, idx) => (
              <div className="entry-card" key={idx}>
                <div className="entry-time">
                  <h3>Semana {idx + 1}</h3>
                  <p>Desde {w.start}</p>
                </div>
                <div className="entry-details">
                  <p>Ventas: <strong className="positive">${w.ventas.toLocaleString()}</strong> | Gastos: <strong className="negative">${w.gastos.toLocaleString()}</strong></p>
                </div>
                <div className={`entry-amount ${w.balance >= 0 ? 'positive' : 'negative'}`}>
                  ${w.balance.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {weeklyData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', marginTop: '2rem' }}>
          No hay ventas ni gastos registrados en este mes.
        </div>
      )}
    </div>
  );
}
