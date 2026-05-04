import React from 'react';
import { PieChart, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

export default function Estadisticas({ ventas = [], gastos = [] }) {

  // --- SEMANA ACTUAL (lunes a domingo) ---
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayNamesMonFirst = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Build weekly chart data (Mon–Sun)
  const weeklyData = dayNamesMonFirst.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const ventasDay = ventas.filter(v => v.date === dateStr).reduce((a, v) => a + v.amount, 0);
    const gastosDay = gastos.filter(g => g.date === dateStr).reduce((a, g) => a + g.amount, 0);
    return { day: label, ventas: ventasDay, gastos: gastosDay };
  });

  const totalVentas = weeklyData.reduce((a, d) => a + d.ventas, 0);
  const totalGastos = weeklyData.reduce((a, d) => a + d.gastos, 0);
  const diasConVentas = weeklyData.filter(d => d.ventas > 0).length;
  const promedio = diasConVentas > 0 ? Math.round(totalVentas / diasConVentas) : 0;
  const maxVentas = Math.max(...weeklyData.map(d => d.ventas), 1); // evitar división por 0

  // --- PRODUCTOS MÁS VENDIDOS (todas las ventas) ---
  const productMap = {};
  ventas.forEach(v => {
    if (!v.item) return;
    if (!productMap[v.item]) productMap[v.item] = { qty: 0, revenue: 0 };
    productMap[v.item].qty += 1;
    productMap[v.item].revenue += v.amount;
  });

  const topProducts = Object.entries(productMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxTopRevenue = Math.max(...topProducts.map(p => p.revenue), 1);

  const hasData = totalVentas > 0 || totalGastos > 0;

  return (
    <div className="dashboard-content">
      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="summary-card">
          <div className="summary-title"><TrendingUp size={16} /> Ventas Semana</div>
          <div className="summary-value positive">${totalVentas.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><TrendingDown size={16} /> Gastos Semana</div>
          <div className="summary-value negative">${totalGastos.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><BarChart2 size={16} /> Ganancia Neta</div>
          <div className={`summary-value ${totalVentas - totalGastos >= 0 ? 'positive' : 'negative'}`}>
            ${(totalVentas - totalGastos).toLocaleString()}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><PieChart size={16} /> Promedio Diario</div>
          <div className="summary-value">${promedio.toLocaleString()}</div>
        </div>
      </div>

      <div className="controls-bar">
        <h2><BarChart2 className="icon" /> Ventas vs Gastos (Esta Semana)</h2>
      </div>

      {hasData ? (
        <div className="chart-container">
          <div className="bar-chart">
            {weeklyData.map((d, i) => (
              <div className="bar-group" key={i}>
                <div className="bar-wrapper">
                  <div className="bar ventas-bar" style={{ height: `${(d.ventas / maxVentas) * 100}%` }}>
                    {d.ventas > 0 && <span className="bar-tooltip">${(d.ventas / 1000).toFixed(1)}k</span>}
                  </div>
                  <div className="bar gastos-bar" style={{ height: `${(d.gastos / maxVentas) * 100}%` }}>
                    {d.gastos > 0 && <span className="bar-tooltip">${(d.gastos / 1000).toFixed(1)}k</span>}
                  </div>
                </div>
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot ventas"></span> Ventas</span>
            <span className="legend-item"><span className="legend-dot gastos"></span> Gastos</span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          No hay ventas registradas esta semana todavía.
        </div>
      )}

      <div className="controls-bar" style={{ marginTop: '2rem' }}>
        <h2><PieChart className="icon" /> Productos Más Vendidos</h2>
      </div>

      {topProducts.length > 0 ? (
        <div className="top-products">
          {topProducts.map((p, i) => (
            <div className="top-product-row" key={i}>
              <span className="product-rank">#{i + 1}</span>
              <div className="product-name-col">
                <strong>{p.name}</strong>
                <span className="product-qty">{p.qty} {p.qty === 1 ? 'unidad vendida' : 'unidades vendidas'}</span>
              </div>
              <div className="product-bar-container">
                <div className="product-bar" style={{ width: `${(p.revenue / maxTopRevenue) * 100}%` }}></div>
              </div>
              <strong className="positive">${p.revenue.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          No hay productos vendidos aún.
        </div>
      )}
    </div>
  );
}
