import React, { useState } from 'react';
import { Users, Plus, CalendarCheck, Search, History, Check, X, Trash2 } from 'lucide-react';
import { API_URL } from '../config';

export default function PlanesMensuales({ planes, setPlanes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Form states
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newTotalMeals, setNewTotalMeals] = useState('20');
  const [consumeNotes, setConsumeNotes] = useState('');
  
  // To show success state when marking
  const [justMarkedId, setJustMarkedId] = useState(null);

  const filteredPlanes = planes.filter(p => 
    p.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!newClientName || !newTotalMeals) return;

    const newPlan = {
      id: Date.now(),
      cliente: newClientName,
      telefono: newClientPhone,
      cantidadTotal: parseInt(newTotalMeals),
      consumidos: 0,
      historial: []
    };

    try {
      const res = await fetch(`${API_URL}/planes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      });
      if (res.ok) {
        setPlanes([...planes, newPlan]);
        setShowAddModal(false);
        setNewClientName('');
        setNewClientPhone('');
        setNewTotalMeals('20');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarcarConsumo = async (planId) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const notas = consumeNotes || 'Consumo registrado';

    try {
      const res = await fetch(`${API_URL}/planes/${planId}/consumo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: today, notas })
      });
      if (res.ok) {
        const updatedPlanes = planes.map(p => {
          if (p.id === planId) {
            if (p.consumidos < p.cantidadTotal) {
              return {
                ...p,
                consumidos: p.consumidos + 1,
                historial: [{ fecha: today, notas }, ...p.historial]
              };
            }
          }
          return p;
        });

        setPlanes(updatedPlanes);
        setConsumeNotes('');
        
        setJustMarkedId(planId);
        setTimeout(() => setJustMarkedId(null), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openHistory = (plan) => {
    setSelectedPlan(plan);
    setShowHistoryModal(true);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente y todo su historial?')) return;
    try {
      const res = await fetch(`${API_URL}/planes/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        setPlanes(planes.filter(p => p.id !== planId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-content fade-in">
      <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <h2><Users className="icon" /> Planes Mensuales</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0 1rem' }}>
            <Search size={18} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0.85rem 0', outline: 'none', boxShadow: 'none', width: '200px' }}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} /> Nuevo Plan
          </button>
        </div>
      </div>

      <div className="planes-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredPlanes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            No se encontraron planes activos.
          </div>
        ) : (
          filteredPlanes.map(plan => {
            const isFinished = plan.consumidos >= plan.cantidadTotal;
            const remaining = plan.cantidadTotal - plan.consumidos;
            const progressPercentage = (plan.consumidos / plan.cantidadTotal) * 100;

            return (
              <div key={plan.id} className="entry-card" style={{ opacity: isFinished ? 0.6 : 1 }}>
                <div className="entry-details" style={{ flex: '1 1 200px' }}>
                  <h3>{plan.cliente}</h3>
                  {plan.telefono && <p>📞 {plan.telefono}</p>}
                  {plan.historial && plan.historial.length > 0 && (
                    <p style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Última entrega: <strong>{plan.historial[0].fecha}</strong>
                    </p>
                  )}
                </div>
                
                <div style={{ flex: '2 1 300px', margin: '0 2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    <span><strong>{plan.consumidos}</strong> consumidos</span>
                    <span><strong>{plan.cantidadTotal}</strong> total</span>
                  </div>
                  <div style={{ background: 'var(--bg-color)', height: '10px', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${progressPercentage}%`, 
                        background: isFinished ? 'var(--danger-text)' : 'var(--accent)',
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </div>
                </div>

                <div style={{ flex: '0 0 150px', textAlign: 'center' }}>
                  <span className={`status-badge ${remaining <= 3 ? (remaining === 0 ? 'completed' : 'pending') : 'completed'}`} style={{ margin: 0, display: 'inline-block' }}>
                    {remaining} disponibles
                  </span>
                </div>

                <div className="icon-actions" style={{ flex: '0 0 auto', marginLeft: '1rem' }}>
                  <button 
                    className="icon-btn" 
                    onClick={() => handleMarcarConsumo(plan.id)}
                    disabled={isFinished}
                    title="Marcar consumo de hoy"
                    style={{ 
                      background: justMarkedId === plan.id ? 'var(--success-text)' : '',
                      color: justMarkedId === plan.id ? '#fff' : '',
                      borderColor: justMarkedId === plan.id ? 'var(--success-text)' : '',
                      opacity: isFinished ? 0.3 : 1,
                      cursor: isFinished ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {justMarkedId === plan.id ? <Check size={18} /> : <CalendarCheck size={18} />}
                  </button>
                  <button 
                    className="icon-btn" 
                    onClick={() => openHistory(plan)}
                    title="Ver historial"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    className="icon-btn delete" 
                    onClick={() => handleDeletePlan(plan.id)}
                    title="Eliminar cliente"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add Plan */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-form-card form-card fade-in" style={{ padding: '2rem', margin: 0 }}>
            <div className="form-header">
              <h3>Nuevo Plan Mensual</h3>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPlan}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Nombre del Cliente</label>
                <input 
                  type="text" 
                  value={newClientName} 
                  onChange={(e) => setNewClientName(e.target.value)} 
                  required 
                  placeholder="Ej: Ana Gómez"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Teléfono (Opcional)</label>
                <input 
                  type="text" 
                  value={newClientPhone} 
                  onChange={(e) => setNewClientPhone(e.target.value)} 
                  placeholder="Ej: 1123456789"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Cantidad de Almuerzos</label>
                <input 
                  type="number" 
                  value={newTotalMeals} 
                  onChange={(e) => setNewTotalMeals(e.target.value)} 
                  required 
                  min="1"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal History */}
      {showHistoryModal && selectedPlan && (
        <div className="modal-overlay">
          <div className="modal-form-card form-card fade-in" style={{ padding: '2rem', margin: 0, maxWidth: '500px' }}>
            <div className="form-header">
              <h3>Historial: {selectedPlan.cliente}</h3>
              <button className="icon-btn" onClick={() => setShowHistoryModal(false)}><X size={20} /></button>
            </div>
            
            <div className="info-banner" style={{ margin: '1rem 0' }}>
              <span>
                Almuerzos restantes: <strong>{selectedPlan.cantidadTotal - selectedPlan.consumidos}</strong> de {selectedPlan.cantidadTotal}
              </span>
            </div>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {selectedPlan.historial.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Aún no hay consumos registrados.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedPlan.historial.map((h, i) => (
                    <div key={i} style={{ 
                      padding: '1rem', 
                      background: 'var(--bg-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(210, 161, 109, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CalendarCheck size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{h.fecha}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{h.notas}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
