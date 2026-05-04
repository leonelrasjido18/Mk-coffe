import React, { useState } from 'react';
import { Coffee, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

const initialProductos = [
  { id: 1, name: 'Menú del Día', price: 3500, category: 'Menú', active: true },
  { id: 2, name: 'Café con Leche', price: 1200, category: 'Bebidas Calientes', active: true },
  { id: 3, name: 'Batido Proteico', price: 4200, category: 'Batidos', active: true },
  { id: 4, name: 'Agua Mineral', price: 800, category: 'Bebidas Frías', active: true },
  { id: 5, name: 'Tostado Mixto', price: 2500, category: 'Sándwiches', active: true },
  { id: 6, name: 'Medialunas (x3)', price: 1800, category: 'Panadería', active: true },
  { id: 7, name: 'Ensalada Fitness', price: 3800, category: 'Menú', active: true },
  { id: 8, name: 'Jugo Natural', price: 2000, category: 'Bebidas Frías', active: true },
];

const allCategories = ['Menú', 'Bebidas Calientes', 'Batidos', 'Bebidas Frías', 'Sándwiches', 'Panadería', 'Snacks', 'Otros'];

export default function Productos() {
  const [productos, setProductos] = useState(initialProductos);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', category: 'Menú' });
  const [filterCat, setFilterCat] = useState('Todos');

  const handleAdd = () => {
    if (!form.name || !form.price) return;
    if (editId) {
      setProductos(productos.map(p => p.id === editId ? { ...p, name: form.name, price: parseInt(form.price), category: form.category } : p));
      setEditId(null);
    } else {
      setProductos([...productos, { id: Date.now(), name: form.name, price: parseInt(form.price), category: form.category, active: true }]);
    }
    setForm({ name: '', price: '', category: 'Menú' });
    setShowForm(false);
  };

  const startEdit = (p) => {
    setForm({ name: p.name, price: p.price.toString(), category: p.category });
    setEditId(p.id);
    setShowForm(true);
  };

  const usedCategories = ['Todos', ...new Set(productos.map(p => p.category))];
  const filtered = filterCat === 'Todos' ? productos : productos.filter(p => p.category === filterCat);

  return (
    <div className="dashboard-content">
      <div className="controls-bar">
        <h2><Coffee className="icon" /> Productos y Menús</h2>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', price: '', category: 'Menú' }); }}>
          <Plus size={18} /> NUEVO PRODUCTO
        </button>
      </div>

      <div className="filter-bar">
        {usedCategories.map(c => (
          <button key={c} className={`filter-chip ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="form-card fade-in">
          <div className="form-header">
            <h3>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <button className="icon-btn" onClick={() => { setShowForm(false); setEditId(null); }}><X size={16} /></button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" placeholder="Ej: Menú del Día" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Precio ($)</label>
              <input type="number" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {allCategories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleAdd} style={{ marginTop: '1rem' }}>
            {editId ? 'GUARDAR CAMBIOS' : 'AGREGAR PRODUCTO'}
          </button>
        </div>
      )}

      <div className="products-grid">
        {filtered.map(p => (
          <div className="product-card" key={p.id}>
            <div className="product-info">
              <h3>{p.name}</h3>
              <span className="product-category">{p.category}</span>
            </div>
            <div className="product-price">${p.price.toLocaleString()}</div>
            <div className="icon-actions">
              <button className="icon-btn" onClick={() => startEdit(p)}><Edit2 size={16} /></button>
              <button className="icon-btn delete" onClick={() => setProductos(productos.filter(x => x.id !== p.id))}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
