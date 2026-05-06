import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Truck } from 'lucide-react';
import { API_URL } from '../config';

export default function CerrarCaja({ ventas, gastos, reservas, config }) {
  const [efectivoInicial, setEfectivoInicial] = useState(() => localStorage.getItem('mk_efectivoInicial') || '0');
  const [plataASacar, setPlataASacar] = useState(() => localStorage.getItem('mk_plataASacar') || '0');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    localStorage.setItem('mk_efectivoInicial', efectivoInicial);
  }, [efectivoInicial]);

  useEffect(() => {
    localStorage.setItem('mk_plataASacar', plataASacar);
  }, [plataASacar]);

  const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getLocalToday();

  // Dynamic daily totals
  const todayVentas = ventas.filter(v => v.date === todayStr);
  const todayGastos = gastos.filter(g => g.date === todayStr);

  const ventasEfectivo = todayVentas.filter(v => v.method === 'Efectivo').reduce((a, v) => a + v.amount, 0);
  const ventasTransferencia = todayVentas.filter(v => v.method === 'Transferencia').reduce((a, v) => a + v.amount, 0);
  
  const gastosEfectivo = todayGastos.filter(g => g.method !== 'Transferencia').reduce((a, g) => a + g.amount, 0);
  const gastosTransferencia = todayGastos.filter(g => g.method === 'Transferencia').reduce((a, g) => a + g.amount, 0);
  const totalGastos = gastosEfectivo + gastosTransferencia;

  const reservasHoy = reservas ? reservas.filter(r => r.date === todayStr).reduce((a, r) => a + r.amount, 0) : 0;

  // Envíos
  const envios = todayVentas.filter(v => v.conEnvio);
  const enviosTotal = envios.reduce((a, v) => a + v.envioAmount, 0);
  const enviosClienteTransf = envios.filter(v => v.envioPagoCliente === 'Transferencia').reduce((a, v) => a + v.envioAmount, 0);
  const enviosClienteEfect = envios.filter(v => v.envioPagoCliente === 'Efectivo').reduce((a, v) => a + v.envioAmount, 0);
  
  const enviosNosotrosEfect = envios.filter(v => v.envioPagoNosotros === 'Efectivo').reduce((a, v) => a + v.envioAmount, 0);
  const enviosNosotrosTransf = envios.filter(v => v.envioPagoNosotros === 'Transferencia').reduce((a, v) => a + v.envioAmount, 0);

  const totalVentas = ventasEfectivo + ventasTransferencia;
  const balanceNeto = totalVentas - totalGastos;

  // Movimiento real de dinero
  const efectivoReal = parseInt(efectivoInicial || 0)
    + ventasEfectivo
    - gastosEfectivo
    - reservasHoy
    + enviosClienteEfect    // envíos cobrados en efectivo
    - enviosNosotrosEfect;  // envíos pagados en efectivo

  const transferenciaReal = ventasTransferencia
    - gastosTransferencia
    + enviosClienteTransf   // envíos cobrados por transferencia
    - enviosNosotrosTransf; // envíos pagados por transferencia

  const [sendingWa, setSendingWa] = useState(false);
  const [waResult, setWaResult] = useState(null);

  const handleConfirmar = async () => {
    // Guardar automáticamente lo que queda en caja como efectivo inicial del día siguiente
    const quedaEnCaja = efectivoReal - parseInt(plataASacar || 0);
    localStorage.setItem('mk_efectivoInicial', quedaEnCaja.toString());
    setEfectivoInicial(quedaEnCaja.toString());

    setConfirmed(true);

    const nums = config?.whatsappNumbers || [];
    if (nums.length > 0) {
      setSendingWa(true);
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      const msj = 
`*MK Food & Gym - Cierre de Caja*
Fecha: ${formattedDate}

*Ingresos y Egresos*
📈 Recaudación: $${totalVentas.toLocaleString()}
📉 Gastos: $${totalGastos.toLocaleString()}
📊 Balance Neto: $${balanceNeto.toLocaleString()}

*Cierre Físico y Digital*
💰 Reservas Apartadas Hoy: $${reservasHoy.toLocaleString()}
💵 Efectivo en Caja Esperado: $${efectivoReal.toLocaleString()}
🏦 Transferencias Totales: $${transferenciaReal.toLocaleString()}

*Retiro de Caja*
💸 Efectivo a Retirar: $${parseInt(plataASacar || 0).toLocaleString()}
🔒 Queda en Caja para Mañana: $${(efectivoReal - parseInt(plataASacar || 0)).toLocaleString()}`;
      
      try {
        const res = await fetch(`${API_URL}/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numbers: nums, message: msj })
        });
        const data = await res.json();
        const allSent = data.results?.every(r => r.status === 'sent');
        setWaResult(allSent ? 'success' : 'partial');
      } catch (err) {
        console.error(err);
        setWaResult('error');
      } finally {
        setSendingWa(false);
      }
    }
  };

  return (
    <div className="dashboard-content">
      <div className="controls-bar">
        <h2><Save className="icon" /> Cierre de Caja Diario</h2>
      </div>

      {confirmed ? (
        <div className="cierre-success fade-in">
          <CheckCircle size={65} />
          <h2>¡Caja Cerrada Exitosamente!</h2>
          <p>El cierre del día ha sido registrado correctamente.</p>
          
          {sendingWa && (
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }} className="fade-in">
              📤 Enviando resumen por WhatsApp...
            </div>
          )}
          {waResult === 'success' && (
            <div style={{ marginTop: '1rem', color: 'var(--success-text)' }} className="fade-in">
              ✅ Resumen enviado correctamente por WhatsApp a todos los destinatarios.
            </div>
          )}
          {waResult === 'partial' && (
            <div style={{ marginTop: '1rem', color: 'var(--warning-text)' }} className="fade-in">
              ⚠️ Algunos mensajes no se pudieron enviar. Verificá los números en Configuración.
            </div>
          )}
          {waResult === 'error' && (
            <div style={{ marginTop: '1rem', color: 'var(--danger-text)' }} className="fade-in">
              ❌ No se pudo conectar con WhatsApp. Asegurate de que el servidor esté vinculado.
            </div>
          )}

          <button className="btn-outline" onClick={() => { setConfirmed(false); setWaResult(null); }} style={{ marginTop: '1.75rem' }}>Volver a Ver Resumen</button>
        </div>
      ) : (
        <div className="cierre-container">
          {/* Efectivo Inicial */}
          <div className="cierre-section">
            <h3>Efectivo Inicial en Caja</h3>
            <div className="form-group" style={{ maxWidth: '300px' }}>
              <input
                type="number"
                placeholder="$ Monto inicial"
                value={efectivoInicial}
                onChange={e => setEfectivoInicial(e.target.value)}
              />
            </div>
          </div>

          <div className="cierre-divider"></div>

          {/* Ingresos */}
          <div className="cierre-section">
            <h3>Resumen de Ventas</h3>
            <div className="cierre-row">
              <span>Ventas cobradas en Efectivo</span>
              <strong className="positive">${ventasEfectivo.toLocaleString()}</strong>
            </div>
            <div className="cierre-row">
              <span>Ventas cobradas por Transferencia</span>
              <strong className="positive">${ventasTransferencia.toLocaleString()}</strong>
            </div>
            <div className="cierre-row highlight">
              <span>Total Ventas</span>
              <strong className="positive">${totalVentas.toLocaleString()}</strong>
            </div>
          </div>

          <div className="cierre-divider"></div>

          {/* Gastos */}
          <div className="cierre-section">
            <h3>Gastos del Día</h3>
            <div className="cierre-row">
              <span>Gastos registrados</span>
              <strong className="negative">-${totalGastos.toLocaleString()}</strong>
            </div>
          </div>

          <div className="cierre-divider"></div>

          {/* Envíos — la clave */}
          <div className="cierre-section">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} /> Envíos (Reconciliación)
            </h3>
            <div className="info-banner" style={{ margin: '0.75rem 0 1rem' }}>
              <AlertCircle size={18} />
              <span>
                Los envíos no son ganancia ni gasto, pero <strong>mueven dinero entre efectivo y transferencia</strong>.
                Acá se explica por qué puede sobrar en transferencia y faltar en efectivo.
              </span>
            </div>

            <div className="cierre-row">
              <span>Clientes pagaron envío por <strong>Transferencia</strong></span>
              <strong>+${enviosClienteTransf.toLocaleString()} en Transferencia</strong>
            </div>
            {enviosClienteEfect > 0 && (
              <div className="cierre-row">
                <span>Clientes pagaron envío en <strong>Efectivo</strong></span>
                <strong>+${enviosClienteEfect.toLocaleString()} en Efectivo</strong>
              </div>
            )}
            <div className="cierre-row">
              <span>Pagamos al delivery en <strong>Efectivo</strong></span>
              <strong className="negative">-${enviosNosotrosEfect.toLocaleString()} en Efectivo</strong>
            </div>
            {enviosNosotrosTransf > 0 && (
              <div className="cierre-row">
                <span>Pagamos al delivery por <strong>Transferencia</strong></span>
                <strong className="negative">-${enviosNosotrosTransf.toLocaleString()} en Transferencia</strong>
              </div>
            )}

            <div className="cierre-row highlight">
              <span>Efecto en <strong>Transferencia</strong></span>
              <strong style={{ color: 'var(--info-text)' }}>+${(enviosClienteTransf - enviosNosotrosTransf).toLocaleString()} (sobra)</strong>
            </div>
            <div className="cierre-row">
              <span>Efecto en <strong>Efectivo</strong></span>
              <strong className="negative">-${(enviosNosotrosEfect - enviosClienteEfect).toLocaleString()} (falta)</strong>
            </div>
          </div>

          <div className="cierre-divider"></div>

          {/* Balance Final */}
          <div className="cierre-section total">
            <div className="cierre-row">
              <span>Balance Neto del Día (ventas - gastos)</span>
              <strong className={balanceNeto >= 0 ? 'positive' : 'negative'} style={{ fontSize: '1.5rem' }}>
                ${balanceNeto.toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="cierre-divider"></div>

          {/* Totales Reales en Caja */}
          <div className="cierre-section">
            <h3>💰 Dinero Real Esperado</h3>
            <div className="cierre-row">
              <span>Efectivo esperado en caja</span>
              <strong style={{ fontSize: '1.4rem' }}>
                ${efectivoReal.toLocaleString()}
              </strong>
            </div>
            <div className="cierre-row" style={{ opacity: 0.7, fontSize: '0.85rem' }}>
              <span>= Inicial ({parseInt(efectivoInicial || 0).toLocaleString()}) + Ventas Efect. ({ventasEfectivo.toLocaleString()}) - Gastos Efect. ({gastosEfectivo.toLocaleString()}) - Reservas ({reservasHoy.toLocaleString()}) + Envíos Efect. cliente ({enviosClienteEfect.toLocaleString()}) - Envíos pagados efect. ({enviosNosotrosEfect.toLocaleString()})</span>
              <span></span>
            </div>
            <div className="cierre-row" style={{ marginTop: '0.5rem' }}>
              <span>Transferencias totales recibidas</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--info-text)' }}>
                ${transferenciaReal.toLocaleString()}
              </strong>
            </div>
            <div className="cierre-row" style={{ opacity: 0.7, fontSize: '0.85rem' }}>
              <span>= Ventas Transf. ({ventasTransferencia.toLocaleString()}) - Gastos Transf. ({gastosTransferencia.toLocaleString()}) + Envíos Transf. cliente ({enviosClienteTransf.toLocaleString()}) - Envíos pagados transf. ({enviosNosotrosTransf.toLocaleString()})</span>
              <span></span>
            </div>
          </div>

          <div className="cierre-divider"></div>

          {/* Reserva para mañana */}
          {/* Retiro de Plata */}
          <div className="cierre-section">
            <h3>💸 Retiro de Caja</h3>
            <div className="info-banner" style={{ margin: '0.75rem 0 1rem' }}>
              <span>¿Cuánta plata vas a retirar de la caja al finalizar el día? El resto quedará como inicial de mañana.</span>
            </div>
            <div className="cierre-row">
              <span>Monto a retirar ($)</span>
              <div className="form-group" style={{ maxWidth: '150px', margin: 0 }}>
                <input
                  type="number"
                  placeholder="$0"
                  value={plataASacar}
                  onChange={e => setPlataASacar(e.target.value)}
                  style={{ padding: '0.5rem', textAlign: 'right' }}
                />
              </div>
            </div>
            <div className="cierre-row highlight" style={{ marginTop: '1rem', backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '8px' }}>
              <span>🔒 Queda en Caja para mañana</span>
              <strong className="positive" style={{ fontSize: '1.4rem' }}>
                ${(efectivoReal - parseInt(plataASacar || 0)).toLocaleString()}
              </strong>
            </div>
          </div>

          <button className="btn-primary cierre-btn" onClick={handleConfirmar}>
            <Save size={22} /> CONFIRMAR CIERRE DE CAJA
          </button>
        </div>
      )}
    </div>
  );
}
