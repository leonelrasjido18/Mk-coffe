const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database', err);
  } else {
    console.log('Connected to SQLite database');
    db.run('PRAGMA foreign_keys = ON');
    createTables();
  }
});

function createTables() {
  db.serialize(() => {
    // Ventas
    db.run(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY,
        time TEXT,
        date TEXT,
        customer TEXT,
        item TEXT,
        amount INTEGER,
        method TEXT,
        isAlmuerzo BOOLEAN,
        conEnvio BOOLEAN,
        envioAmount INTEGER,
        envioPagoCliente TEXT,
        envioPagoNosotros TEXT,
        status TEXT
      )
    `);

    // Gastos
    db.run(`
      CREATE TABLE IF NOT EXISTS gastos (
        id INTEGER PRIMARY KEY,
        date TEXT,
        concept TEXT,
        amount INTEGER,
        category TEXT,
        method TEXT DEFAULT 'Efectivo'
      )
    `);

    // Try to add method column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE gastos ADD COLUMN method TEXT DEFAULT 'Efectivo'`, (err) => {
      // Ignore error if column already exists
    });

    // Reservas
    db.run(`
      CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY,
        date TEXT,
        time TEXT,
        amount INTEGER,
        notes TEXT
      )
    `);

    // Planes Mensuales
    db.run(`
      CREATE TABLE IF NOT EXISTS planes (
        id INTEGER PRIMARY KEY,
        cliente TEXT,
        telefono TEXT,
        cantidadTotal INTEGER,
        consumidos INTEGER DEFAULT 0
      )
    `);

    // Historial de Planes
    db.run(`
      CREATE TABLE IF NOT EXISTS planes_historial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER,
        fecha TEXT,
        notas TEXT,
        FOREIGN KEY (plan_id) REFERENCES planes(id) ON DELETE CASCADE
      )
    `);

    console.log('Tables created or already exist');
  });
}

module.exports = db;
