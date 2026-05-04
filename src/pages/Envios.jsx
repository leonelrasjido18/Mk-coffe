import React, { useState } from 'react';
import { Truck, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config';

export default function Envios({ ventas, setVentas }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer: '', transferAmount: '', cashPaid: '', description: '' });

  // Filtrar solo las ventas que tienen envío
  const envios = ventas.filter(v => v.conEnvio);

  // Calcular totales sumando los campos de envíos en las ventas
  const totalTransfer = envios
    .filter(v => v.envioPagoCliente === 'Transferencia')
    .reduce((a, v) => a + v.envioAmount, 0);

  const totalCash = envios
    .filter(v => v.envioPagoNosotros === 'Efectivo')
    .reduce((a, v) => a + v.envioAmount, 0);

  const netDiff = totalTransfer - totalCash;

  const handleAdd = () => {
    if (!form.customer || !form.transferAmount) return;
    
    // Crear una venta "ficticia" que solo representa un envío (amount 0)
    const newVentaEnvio = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      customer: form.customer,
      item: `Envío Manual: ${form.description}`,
      amount: 0,
      method: 'Efectivo',
      isAlmuerzo: false,
      conEnvio: true,
      envioAmount: parseInt(form.transferAmount),
      envioPagoCliente: 'Transferencia',
      envioPagoNosotros: 'Efectivo',
      status: 'Completado'
    };
    
    fetch(`${API_URL}/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVentaEnvio)
    }).then(res => {
      if (res.ok) {
        setVentas([newVentaEnvio, ...ventas]);
        setForm({ customer: '', transferAmount: '', cashPaid: '', description: '' });
        setShowForm(false);
      }
    }).catch(console.error);
  };

  const handleDeleteEnvio = (id) => {
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;

    if (venta.amount === 0) {
      // Envío manual -> delete entirely
      fetch(`${API_URL}/ventas/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) setVentas(ventas.filter(v => v.id !== id));
        }).catch(console.error);
    } else {
      // Real sale with shipping attached -> just remove the shipping flags
      fetch(`${API_URL}/ventas/${id}/envio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conEnvio: false, envioAmount: 0 })
      }).then(res => {
        if (res.ok) {
          setVentas(ventas.map(v => v.id === id ? { ...v, conEnvio: false, envioAmount: 0 } : v));
        }
      }).catch(console.error);
    }
  };

  return (
    <div className="dashboard-content fade-in">
      <div className="info-banner">
        <AlertTriangle size={18} />
        <span>Los envíos se compensan entre sí. Esta lista muestra todos los envíos vinculados a ventas. El cliente suele pagar por <strong>transferencia</strong> y se paga al delivery en <strong>efectivo</strong>.</span>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-title"><Truck size={16} /> Clientes (Transferencia)</div>
          <div className="summary-value">${totalTransfer.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><Truck size={16} /> Delivery (Efectivo)</div>
          <div className="summary-value negative">-${totalCash.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><Truck size={16} /> Diferencia Neta</div>
          <div className={`summary-value ${netDiff >= 0 ? 'positive' : 'negative'}`}>${netDiff.toLocaleString()}</div>
        </div>
      </div>

      <div className="controls-bar">
        <h2><Truck className="icon" /> Registro de Envíos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> ENVÍO MANUAL
        </button>
      </div>

      {showForm && (
        <div className="form-card fade-in">
          <div className="form-header">
            <h3>Registrar Envío Manual (Sin venta)</h3>
            <button className="icon-btn" onClick={() => setShowForm(false)}><X size={16} /></button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Cliente</label>
              <input type="text" placeholder="Nombre" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Costo de Envío ($)</label>
              <input type="number" placeholder="Ej: 1500" value={form.transferAmount} onChange={e => setForm({ ...form, transferAmount: e.target.value })} />
            </div>
            {/* Ocultamos cashPaid y lo manejamos por defecto para simplificar en este flujo legacy, 
                ya que el form original estaba un poco mezclado. Usaremos el estándar de CerrarCaja. */}
            <div className="form-group">
              <label>Descripción</label>
              <input type="text" placeholder="Ej: Envío zona norte" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="info-banner" style={{ margin: '1rem 0' }}>
            <span style={{ fontSize: '0.85rem' }}>Nota: Los envíos manuales asumen que el cliente paga por Transferencia y el negocio al Delivery en Efectivo, que es el flujo habitual.</span>
          </div>
          <button className="btn-primary" onClick={handleAdd} style={{ width: '100%', justifyContent: 'center' }}>CONFIRMAR ENVÍO MANUAL</button>
        </div>
      )}

      <div className="entries-list">
        {envios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No hay envíos registrados hoy.
          </div>
        )}
        
        {envios.map(e => (
          <div className="entry-card" key={e.id}>
            <div className="entry-time">
              <h3>{e.customer}</h3>
              <p>{e.date}</p>
            </div>
            <div className="entry-details">
              <h3>{e.item}</h3>
              <p style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                Cliente pagó: <strong>{e.envioPagoCliente}</strong> → Nosotros pagamos: <strong>{e.envioPagoNosotros}</strong>
              </p>
            </div>
            <div className="entry-amount" style={{ color: 'var(--warning-text)' }}>
              ${e.envioAmount.toLocaleString()}
            </div>
            <div className="icon-actions">
              <button className="icon-btn delete" onClick={() => handleDeleteEnvio(e.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
