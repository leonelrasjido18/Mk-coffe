import React, { useState, useEffect } from 'react';
import { DollarSign, Activity, Clock, Plus, Download, FileText, Trash2, X, Truck, Edit2 } from 'lucide-react';
import { API_URL } from '../config';
import { catalogProducts } from '../data';

const emptyForm = {
  customer: '', item: '', amount: '', method: 'Efectivo',
  isAlmuerzo: false, conEnvio: false,
  envioAmount: '', envioPagoCliente: 'Transferencia', envioPagoNosotros: 'Efectivo',
};

export default function VentasHoy({ autoOpen, onAutoOpenDone, ventas, setVentas }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Totales
  const totalVentas = ventas.reduce((a, v) => a + v.amount, 0);

  useEffect(() => {
    if (autoOpen) {
      setShowForm(true);
      onAutoOpenDone?.();
    }
  }, [autoOpen]);
  const totalEfectivo = ventas.filter(v => v.method === 'Efectivo').reduce((a, v) => a + v.amount, 0);
  const totalTransferencia = ventas.filter(v => v.method === 'Transferencia').reduce((a, v) => a + v.amount, 0);

  // Envíos
  const ventasConEnvio = ventas.filter(v => v.conEnvio);
  const totalEnvioClienteTransf = ventasConEnvio
    .filter(v => v.envioPagoCliente === 'Transferencia')
    .reduce((a, v) => a + v.envioAmount, 0);
  const totalEnvioClienteEfect = ventasConEnvio
    .filter(v => v.envioPagoCliente === 'Efectivo')
    .reduce((a, v) => a + v.envioAmount, 0);
  const totalEnvioNosotrosEfect = ventasConEnvio
    .filter(v => v.envioPagoNosotros === 'Efectivo')
    .reduce((a, v) => a + v.envioAmount, 0);
  const totalEnvioNosotrosTransf = ventasConEnvio
    .filter(v => v.envioPagoNosotros === 'Transferencia')
    .reduce((a, v) => a + v.envioAmount, 0);

  const handleAddOrEdit = async () => {
    if (!form.item || !form.amount) return;
    const now = new Date();
    
    let finalCustomerName = form.customer.trim();
    if (!finalCustomerName) {
      finalCustomerName = `Venta ${ventas.length + (editingId ? 0 : 1)}`;
    }

    if (editingId) {
      const updated = {
        customer: finalCustomerName,
        item: form.item,
        amount: parseInt(form.amount),
        method: form.method,
        isAlmuerzo: form.isAlmuerzo,
        conEnvio: form.isAlmuerzo && form.conEnvio,
        envioAmount: form.isAlmuerzo && form.conEnvio ? parseInt(form.envioAmount || 0) : 0,
        envioPagoCliente: form.isAlmuerzo && form.conEnvio ? form.envioPagoCliente : '',
        envioPagoNosotros: form.isAlmuerzo && form.conEnvio ? form.envioPagoNosotros : '',
        status: 'Completado',
      };

      try {
        const res = await fetch(`${API_URL}/ventas/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          setVentas(ventas.map(v => v.id === editingId ? { ...v, ...updated } : v));
          setForm({ ...emptyForm });
          setShowForm(false);
          setEditingId(null);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const newVenta = {
        id: Date.now(),
        time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        date: now.toISOString().split('T')[0],
        customer: finalCustomerName,
        item: form.item,
        amount: parseInt(form.amount),
        method: form.method,
        isAlmuerzo: form.isAlmuerzo,
        conEnvio: form.isAlmuerzo && form.conEnvio,
        envioAmount: form.isAlmuerzo && form.conEnvio ? parseInt(form.envioAmount || 0) : 0,
        envioPagoCliente: form.isAlmuerzo && form.conEnvio ? form.envioPagoCliente : '',
        envioPagoNosotros: form.isAlmuerzo && form.conEnvio ? form.envioPagoNosotros : '',
        status: 'Completado',
      };

      try {
        const res = await fetch(`${API_URL}/ventas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newVenta)
        });
        if (res.ok) {
          setVentas([newVenta, ...ventas]);
          setForm({ ...emptyForm });
          setShowForm(false);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEdit = (venta) => {
    setEditingId(venta.id);
    setForm({
      customer: venta.customer,
      item: venta.item,
      amount: venta.amount.toString(),
      method: venta.method || 'Efectivo',
      isAlmuerzo: venta.isAlmuerzo,
      conEnvio: venta.conEnvio,
      envioAmount: venta.envioAmount ? venta.envioAmount.toString() : '',
      envioPagoCliente: venta.envioPagoCliente || 'Transferencia',
      envioPagoNosotros: venta.envioPagoNosotros || 'Efectivo',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/ventas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVentas(ventas.filter(v => v.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-content">
      {/* Tarjetas de resumen */}
      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="summary-card">
          <div className="summary-title"><DollarSign size={18} /> Total Ventas</div>
          <div className="summary-value positive">${totalVentas.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><DollarSign size={18} /> Efectivo</div>
          <div className="summary-value">${totalEfectivo.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><Activity size={18} /> Transferencia</div>
          <div className="summary-value">${totalTransferencia.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><Truck size={18} /> Envíos del Día</div>
          <div className="summary-value" style={{ color: 'var(--warning-text)' }}>${(totalEnvioClienteTransf + totalEnvioClienteEfect).toLocaleString()}</div>
        </div>
      </div>

      {/* Si hay envíos, mostrar el desglose */}
      {ventasConEnvio.length > 0 && (
        <div className="info-banner fade-in" style={{ marginBottom: '1.75rem' }}>
          <Truck size={20} />
          <div>
            <strong>Desglose de Envíos del Día:</strong><br />
            Clientes pagaron envíos por Transferencia: <strong>${totalEnvioClienteTransf.toLocaleString()}</strong>
            {totalEnvioClienteEfect > 0 && <> | por Efectivo: <strong>${totalEnvioClienteEfect.toLocaleString()}</strong></>}
            <br/>
            Nosotros pagamos al delivery en Efectivo: <strong className="negative">-${totalEnvioNosotrosEfect.toLocaleString()}</strong>
            {totalEnvioNosotrosTransf > 0 && <> | en Transferencia: <strong className="negative">-${totalEnvioNosotrosTransf.toLocaleString()}</strong></>}
            <br/>
            <span style={{ opacity: 0.8 }}>→ Sobra en Transferencia: +${totalEnvioClienteTransf.toLocaleString()} | Falta en Efectivo: -${totalEnvioNosotrosEfect.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="controls-bar">
        <h2><Clock className="icon" /> Últimas Ventas</h2>
        <div className="actions">
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={20} /> NUEVA VENTA
          </button>
          <button className="btn-outline">
            <Download size={20} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="form-card fade-in">
          <div className="form-header">
            <h3>{editingId ? 'Editar Venta' : 'Registrar Venta'}</h3>
            <button className="icon-btn" onClick={() => { setShowForm(false); setEditingId(null); setForm({...emptyForm}); }}><X size={18} /></button>
          </div>

          {/* Toggle almuerzo */}
          <div className="toggle-row">
            <label className="toggle-label">¿Es un almuerzo / menú?</label>
            <button
              className={`toggle-btn ${form.isAlmuerzo ? 'active' : ''}`}
              onClick={() => setForm({ ...form, isAlmuerzo: !form.isAlmuerzo, conEnvio: false })}
            >
              {form.isAlmuerzo ? 'SÍ' : 'NO'}
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Cliente (Opcional)</label>
              <input type="text" placeholder="Ej: Venta al paso" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Producto / Detalle</label>
              <input 
                type="text" 
                list="catalog-products"
                placeholder={form.isAlmuerzo ? "Ej: Menú del Día" : "Ej: Café con Leche"} 
                value={form.item} 
                onChange={e => {
                  const val = e.target.value;
                  const found = catalogProducts.find(p => p.name.toLowerCase() === val.toLowerCase());
                  if (found) {
                    setForm({ ...form, item: val, amount: found.price.toString(), isAlmuerzo: found.isAlmuerzo || form.isAlmuerzo });
                  } else {
                    setForm({ ...form, item: val });
                  }
                }} 
              />
              <datalist id="catalog-products">
                {catalogProducts
                  .filter(p => form.isAlmuerzo ? p.isAlmuerzo : true)
                  .map(p => (
                  <option key={p.name} value={p.name} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>{form.isAlmuerzo ? 'Monto del menú ($)' : 'Monto ($)'}</label>
              <input type="number" placeholder={form.isAlmuerzo ? '8500' : '0'} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>¿Cómo pagó el cliente?</label>
              <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                <option>Efectivo</option>
                <option>Transferencia</option>
              </select>
            </div>
          </div>

          {/* Sección de envío — solo visible en almuerzos */}
          {form.isAlmuerzo && (
            <div className="envio-section fade-in">
              <div className="toggle-row">
                <label className="toggle-label"><Truck size={18} /> ¿Tiene envío?</label>
                <button
                  className={`toggle-btn ${form.conEnvio ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, conEnvio: !form.conEnvio })}
                >
                  {form.conEnvio ? 'SÍ' : 'NO'}
                </button>
              </div>

              {form.conEnvio && (
                <div className="form-grid fade-in" style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Monto del envío ($)</label>
                    <input type="number" placeholder="1500" value={form.envioAmount} onChange={e => setForm({ ...form, envioAmount: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>¿Cómo pagó el CLIENTE el envío?</label>
                    <select value={form.envioPagoCliente} onChange={e => setForm({ ...form, envioPagoCliente: e.target.value })}>
                      <option>Transferencia</option>
                      <option>Efectivo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>¿Cómo pagamos NOSOTROS al delivery?</label>
                    <select value={form.envioPagoNosotros} onChange={e => setForm({ ...form, envioPagoNosotros: e.target.value })}>
                      <option>Efectivo</option>
                      <option>Transferencia</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <button className="btn-primary" onClick={handleAddOrEdit} style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
            {editingId ? 'GUARDAR CAMBIOS' : 'CONFIRMAR VENTA'}
          </button>
        </div>
      )}

      {/* Lista de ventas */}
      <div className="entries-list">
        {ventas.map((venta) => (
          <div className="entry-card" key={venta.id}>
            <div className="entry-time">
              <h3>{venta.time}</h3>
              <p>{venta.date}</p>
            </div>
            <div className="entry-details">
              <h3>{venta.customer}</h3>
              <p>{venta.item}</p>
              {venta.conEnvio && (
                <p style={{ marginTop: '0.2rem', fontSize: '0.82rem' }}>
                  Envío: <strong>${venta.envioAmount.toLocaleString()}</strong>
                  &nbsp;— Cliente pagó: <strong>{venta.envioPagoCliente}</strong>
                  &nbsp;— Nosotros pagamos: <strong>{venta.envioPagoNosotros}</strong>
                </p>
              )}
            </div>
            <div className="entry-badges">
              {venta.isAlmuerzo && <span className="method-badge almuerzo">Almuerzo</span>}
              <span className={`method-badge ${venta.method === 'Efectivo' ? 'cash' : 'transfer'}`}>
                {venta.method}
              </span>
              {venta.conEnvio && (
                <span className="method-badge envio">
                  Envío ${venta.envioAmount.toLocaleString()}
                </span>
              )}
            </div>
            <div className="entry-amount positive">${venta.amount.toLocaleString()}</div>
            <div className="icon-actions">
              <button className="icon-btn edit" onClick={() => handleEdit(venta)} style={{ color: 'var(--text-secondary)' }}><Edit2 size={18} /></button>
              <button className="icon-btn delete" onClick={() => handleDelete(venta.id)}><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
