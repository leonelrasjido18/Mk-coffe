const express = require('express');
const cors = require('cors');
const db = require('./database');
const { initWhatsApp, sendMessage, getStatus, getQR, logoutWhatsApp } = require('./whatsapp');

const app = express();
const PORT = 5005;

app.use(cors());
app.use(express.json());

// --- RUTAS DE VENTAS ---

app.get('/api/ventas', (req, res) => {
  db.all('SELECT * FROM ventas ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Convertir booleanos de 1/0 a true/false
    const ventas = rows.map(v => ({
      ...v,
      isAlmuerzo: Boolean(v.isAlmuerzo),
      conEnvio: Boolean(v.conEnvio)
    }));
    res.json(ventas);
  });
});

app.post('/api/ventas', (req, res) => {
  const { id, time, date, customer, item, amount, method, isAlmuerzo, conEnvio, envioAmount, envioPagoCliente, envioPagoNosotros, status } = req.body;
  
  const query = `
    INSERT INTO ventas (id, time, date, customer, item, amount, method, isAlmuerzo, conEnvio, envioAmount, envioPagoCliente, envioPagoNosotros, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    id, time, date, customer, item, amount, method, 
    isAlmuerzo ? 1 : 0, conEnvio ? 1 : 0, 
    envioAmount, envioPagoCliente, envioPagoNosotros, status
  ];

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.delete('/api/ventas/:id', (req, res) => {
  db.run('DELETE FROM ventas WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.put('/api/ventas/:id', (req, res) => {
  const { customer, item, amount, method, isAlmuerzo, status } = req.body;
  const query = `
    UPDATE ventas 
    SET customer = ?, item = ?, amount = ?, method = ?, isAlmuerzo = ?, status = ?
    WHERE id = ?
  `;
  const params = [customer, item, amount, method, isAlmuerzo ? 1 : 0, status, req.params.id];
  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Update envio flag
app.put('/api/ventas/:id/envio', (req, res) => {
  const { conEnvio, envioAmount } = req.body;
  db.run('UPDATE ventas SET conEnvio = ?, envioAmount = ? WHERE id = ?', [conEnvio ? 1 : 0, envioAmount, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- RUTAS DE GASTOS ---

app.get('/api/gastos', (req, res) => {
  db.all('SELECT * FROM gastos ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/gastos', (req, res) => {
  const { id, date, concept, amount, category, method } = req.body;
  db.run(`INSERT INTO gastos (id, date, concept, amount, category, method) VALUES (?, ?, ?, ?, ?, ?)`, 
    [id, date, concept, amount, category, method || 'Efectivo'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.put('/api/gastos/:id', (req, res) => {
  const { concept, amount, category, method } = req.body;
  db.run(`UPDATE gastos SET concept = ?, amount = ?, category = ?, method = ? WHERE id = ?`, 
    [concept, amount, category, method || 'Efectivo', req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/gastos/:id', (req, res) => {
  db.run('DELETE FROM gastos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- RUTAS DE RESERVAS ---

app.get('/api/reservas', (req, res) => {
  db.all('SELECT * FROM reservas ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/reservas', (req, res) => {
  const { id, date, time, amount, notes } = req.body;
  db.run(`INSERT INTO reservas (id, date, time, amount, notes) VALUES (?, ?, ?, ?, ?)`, 
    [id, date, time, amount, notes], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.put('/api/reservas/:id', (req, res) => {
  const { amount, notes } = req.body;
  db.run(`UPDATE reservas SET amount = ?, notes = ? WHERE id = ?`, 
    [amount, notes, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/reservas/:id', (req, res) => {
  db.run('DELETE FROM reservas WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- RUTAS DE PLANES MENSUALES ---

app.get('/api/planes', (req, res) => {
  db.all('SELECT * FROM planes', [], (err, planes) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all('SELECT * FROM planes_historial ORDER BY id DESC', [], (err, historiales) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const planesCompletos = planes.map(p => {
        return {
          ...p,
          historial: historiales.filter(h => h.plan_id === p.id)
        };
      });
      res.json(planesCompletos.reverse());
    });
  });
});

app.post('/api/planes', (req, res) => {
  const { id, cliente, telefono, cantidadTotal, consumidos } = req.body;
  db.run(`INSERT INTO planes (id, cliente, telefono, cantidadTotal, consumidos) VALUES (?, ?, ?, ?, ?)`,
    [id, cliente, telefono, cantidadTotal, consumidos || 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id });
  });
});

app.post('/api/planes/:id/consumo', (req, res) => {
  const planId = req.params.id;
  const { fecha, notas } = req.body;

  db.serialize(() => {
    db.run('UPDATE planes SET consumidos = consumidos + 1 WHERE id = ?', [planId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run('INSERT INTO planes_historial (plan_id, fecha, notas) VALUES (?, ?, ?)', [planId, fecha, notas], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });
  });
});

app.delete('/api/planes/:id', (req, res) => {
  const planId = req.params.id;
  db.serialize(() => {
    db.run('DELETE FROM planes_historial WHERE plan_id = ?', [planId]);
    db.run('DELETE FROM planes WHERE id = ?', [planId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// --- RUTAS DE WHATSAPP ---

app.get('/api/whatsapp/status', (req, res) => {
  res.json({ connected: getStatus(), hasQR: !!getQR() });
});

app.get('/api/whatsapp/qr', (req, res) => {
  const qr = getQR();
  if (qr) {
    res.json({ qr });
  } else if (getStatus()) {
    res.json({ qr: null, message: 'Ya está conectado, no se necesita QR.' });
  } else {
    res.json({ qr: null, message: 'Esperando generación de QR...' });
  }
});

app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    await logoutWhatsApp();
    res.json({ success: true });
  } catch (err) {
    // No devolver 500: el cliente puede estar inicializándose aún
    console.warn('⚠️ Logout solicitado pero el cliente no estaba listo:', err.message);
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/whatsapp/send', async (req, res) => {
  const { numbers, message } = req.body;
  if (!numbers || !message) return res.status(400).json({ error: 'Faltan números o mensaje' });

  const results = [];
  for (const num of numbers) {
    try {
      await sendMessage(num, message);
      results.push({ number: num, status: 'sent' });
    } catch (err) {
      results.push({ number: num, status: 'error', error: err.message });
    }
  }
  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  // Inicializar WhatsApp al arrancar el servidor
  initWhatsApp();
});
