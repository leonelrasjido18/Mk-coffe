import React, { useState, useEffect } from 'react';
import { Activity, Plus, Trash2, X, Edit2 } from 'lucide-react';
import { API_URL } from '../config';

const categories = ['Insumos', 'Servicios', 'Descartables', 'Personal', 'Envíos', 'Otros'];

export default function Gastos({ autoOpen, onAutoOpenDone, gastos, setGastos }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ concept: '', amount: '', category: 'Insumos', method: 'Efectivo' });

  const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getLocalToday();

  const totalGastos = gastos.reduce((acc, g) => acc + g.amount, 0);
  const todayGastos = gastos.filter(g => g.date === todayStr).reduce((acc, g) => acc + g.amount, 0);

  useEffect(() => {
    if (autoOpen) {
      setShowForm(true);
      onAutoOpenDone?.();
    }
  }, [autoOpen]);

  const handleAddOrEdit = async () => {
    if (!form.concept || !form.amount) return;
    
    if (editingId) {
      const updated = {
        concept: form.concept,
        amount: parseInt(form.amount),
        category: form.category,
        method: form.method
      };

      try {
        const res = await fetch(`${API_URL}/gastos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          setGastos(gastos.map(g => g.id === editingId ? { ...g, ...updated } : g));
          setForm({ concept: '', amount: '', category: 'Insumos', method: 'Efectivo' });
          setShowForm(false);
          setEditingId(null);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const newGasto = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        concept: form.concept,
        amount: parseInt(form.amount),
        category: form.category,
        method: form.method || 'Efectivo'
      };

      try {
        const res = await fetch(`${API_URL}/gastos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGasto)
        });
        if (res.ok) {
          setGastos([newGasto, ...gastos]);
          setForm({ concept: '', amount: '', category: 'Insumos', method: 'Efectivo' });
          setShowForm(false);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEdit = (gasto) => {
    setEditingId(gasto.id);
    setForm({
      concept: gasto.concept,
      amount: gasto.amount.toString(),
      category: gasto.category,
      method: gasto.method || 'Efectivo'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/gastos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGastos(gastos.filter(x => x.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-title"><Activity size={16} /> Gastos de Hoy</div>
          <div className="summary-value negative">${todayGastos.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title"><Activity size={16} /> Total Acumulado</div>
          <div className="summary-value negative">${totalGastos.toLocaleString()}</div>
        </div>
      </div>

      <div className="controls-bar">
        <h2><Activity className="icon" /> Registro de Gastos</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> NUEVO GASTO
        </button>
      </div>

      {showForm && (
        <div className="form-card fade-in">
          <div className="form-header">
            <h3>Registrar Gasto</h3>
            <button className="icon-btn" onClick={() => setShowForm(false)}><X size={16} /></button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Concepto</label>
              <input type="text" placeholder="Ej: Compra de insumos" value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Monto ($)</label>
              <input type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input
                type="text"
                list="categories-list"
                placeholder="Ej: Insumos, Servicios..."
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="categories-list">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label>Método de Pago</label>
              <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                <option>Efectivo</option>
                <option>Transferencia</option>
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleAddOrEdit} style={{ marginTop: '1rem' }}>
            {editingId ? 'GUARDAR CAMBIOS' : 'CONFIRMAR GASTO'}
          </button>
        </div>
      )}

      <div className="entries-list">
        {gastos.map(g => (
          <div className="entry-card" key={g.id}>
            <div className="entry-time">
              <h3>{g.category}</h3>
              <p>{g.date}</p>
            </div>
            <div className="entry-details">
              <h3>{g.concept}</h3>
              <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{g.method || 'Efectivo'}</p>
            </div>
            <div className="entry-amount negative">-${g.amount.toLocaleString()}</div>
            <div className="icon-actions">
              <button className="icon-btn edit" onClick={() => handleEdit(g)} style={{ color: 'var(--text-secondary)' }}><Edit2 size={16} /></button>
              <button className="icon-btn delete" onClick={() => handleDelete(g.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
