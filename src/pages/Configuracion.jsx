import React, { useState, useEffect } from 'react';
import { Settings, Save, Smartphone, MessageCircle, Plus, Trash2, Wifi, WifiOff, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function Configuracion({ config, setConfig }) {
  const [numbers, setNumbers] = useState(config.whatsappNumbers || []);
  const [newNumber, setNewNumber] = useState('');
  const [saved, setSaved] = useState(false);

  // WhatsApp connection state
  const [waConnected, setWaConnected] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [qrMessage, setQrMessage] = useState('Cargando...');
  const [disconnecting, setDisconnecting] = useState(false);

  // Polling for WhatsApp status + QR
  useEffect(() => {
    let interval;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/whatsapp/status`);
        const data = await res.json();
        setWaConnected(data.connected);

        if (!data.connected) {
          // Si no está conectado, pedir el QR
          const qrRes = await fetch(`${API_URL}/whatsapp/qr`);
          const qrData = await qrRes.json();
          if (qrData.qr) {
            setQrImage(qrData.qr);
            setQrMessage(null);
          } else {
            setQrImage(null);
            setQrMessage(qrData.message || 'Esperando QR...');
          }
        } else {
          setQrImage(null);
          setQrMessage(null);
        }
      } catch (err) {
        setQrMessage('No se puede conectar con el servidor.');
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 3000); // Verificar cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  const handleAddNumber = () => {
    const trimmed = newNumber.trim();
    if (!trimmed) return;
    if (numbers.includes(trimmed)) return;
    setNumbers([...numbers, trimmed]);
    setNewNumber('');
  };

  const handleRemoveNumber = (num) => {
    setNumbers(numbers.filter(n => n !== num));
  };

  const handleSave = () => {
    setConfig({ ...config, whatsappNumbers: numbers });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = async () => {
    if (!window.confirm('¿Estás seguro de que querés desincronizar WhatsApp? Tendrás que volver a escanear el QR.')) return;
    setDisconnecting(true);
    try {
      await fetch(`${API_URL}/whatsapp/logout`, { method: 'POST' });
      setWaConnected(false);
      setQrMessage('Desconectado. Generando nuevo QR...');
    } catch (err) {
      console.error(err);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="controls-bar">
        <h2><Settings className="icon" /> Configuración</h2>
      </div>

      {/* --- SECCIÓN: CONEXIÓN WHATSAPP --- */}
      <div className="form-card fade-in" style={{ maxWidth: '600px', margin: '0 0 2rem' }}>
        <div className="form-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {waConnected ? <Wifi size={20} color="var(--success-text)" /> : <WifiOff size={20} color="var(--danger-text)" />}
            Conexión WhatsApp
          </h3>
          <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '600',
            background: waConnected ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
            color: waConnected ? 'var(--success-text)' : 'var(--danger-text)',
          }}>
            {waConnected ? '● Conectado' : '● Desconectado'}
          </span>
        </div>

        {waConnected ? (
          <div>
            {/* Banner de sincronizado */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: 'rgba(74, 222, 128, 0.08)',
              border: '1px solid rgba(74, 222, 128, 0.25)',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(74, 222, 128, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={28} color="var(--success-text)" />
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--success-text)', fontSize: '1rem', marginBottom: '3px' }}>
                  ✅ Sincronizado con WhatsApp
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Los mensajes del cierre de caja se enviarán automáticamente desde el número vinculado.
                </div>
              </div>
            </div>

            {/* Botón de desincronizar */}
            <button
              onClick={handleLogout}
              disabled={disconnecting}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid rgba(232, 90, 90, 0.35)',
                background: 'rgba(232, 90, 90, 0.08)',
                color: 'var(--danger-text)',
                fontWeight: '600',
                cursor: disconnecting ? 'not-allowed' : 'pointer',
                opacity: disconnecting ? 0.6 : 1,
                transition: 'all 0.2s ease',
                fontSize: '0.9rem',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(232, 90, 90, 0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(232, 90, 90, 0.08)'}
            >
              <LogOut size={18} />
              {disconnecting ? 'Desconectando...' : 'Desincronizar WhatsApp'}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Escaneá este código QR con tu celular desde <strong>WhatsApp → Dispositivos Vinculados → Vincular Dispositivo</strong>
            </p>
            
            {qrImage ? (
              <div style={{
                display: 'inline-block',
                padding: '1rem',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}>
                <img src={qrImage} alt="QR WhatsApp" style={{ width: '250px', height: '250px', display: 'block' }} />
              </div>
            ) : (
              <div style={{
                padding: '3rem',
                border: '2px dashed var(--border-color)',
                borderRadius: '16px',
                color: 'var(--text-secondary)'
              }}>
                <RefreshCw size={30} style={{ marginBottom: '0.75rem', animation: 'spin 2s linear infinite' }} />
                <p>{qrMessage}</p>
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1rem', opacity: 0.7 }}>
              El código se actualiza automáticamente. Si expira, esperá unos segundos.
            </p>
          </div>
        )}
      </div>

      {/* --- SECCIÓN: NÚMEROS DESTINATARIOS --- */}
      <div className="form-card fade-in" style={{ maxWidth: '600px', margin: '0 0 2rem' }}>
        <div className="form-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={20} color="var(--success-text)" /> Destinatarios del Cierre de Caja
          </h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Estos números recibirán el resumen diario automáticamente cuando confirmes el <strong>Cierre de Caja</strong>.
        </p>

        {/* Lista de números registrados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {numbers.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '10px' }}>
              No hay números registrados. Agregá al menos uno.
            </div>
          )}
          {numbers.map((num, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Smartphone size={18} color="var(--success-text)" />
                <span style={{ fontWeight: '600' }}>+{num}</span>
              </div>
              <button
                className="icon-btn delete"
                onClick={() => handleRemoveNumber(num)}
                title="Eliminar número"
                style={{ padding: '0.3rem' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Agregar nuevo número */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Agregar número (con código de país, sin el +)</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0 1rem',
              flex: 1
            }}>
              <Smartphone size={18} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
              <input
                type="text"
                placeholder="Ej: 543876123456"
                value={newNumber}
                onChange={e => setNewNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNumber()}
                style={{ border: 'none', padding: '0.85rem 0', flex: 1 }}
              />
            </div>
            <button className="btn-primary" onClick={handleAddNumber} style={{ whiteSpace: 'nowrap' }}>
              <Plus size={18} /> Agregar
            </button>
          </div>
          <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
            Ejemplo para Argentina: 549 seguido del código de área y número (sin guiones ni espacios).
          </small>
        </div>

        <button
          className="btn-primary"
          onClick={handleSave}
          style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}
        >
          <Save size={18} style={{ marginRight: '8px' }} />
          {saved ? '✔ GUARDADO' : 'GUARDAR CONFIGURACIÓN'}
        </button>

        {saved && (
          <div style={{ marginTop: '1rem', color: 'var(--success-text)', textAlign: 'center', fontSize: '0.9rem' }} className="fade-in">
            ¡Configuración guardada correctamente!
          </div>
        )}
      </div>
    </div>
  );
}
