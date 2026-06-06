import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, X, Edit2, Users, Receipt } from 'lucide-react';
import { API_URL } from '../config';

export default function CuentasCorrientes({ cuentasCorrientes = [], setCuentasCorrientes }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ owner: '', item: '', amount: '', notes: '' });

  const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getLocalToday();

  // Calculations
  const totalConsumido = cuentasCorrientes.reduce((acc, c) => acc + c.amount, 0);

  // Group by owner to get individual balances
  const ownerBalances = cuentasCorrientes.reduce((acc, c) => {
    const name = c.owner.trim();
    if (!acc[name]) acc[name] = 0;
    acc[name] += c.amount;
    return acc;
  }, {});

  const handleAddOrEdit = async () => {
    if (!form.owner || !form.item || !form.amount) return;

    if (editingId) {
      const updated = {
        owner: form.owner.trim(),
        item: form.item.trim(),
        amount: parseInt(form.amount),
        notes: form.notes.trim()
      };

      try {
        const res = await fetch(`${API_URL}/cuentas-corrientes/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          setCuentasCorrientes(cuentasCorrientes.map(c => c.id === editingId ? { ...c, ...updated } : c));
          setForm({ owner: '', item: '', amount: '', notes: '' });
          setShowForm(false);
          setEditingId(null);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const newCargo = {
        id: Date.now(),
        date: todayStr,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        owner: form.owner.trim(),
        item: form.item.trim(),
        amount: parseInt(form.amount),
        notes: form.notes.trim() || 'Sin notas'
      };

      try {
        const res = await fetch(`${API_URL}/cuentas-corrientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCargo)
        });
        if (res.ok) {
          setCuentasCorrientes([newCargo, ...cuentasCorrientes]);
          setForm({ owner: '', item: '', amount: '', notes: '' });
          setShowForm(false);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEdit = (cargo) => {
    setEditingId(cargo.id);
    setForm({
      owner: cargo.owner,
      item: cargo.item,
      amount: cargo.amount.toString(),
      notes: cargo.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/cuentas-corrientes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCuentasCorrientes(cuentasCorrientes.filter(x => x.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-content">
      {/* Resúmenes */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-title" style={{ color: 'var(--warning-text)' }}><Receipt size={16} /> Total Consumido Dueños</div>
          <div className="summary-value positive" style={{ color: 'var(--warning-text)' }}>${totalConsumido.toLocaleString()}</div>
        </div>
        
        <div className="summary-card" style={{ gridColumn: 'span 2' }}>
          <div className="summary-title"><Users size={16} /> Consumo por Dueño</div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {Object.entries(ownerBalances).length > 0 ? (
              Object.entries(ownerBalances).map(([name, amount]) => (
                <div key={name} style={{ background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{name}: </span>
                  <strong style={{ color: 'var(--warning-text)' }}>${amount.toLocaleString()}</strong>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No hay consumos registrados aún.</span>
            )}
          </div>
        </div>
      </div>

      <div className="controls-bar">
        <h2><Receipt className="icon" style={{ color: 'var(--warning-text)' }} /> Cuentas Corrientes (Dueños)</h2>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ owner: '', item: '', amount: '', notes: '' }); }} style={{ backgroundColor: 'var(--warning-text)', color: '#000' }}>
          <Plus size={18} /> NUEVO CARGO
        </button>
      </div>

      {showForm && (
        <div className="form-card fade-in">
          <div className="form-header">
            <h3>{editingId ? 'Editar Cargo' : 'Registrar Nuevo Cargo'}</h3>
            <button className="icon-btn" onClick={() => { setShowForm(false); setEditingId(null); setForm({ owner: '', item: '', amount: '', notes: '' }); }}><X size={16} /></button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>¿Quién consumió? (Dueño)</label>
              <input 
                type="text" 
                placeholder="Ej: Leonel" 
                value={form.owner} 
                onChange={e => setForm({ ...form, owner: e.target.value })} 
                list="owners-list"
              />
              <datalist id="owners-list">
                {Object.keys(ownerBalances).map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>¿Qué consumió? (Producto/Detalle)</label>
              <input type="text" placeholder="Ej: Café con leche y medialunas" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} />
            </div>
            <div className="form-group">
              <label>¿Cuánto importó? ($)</label>
              <input type="number" placeholder="Ej: 3500" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Notas / Comentarios (Opcional)</label>
              <input type="text" placeholder="Ej: Consumo de la mañana" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" onClick={handleAddOrEdit} style={{ marginTop: '1rem', backgroundColor: 'var(--warning-text)', color: '#000' }}>
            {editingId ? 'GUARDAR CAMBIOS' : 'CONFIRMAR CARGO'}
          </button>
        </div>
      )}

      <div className="entries-list">
        {cuentasCorrientes.map(c => (
          <div className="entry-card" key={c.id}>
            <div className="entry-time">
              <h3>{c.time}</h3>
              <p>{c.date}</p>
            </div>
            <div className="entry-details">
              <span style={{ fontSize: '0.8rem', color: 'var(--warning-text)', background: 'var(--warning-bg)', padding: '0.2rem 0.6rem', borderRadius: '12px', marginRight: '0.5rem', fontWeight: 'bold' }}>
                {c.owner}
              </span>
              <strong style={{ fontSize: '1.1rem' }}>{c.item}</strong>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{c.notes}</div>
            </div>
            <div className="entry-amount" style={{ color: 'var(--warning-text)', fontWeight: 'bold' }}>${c.amount.toLocaleString()}</div>
            <div className="icon-actions">
              <button className="icon-btn edit" onClick={() => handleEdit(c)} style={{ color: 'var(--text-secondary)' }}><Edit2 size={16} /></button>
              <button className="icon-btn delete" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {cuentasCorrientes.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
            No hay cargos registrados en cuentas corrientes.
          </div>
        )}
      </div>
    </div>
  );
}
