import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import cors from 'cors';

const db = new Database('parc.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    parent_id INTEGER,
    FOREIGN KEY(parent_id) REFERENCES locations(id)
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    location_id INTEGER,
    FOREIGN KEY(location_id) REFERENCES locations(id)
  );

  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    serial TEXT,
    type TEXT NOT NULL, -- PC, Phone, Printer, etc.
    subtype TEXT, -- Desktop, Laptop, Tablett (for PC)
    status TEXT DEFAULT 'Stock',
    location_id INTEGER,
    supplier_id INTEGER,
    assigned_user_id INTEGER,
    specs TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(location_id) REFERENCES locations(id),
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY(assigned_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    type TEXT, -- Leasing, Maintenance
    supplier_id INTEGER,
    start_date DATE,
    end_date DATE,
    price REAL,
    auto_renew INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Actif',
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS asset_contracts (
    asset_id INTEGER,
    contract_id INTEGER,
    PRIMARY KEY(asset_id, contract_id),
    FOREIGN KEY(asset_id) REFERENCES assets(id),
    FOREIGN KEY(contract_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    software TEXT NOT NULL,
    license_key TEXT,
    total_seats INTEGER DEFAULT 1,
    type TEXT, -- Subscription, Perpetual
    status TEXT DEFAULT 'Actif',
    end_date DATE
  );

  CREATE TABLE IF NOT EXISTS asset_licenses (
    asset_id INTEGER,
    license_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY(asset_id, license_id, user_id),
    FOREIGN KEY(asset_id) REFERENCES assets(id),
    FOREIGN KEY(license_id) REFERENCES licenses(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS mobile_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    provider TEXT,
    cost REAL,
    user_id INTEGER,
    asset_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(asset_id) REFERENCES assets(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    action TEXT NOT NULL,
    description TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(asset_id) REFERENCES assets(id)
  );
`);

// Seed initial data if empty
const seatUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (seatUsers.count === 0) {
  const locId = db.prepare("INSERT INTO locations (name, address) VALUES (?, ?)").run('Siège Paris', '12 rue de la Paix').lastInsertRowid;
  const supId = db.prepare("INSERT INTO suppliers (name, contact) VALUES (?, ?)").run('Dell France', 'Commercial Dell').lastInsertRowid;
  
  const user1 = db.prepare("INSERT INTO users (name, email, department, location_id) VALUES (?, ?, ?, ?)").run('Jean Dupont', 'j.dupont@company.com', 'IT', locId).lastInsertRowid;
  const user2 = db.prepare("INSERT INTO users (name, email, department, location_id) VALUES (?, ?, ?, ?)").run('Marie Curie', 'm.curie@company.com', 'R&D', locId).lastInsertRowid;

  db.prepare(`
    INSERT INTO assets (label, serial, type, subtype, status, location_id, supplier_id, assigned_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Laptop Dev #01', 'DELL-XYZ-001', 'PC', 'Laptop', 'En service', locId, supId, user1);

  db.prepare(`
    INSERT INTO assets (label, serial, type, subtype, status, location_id, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('Écran Bureau 12', 'MON-ABB-99', 'Écran', null, 'Stock', locId, supId);

  db.prepare(`
    INSERT INTO assets (label, serial, type, status, location_id, assigned_user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('iPhone 15 Pro', 'APL-PHE-928', 'Téléphone', 'En service', locId, user2);

  db.prepare(`INSERT INTO events (asset_id, action, description) VALUES (1, 'Initialisation', 'Mise en service initiale')`).run();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/stats', (req, res) => {
    const assetCount = db.prepare('SELECT COUNT(*) as count FROM assets').get() as { count: number };
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const locationCount = db.prepare('SELECT COUNT(*) as count FROM locations').get() as { count: number };
    const brokenAssets = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'Panne'").get() as { count: number };
    
    const recentEvents = db.prepare(`
      SELECT e.*, a.label as asset_label 
      FROM events e 
      LEFT JOIN assets a ON e.asset_id = a.id 
      ORDER BY e.created_at DESC LIMIT 5
    `).all();

    const categories = db.prepare(`
      SELECT type as name, COUNT(*) as value 
      FROM assets 
      GROUP BY type
    `).all();

    const statuses = db.prepare(`
      SELECT status as name, COUNT(*) as value 
      FROM assets 
      GROUP BY status
    `).all();

    const trends = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM assets
      WHERE created_at >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `).all();

    res.json({
      counts: {
        assets: assetCount.count,
        users: userCount.count,
        locations: locationCount.count,
        broken: brokenAssets.count
      },
      recentEvents,
      charts: {
        categories,
        statuses,
        trends
      }
    });
  });

  // Assets CRUD
  app.get('/api/assets', (req, res) => {
    const assets = db.prepare(`
      SELECT a.*, u.name as user_name, l.name as location_name,
      (SELECT COUNT(*) FROM asset_contracts ac WHERE ac.asset_id = a.id) as contract_count
      FROM assets a 
      LEFT JOIN users u ON a.assigned_user_id = u.id 
      LEFT JOIN locations l ON a.location_id = l.id
    `).all();
    res.json(assets);
  });

  app.post('/api/assets', (req, res) => {
    const { label, serial, type, subtype, status, location_id, supplier_id, assigned_user_id, specs } = req.body;
    const info = db.prepare(`
      INSERT INTO assets (label, serial, type, subtype, status, location_id, supplier_id, assigned_user_id, specs)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(label, serial, type, subtype, status || 'Stock', location_id, supplier_id, assigned_user_id, specs);
    
    // Log event
    db.prepare(`INSERT INTO events (asset_id, action, description) VALUES (?, ?, ?)`).run(info.lastInsertRowid, 'Création', `Asset créé: ${label}`);
    
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/assets/:id', (req, res) => {
    const { id } = req.params;
    const { label, serial, type, subtype, status, location_id, supplier_id, assigned_user_id, specs } = req.body;
    
    db.prepare(`
      UPDATE assets 
      SET label = ?, serial = ?, type = ?, subtype = ?, status = ?, location_id = ?, supplier_id = ?, assigned_user_id = ?, specs = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(label, serial, type, subtype, status, location_id, supplier_id, assigned_user_id, specs, id);

    db.prepare(`INSERT INTO events (asset_id, action, description) VALUES (?, ?, ?)`).run(id, 'Modification', `Asset mis à jour`);
    
    res.json({ success: true });
  });

  app.delete('/api/assets/:id', (req, res) => {
    const { id } = req.params;
    
    // Log event before deletion (or skip if preferred, but usually good for history)
    db.prepare(`DELETE FROM events WHERE asset_id = ?`).run(id);
    db.prepare(`DELETE FROM assets WHERE id = ?`).run(id);
    
    res.json({ success: true });
  });

  // Asset-Contract Associations
  app.get('/api/assets/:id/contracts', (req, res) => {
    const { id } = req.params;
    const contracts = db.prepare(`
      SELECT c.*, s.name as supplier_name 
      FROM contracts c 
      JOIN asset_contracts ac ON c.id = ac.contract_id 
      LEFT JOIN suppliers s ON c.supplier_id = s.id
      WHERE ac.asset_id = ?
    `).all(id);
    res.json(contracts);
  });

  app.post('/api/assets/:id/contracts', (req, res) => {
    const { id } = req.params;
    const { contract_id } = req.body;
    try {
      db.prepare('INSERT INTO asset_contracts (asset_id, contract_id) VALUES (?, ?)').run(id, contract_id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Déjà associé ou erreur serveur' });
    }
  });

  app.delete('/api/assets/:id/contracts/:contract_id', (req, res) => {
    const { id, contract_id } = req.params;
    db.prepare('DELETE FROM asset_contracts WHERE asset_id = ? AND contract_id = ?').run(id, contract_id);
    res.json({ success: true });
  });

  // Users CRUD
  app.get('/api/users', (req, res) => {
    const users = db.prepare(`
      SELECT u.*, l.name as location_name 
      FROM users u 
      LEFT JOIN locations l ON u.location_id = l.id
    `).all();
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const { name, email, department, location_id } = req.body;
    const info = db.prepare(`
      INSERT INTO users (name, email, department, location_id)
      VALUES (?, ?, ?, ?)
    `).run(name, email, department, location_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, department, location_id } = req.body;
    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, department = ?, location_id = ?
      WHERE id = ?
    `).run(name, email, department, location_id, id);
    res.json({ success: true });
  });

  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      supplier_id INTEGER,
      start_date TEXT,
      end_date TEXT,
      price REAL,
      status TEXT DEFAULT 'Actif',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )
  `);

  // Migration for description column if table already exists without it
  try {
    const tableInfo = db.prepare("PRAGMA table_info(contracts)").all() as any[];
    const hasDescription = tableInfo.some(col => col.name === 'description');
    if (!hasDescription) {
      db.exec("ALTER TABLE contracts ADD COLUMN description TEXT");
    }
  } catch (err) {
    console.error("Migration error (contracts):", err);
  }

  // Migration for parent_id in locations
  try {
    const tableInfo = db.prepare("PRAGMA table_info(locations)").all() as any[];
    const hasParentId = tableInfo.some(col => col.name === 'parent_id');
    if (!hasParentId) {
      db.exec("ALTER TABLE locations ADD COLUMN parent_id INTEGER REFERENCES locations(id)");
    }
  } catch (err) {
    console.error("Migration error (locations):", err);
  }

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.prepare(`UPDATE assets SET assigned_user_id = NULL WHERE assigned_user_id = ?`).run(id);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
    res.json({ success: true });
  });

  // Contracts CRUD
  app.get('/api/contracts', (req, res) => {
    const contracts = db.prepare(`
      SELECT c.*, s.name as supplier_name,
      (SELECT COUNT(*) FROM asset_contracts ac WHERE ac.contract_id = c.id) as assets_count
      FROM contracts c 
      LEFT JOIN suppliers s ON c.supplier_id = s.id
      ORDER BY c.end_date ASC
    `).all();
    res.json(contracts);
  });

  app.post('/api/contracts', (req, res) => {
    const { label, type, supplier_id, start_date, end_date, price, status, description } = req.body;
    const info = db.prepare(`
      INSERT INTO contracts (label, type, supplier_id, start_date, end_date, price, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(label, type, supplier_id, start_date, end_date, price, status, description);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/contracts/:id', (req, res) => {
    const { id } = req.params;
    const { label, type, supplier_id, start_date, end_date, price, status, description } = req.body;
    db.prepare(`
      UPDATE contracts 
      SET label = ?, type = ?, supplier_id = ?, start_date = ?, end_date = ?, price = ?, status = ?, description = ?
      WHERE id = ?
    `).run(label, type, supplier_id, start_date, end_date, price, status, description, id);
    res.json({ success: true });
  });

  app.delete('/api/contracts/:id', (req, res) => {
    const { id } = req.params;
    db.prepare(`DELETE FROM contracts WHERE id = ?`).run(id);
    res.json({ success: true });
  });

  app.get('/api/contracts/:id/assets', (req, res) => {
    const { id } = req.params;
    const assets = db.prepare(`
      SELECT a.*, u.name as user_name, l.name as location_name
      FROM assets a
      JOIN asset_contracts ac ON a.id = ac.asset_id
      LEFT JOIN users u ON a.assigned_user_id = u.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE ac.contract_id = ?
    `).all(id);
    res.json(assets);
  });

  // Licenses CRUD
  app.get('/api/licenses', (req, res) => {
    const licenses = db.prepare(`
      SELECT l.*,
      (SELECT COUNT(*) FROM asset_licenses al WHERE al.license_id = l.id) as used_seats
      FROM licenses l
      ORDER BY l.label ASC
    `).all();
    res.json(licenses);
  });

  app.post('/api/licenses', (req, res) => {
    const { label, software, license_key, total_seats, type, status, end_date } = req.body;
    const info = db.prepare(`
      INSERT INTO licenses (label, software, license_key, total_seats, type, status, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(label, software, license_key, total_seats || 1, type, status || 'Actif', end_date);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/licenses/:id', (req, res) => {
    const { id } = req.params;
    const { label, software, license_key, total_seats, type, status, end_date } = req.body;
    db.prepare(`
      UPDATE licenses 
      SET label = ?, software = ?, license_key = ?, total_seats = ?, type = ?, status = ?, end_date = ?
      WHERE id = ?
    `).run(label, software, license_key, total_seats, type, status, end_date, id);
    res.json({ success: true });
  });

  app.delete('/api/licenses/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM asset_licenses WHERE license_id = ?').run(id);
    db.prepare('DELETE FROM licenses WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/licenses/:id/assets', (req, res) => {
    const { id } = req.params;
    const assets = db.prepare(`
      SELECT a.*, u.name as user_name, l.name as location_name
      FROM assets a
      JOIN asset_licenses al ON a.id = al.asset_id
      LEFT JOIN users u ON a.assigned_user_id = u.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE al.license_id = ?
    `).all(id);
    res.json(assets);
  });

  // Locations CRUD
  app.get('/api/locations', (req, res) => {
    const locations = db.prepare(`
      SELECT l1.*, l2.name as parent_name 
      FROM locations l1 
      LEFT JOIN locations l2 ON l1.parent_id = l2.id
    `).all();
    res.json(locations);
  });
  app.post('/api/locations', (req, res) => {
    const { name, address, parent_id } = req.body;
    const info = db.prepare('INSERT INTO locations (name, address, parent_id) VALUES (?, ?, ?)').run(name, address, parent_id);
    res.json({ id: info.lastInsertRowid });
  });
  app.put('/api/locations/:id', (req, res) => {
    const { id } = req.params;
    const { name, address, parent_id } = req.body;
    db.prepare('UPDATE locations SET name = ?, address = ?, parent_id = ? WHERE id = ?').run(name, address, parent_id, id);
    res.json({ success: true });
  });
  app.delete('/api/locations/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('UPDATE users SET location_id = NULL WHERE location_id = ?').run(id);
    db.prepare('UPDATE assets SET location_id = NULL WHERE location_id = ?').run(id);
    db.prepare('UPDATE locations SET parent_id = NULL WHERE parent_id = ?').run(id);
    db.prepare('DELETE FROM locations WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/suppliers', (req, res) => res.json(db.prepare('SELECT * FROM suppliers').all()));
  app.post('/api/suppliers', (req, res) => {
    const { name, contact, phone } = req.body;
    const info = db.prepare('INSERT INTO suppliers (name, contact, phone) VALUES (?, ?, ?)').run(name, contact, phone);
    res.json({ id: info.lastInsertRowid });
  });
  app.put('/api/suppliers/:id', (req, res) => {
    const { id } = req.params;
    const { name, contact, phone } = req.body;
    db.prepare('UPDATE suppliers SET name = ?, contact = ?, phone = ? WHERE id = ?').run(name, contact, phone, id);
    res.json({ success: true });
  });
  app.delete('/api/suppliers/:id', (req, res) => {
    const { id } = req.params;
    // Set supplier_id to NULL in related tables
    db.prepare('UPDATE assets SET supplier_id = NULL WHERE supplier_id = ?').run(id);
    db.prepare('UPDATE contracts SET supplier_id = NULL WHERE supplier_id = ?').run(id);
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // Vite setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
