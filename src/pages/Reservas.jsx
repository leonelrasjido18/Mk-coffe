import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, X, Edit2 } from 'lucide-react';
import { API_URL } from '../config';

export default function Reservas({ reservas, setReservas }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ amount: '', notes: '' });

  const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getLocalToday();

  const reservasArray = reservas || [];
  const todayReservas = reservasArray.filter(r => r.date === todayStr);
  const totalReservasHoy = todayReservas.reduce((acc, r) => acc + r.amount, 0);

  const handleAddOrEdit = async () => {
    if (!form.amount) return;
    
    if (editingId) {
      const updated = {
        amount: parseInt(form.amount),
        notes: form.notes
      };

      try {
        const res = await fetch(`${API_URL}/reservas/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          setReservas(reservasArray.map(r => r.id === editingId ? { ...r, ...updated } : r));
          setForm({ amount: '', notes: '' });
          setShowForm(false);
          setEditingId(null);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const newReserva = {
        id: Date.now(),
        date: todayStr,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        amount: parseInt(form.amount),
        notes: form.notes || 'Reserva',
      };

      try {
        const res = await fetch(`${API_URL}/reservas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReserva)
        });
        if (res.ok) {
          setReservas([newReserva, ...reservasArray]);
          setForm({ amount: '', notes: '' });
          setShowForm(false);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEdit = (reserva) => {
    setEditingId(reserva.id);
    setForm({
      amount: reserva.amount.toString(),
      notes: reserva.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/reservas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReservas(reservasArray.filter(x => x.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-title" style={{ color: '#EAB308' }}><DollarSign size={16} /> Total Apartado Hoy</div>
          <div className="summary-value positive" style={{ color: '#EAB308' }}>${totalReservasHoy.toLocaleString()}</div>
        </div>
      </div>

      <div className="controls-bar">
        <h2><DollarSign className="icon" style={{ color: '#EAB308' }} /> Historial de Reservas</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ backgroundColor: '#EAB308', color: '#000' }}>
          <Plus size={18} /> NUEVA RESERVA
        </button>
      </div>

      {showForm && (
        <div className="form-card fade-in">
          <div className="form-header">
            <h3>{editingId ? 'Editar Reserva' : 'Separar Reserva (Efectivo)'}</h3>
            <button className="icon-btn" onClick={() => { setShowForm(false); setEditingId(null); setForm({ amount: '', notes: ''}); }}><X size={16} /></button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Monto a reservar ($)</label>
              <input type="number" placeholder="Ej: 5000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Nota (Opcional)</label>
              <input type="text" placeholder="Ej: Cambio para mañana" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" onClick={handleAddOrEdit} style={{ marginTop: '1rem', backgroundColor: '#EAB308', color: '#000' }}>
            {editingId ? 'GUARDAR CAMBIOS' : 'CONFIRMAR RESERVA'}
          </button>
        </div>
      )}

      <div className="entries-list">
        {reservasArray.map(r => (
          <div className="entry-card" key={r.id}>
            <div className="entry-time">
              <h3>{r.time}</h3>
              <p>{r.date}</p>
            </div>
            <div className="entry-details">
              <h3>{r.notes || 'Reserva'}</h3>
            </div>
            <div className="entry-amount" style={{ color: '#EAB308', fontWeight: 'bold' }}>${r.amount.toLocaleString()}</div>
            <div className="icon-actions">
              <button className="icon-btn edit" onClick={() => handleEdit(r)} style={{ color: 'var(--text-secondary)' }}><Edit2 size={16} /></button>
              <button className="icon-btn delete" onClick={() => handleDelete(r.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {reservasArray.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
            No hay reservas registradas.
          </div>
        )}
      </div>
    </div>
  );
}
