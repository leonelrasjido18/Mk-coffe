import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity, Plus, Save, Calendar, X, Truck } from 'lucide-react';
import { API_URL } from '../config';
import { catalogProducts } from '../data';

export default function Resumen({ onNavigate, ventas, setVentas, gastos, setGastos }) {
  const [showVentaForm, setShowVentaForm] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);

  // Venta form
  const [ventaForm, setVentaForm] = useState({
    customer: '', item: '', amount: '', method: 'Efectivo',
    isAlmuerzo: false, conEnvio: false,
    envioAmount: '', envioPagoCliente: 'Transferencia', envioPagoNosotros: 'Efectivo',
  });

  // Gasto form
  const categories = ['Insumos', 'Servicios', 'Descartables', 'Personal', 'Envíos', 'Otros'];
  const [gastoForm, setGastoForm] = useState({ concept: '', amount: '', category: 'Insumos' });

  const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getLocalToday();

  // Calculate summaries from global state
  const gananciaHoy = ventas.filter(v => v.date === todayStr).reduce((a, v) => a + v.amount, 0);
  const gastosHoy = gastos.filter(g => g.date === todayStr).reduce((a, g) => a + g.amount, 0);
  const balanceHoy = gananciaHoy - gastosHoy;
  
  // Envíos
  const enviosHoy = ventas.filter(v => v.date === todayStr && v.conEnvio).reduce((a, v) => a + v.envioAmount, 0);

  // --- SEMANA: lunes al domingo de la semana actual ---
  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0=domingo, 1=lunes...
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };
  const { monday, sunday } = getWeekRange();
  const inWeek = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d >= monday && d <= sunday;
  };

  const gananciaSemana = ventas.filter(v => inWeek(v.date)).reduce((a, v) => a + v.amount, 0);
  const gastosSemana = gastos.filter(g => inWeek(g.date)).reduce((a, g) => a + g.amount, 0);
  const balanceSemana = gananciaSemana - gastosSemana;

  // --- MES: mes calendario actual ---
  const currentMonth = todayStr.slice(0, 7); // "YYYY-MM"
  const gananciaMes = ventas.filter(v => v.date?.startsWith(currentMonth)).reduce((a, v) => a + v.amount, 0);
  const gastosMes = gastos.filter(g => g.date?.startsWith(currentMonth)).reduce((a, g) => a + g.amount, 0);
  const balanceMes = gananciaMes - gastosMes;

  const handleAddVenta = () => {
    if (!ventaForm.item || !ventaForm.amount) return;
    
    let finalCustomerName = ventaForm.customer.trim();
    if (!finalCustomerName) {
      finalCustomerName = `Venta ${ventas.length + 1}`;
    }
    
    const newVenta = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      date: todayStr,
      item: ventaForm.item,
      customer: finalCustomerName,
      amount: parseInt(ventaForm.amount),
      method: ventaForm.method,
      isAlmuerzo: ventaForm.isAlmuerzo,
      conEnvio: ventaForm.isAlmuerzo ? ventaForm.conEnvio : false,
      envioAmount: ventaForm.conEnvio ? parseInt(ventaForm.envioAmount || 0) : 0,
      envioPagoCliente: ventaForm.envioPagoCliente,
      envioPagoNosotros: ventaForm.envioPagoNosotros,
      status: 'Completado'
    };

    fetch(`${API_URL}/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVenta)
    }).then(res => {
      if (res.ok) {
        setVentas([newVenta, ...ventas]);
        setVentaForm({
          customer: '', item: '', amount: '', method: 'Efectivo',
          isAlmuerzo: false, conEnvio: false,
          envioAmount: '', envioPagoCliente: 'Transferencia', envioPagoNosotros: 'Efectivo',
        });
        setShowVentaForm(false);
      }
    }).catch(console.error);
  };

  const handleAddGasto = () => {
    if (!gastoForm.concept || !gastoForm.amount) return;
    
    const newGasto = {
      id: Date.now(),
      date: todayStr,
      concept: gastoForm.concept,
      amount: parseInt(gastoForm.amount),
      category: gastoForm.category,
    };

    fetch(`${API_URL}/gastos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGasto)
    }).then(res => {
      if (res.ok) {
        setGastos([newGasto, ...gastos]);
        setGastoForm({ concept: '', amount: '', category: 'Insumos' });
        setShowGastoForm(false);
      }
    }).catch(console.error);
  };

  return (
    <div className="dashboard-content">
      {/* Tarjetas principales */}
      <div className="resumen-grid">
        <div className="resumen-card highlight-card">
          <div className="resumen-card-header">
            <div className="resumen-icon-circle day"><DollarSign size={24} /></div>
            <span className="resumen-period">HOY</span>
          </div>
          <div>
            <div className="resumen-main-value positive">${balanceHoy.toLocaleString()}</div>
            <div className="resumen-sub-row">
              <span><TrendingUp size={14} /> Ventas: <strong>${gananciaHoy.toLocaleString()}</strong></span>
              <span><TrendingDown size={14} /> Gastos: <strong className="negative">${gastosHoy.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <div className="resumen-card">
          <div className="resumen-card-header">
            <div className="resumen-icon-circle week"><Calendar size={24} /></div>
            <span className="resumen-period">SEMANA</span>
          </div>
          <div>
            <div className="resumen-main-value positive">${balanceSemana.toLocaleString()}</div>
            <div className="resumen-sub-row">
              <span><TrendingUp size={14} /> ${gananciaSemana.toLocaleString()}</span>
              <span><TrendingDown size={14} /> <span className="negative">${gastosSemana.toLocaleString()}</span></span>
            </div>
          </div>
        </div>

        <div className="resumen-card">
          <div className="resumen-card-header">
            <div className="resumen-icon-circle month"><TrendingUp size={24} /></div>
            <span className="resumen-period">MES</span>
          </div>
          <div>
            <div className="resumen-main-value positive">${balanceMes.toLocaleString()}</div>
            <div className="resumen-sub-row">
              <span><TrendingUp size={14} /> ${gananciaMes.toLocaleString()}</span>
              <span><TrendingDown size={14} /> <span className="negative">${gastosMes.toLocaleString()}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle del día */}
      <div className="resumen-detail-row">
        <div className="resumen-detail-item">
          <DollarSign size={18} />
          <div>
            <span className="detail-label">Ventas del Día</span>
            <strong className="positive">${gananciaHoy.toLocaleString()}</strong>
          </div>
        </div>
        <div className="resumen-detail-item">
          <Activity size={18} />
          <div>
            <span className="detail-label">Gastos del Día</span>
            <strong className="negative">${gastosHoy.toLocaleString()}</strong>
          </div>
        </div>
        <div className="resumen-detail-item">
          <TrendingUp size={18} />
          <div>
            <span className="detail-label">Balance Neto Hoy</span>
            <strong className={balanceHoy >= 0 ? 'positive' : 'negative'}>${balanceHoy.toLocaleString()}</strong>
          </div>
        </div>
        <div className="resumen-detail-item">
          <Activity size={18} />
          <div>
            <span className="detail-label">Envíos del Día</span>
            <strong style={{ color: 'var(--warning-text)' }}>${enviosHoy.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="resumen-actions">
        <button className="resumen-action-btn ventas" onClick={() => { setShowVentaForm(!showVentaForm); setShowGastoForm(false); }}>
          <div className="action-btn-icon"><Plus size={28} /></div>
          <div className="action-btn-text">
            <strong>Agregar Venta</strong>
            <span>Registrar nueva venta del día</span>
          </div>
        </button>

        <button className="resumen-action-btn gastos" onClick={() => { setShowGastoForm(!showGastoForm); setShowVentaForm(false); }}>
          <div className="action-btn-icon"><Activity size={28} /></div>
          <div className="action-btn-text">
            <strong>Añadir Gasto</strong>
            <span>Registrar un gasto nuevo</span>
          </div>
        </button>

        <button className="resumen-action-btn cierre" onClick={() => onNavigate('cierre')}>
          <div className="action-btn-icon"><Save size={28} /></div>
          <div className="action-btn-text">
            <strong>Cerrar Caja</strong>
            <span>Balance y cierre diario</span>
          </div>
        </button>
      </div>

      {/* ========== FORMULARIO DE VENTA (POPUP) ========== */}
      {showVentaForm && (
        <div className="modal-overlay fade-in" onClick={(e) => { if (e.target.className.includes('modal-overlay')) setShowVentaForm(false); }}>
          <div className="form-card modal-form-card fade-in">
          <div className="form-header">
            <h3>Registrar Venta</h3>
            <button className="icon-btn" onClick={() => setShowVentaForm(false)}><X size={18} /></button>
          </div>

          <div className="toggle-row">
            <label className="toggle-label">¿Es un almuerzo / menú?</label>
            <button
              className={`toggle-btn ${ventaForm.isAlmuerzo ? 'active' : ''}`}
              onClick={() => setVentaForm({ ...ventaForm, isAlmuerzo: !ventaForm.isAlmuerzo, conEnvio: false })}
            >
              {ventaForm.isAlmuerzo ? 'SÍ' : 'NO'}
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Cliente (Opcional)</label>
              <input type="text" placeholder="Ej: Venta al paso" value={ventaForm.customer} onChange={e => setVentaForm({ ...ventaForm, customer: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Producto / Detalle</label>
              <input 
                type="text" 
                list="catalog-products-resumen"
                placeholder={ventaForm.isAlmuerzo ? 'Ej: Menú del Día' : 'Ej: Café con Leche'} 
                value={ventaForm.item} 
                onChange={e => {
                  const val = e.target.value;
                  const found = catalogProducts.find(p => p.name.toLowerCase() === val.toLowerCase());
                  if (found) {
                    setVentaForm({ ...ventaForm, item: val, amount: found.price.toString(), isAlmuerzo: found.isAlmuerzo || ventaForm.isAlmuerzo });
                  } else {
                    setVentaForm({ ...ventaForm, item: val });
                  }
                }} 
              />
              <datalist id="catalog-products-resumen">
                {catalogProducts
                  .filter(p => ventaForm.isAlmuerzo ? p.isAlmuerzo : true)
                  .map(p => (
                  <option key={p.name} value={p.name} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>{ventaForm.isAlmuerzo ? 'Monto del menú ($)' : 'Monto ($)'}</label>
              <input type="number" placeholder={ventaForm.isAlmuerzo ? '8500' : '0'} value={ventaForm.amount} onChange={e => setVentaForm({ ...ventaForm, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>¿Cómo pagó el cliente?</label>
              <select value={ventaForm.method} onChange={e => setVentaForm({ ...ventaForm, method: e.target.value })}>
                <option>Efectivo</option>
                <option>Transferencia</option>
              </select>
            </div>
          </div>

          {ventaForm.isAlmuerzo && (
            <div className="envio-section fade-in">
              <div className="toggle-row">
                <label className="toggle-label"><Truck size={18} /> ¿Tiene envío?</label>
                <button
                  className={`toggle-btn ${ventaForm.conEnvio ? 'active' : ''}`}
                  onClick={() => setVentaForm({ ...ventaForm, conEnvio: !ventaForm.conEnvio })}
                >
                  {ventaForm.conEnvio ? 'SÍ' : 'NO'}
                </button>
              </div>

              {ventaForm.conEnvio && (
                <div className="form-grid fade-in" style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Monto del envío ($)</label>
                    <input type="number" placeholder="1500" value={ventaForm.envioAmount} onChange={e => setVentaForm({ ...ventaForm, envioAmount: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>¿Cómo pagó el CLIENTE el envío?</label>
                    <select value={ventaForm.envioPagoCliente} onChange={e => setVentaForm({ ...ventaForm, envioPagoCliente: e.target.value })}>
                      <option>Transferencia</option>
                      <option>Efectivo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>¿Cómo pagamos NOSOTROS al delivery?</label>
                    <select value={ventaForm.envioPagoNosotros} onChange={e => setVentaForm({ ...ventaForm, envioPagoNosotros: e.target.value })}>
                      <option>Efectivo</option>
                      <option>Transferencia</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <button className="btn-primary" onClick={handleAddVenta} style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
            CONFIRMAR VENTA
          </button>
        </div>
        </div>
      )}

      {/* ========== FORMULARIO DE GASTO (POPUP) ========== */}
      {showGastoForm && (
        <div className="modal-overlay fade-in" onClick={(e) => { if (e.target.className.includes('modal-overlay')) setShowGastoForm(false); }}>
          <div className="form-card modal-form-card fade-in">
          <div className="form-header">
            <h3>Registrar Gasto</h3>
            <button className="icon-btn" onClick={() => setShowGastoForm(false)}><X size={18} /></button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Concepto</label>
              <input type="text" placeholder="Ej: Compra de insumos" value={gastoForm.concept} onChange={e => setGastoForm({ ...gastoForm, concept: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Monto ($)</label>
              <input type="number" placeholder="0" value={gastoForm.amount} onChange={e => setGastoForm({ ...gastoForm, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={gastoForm.category} onChange={e => setGastoForm({ ...gastoForm, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleAddGasto} style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
            CONFIRMAR GASTO
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
