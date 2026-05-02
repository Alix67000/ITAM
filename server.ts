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
    role TEXT DEFAULT 'User',
    FOREIGN KEY(location_id) REFERENCES locations(id)
  );

  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    serial TEXT,
    inventory_number TEXT,
    type TEXT NOT NULL, -- PC, Phone, Printer, etc.
    subtype TEXT, -- Desktop, Laptop, Tablett (for PC)
    status TEXT DEFAULT 'Stock',
    location_id INTEGER,
    supplier_id INTEGER,
    assigned_user_id INTEGER,
    parent_asset_id INTEGER,
    specs TEXT, -- JSON string
    condition TEXT DEFAULT 'neuf',
    value_euros REAL DEFAULT 0,
    manufacture_date DATE,
    commissioning_date DATE,
    has_warranty INTEGER DEFAULT 0,
    warranty_end DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(location_id) REFERENCES locations(id),
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY(assigned_user_id) REFERENCES users(id),
    FOREIGN KEY(parent_asset_id) REFERENCES assets(id)
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
    description TEXT,
    reference TEXT,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS asset_contracts (
    asset_id INTEGER,
    contract_id INTEGER,
    PRIMARY KEY(asset_id, contract_id),
    FOREIGN KEY(asset_id) REFERENCES assets(id),
    FOREIGN KEY(contract_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS softwares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    publisher TEXT,
    type TEXT,
    status TEXT DEFAULT 'Actif',
    supplier_id INTEGER,
    description TEXT,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    software TEXT NOT NULL,
    license_key TEXT,
    total_seats INTEGER DEFAULT 1,
    type TEXT, -- Subscription, Perpetual
    status TEXT DEFAULT 'Actif',
    end_date DATE,
    supplier_id INTEGER,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS asset_licenses (
    asset_id INTEGER,
    license_id INTEGER,
    PRIMARY KEY(asset_id, license_id),
    FOREIGN KEY(asset_id) REFERENCES assets(id),
    FOREIGN KEY(license_id) REFERENCES licenses(id)
  );

  CREATE TABLE IF NOT EXISTS user_licenses (
    user_id INTEGER,
    license_id INTEGER,
    PRIMARY KEY(user_id, license_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(license_id) REFERENCES licenses(id)
  );

  CREATE TABLE IF NOT EXISTS asset_softwares (
    asset_id INTEGER,
    software_id INTEGER,
    PRIMARY KEY(asset_id, software_id),
    FOREIGN KEY(asset_id) REFERENCES assets(id),
    FOREIGN KEY(software_id) REFERENCES softwares(id)
  );

  CREATE TABLE IF NOT EXISTS user_softwares (
    user_id INTEGER,
    software_id INTEGER,
    PRIMARY KEY(user_id, software_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(software_id) REFERENCES softwares(id)
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

  CREATE TABLE IF NOT EXISTS phone_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    number TEXT NOT NULL,
    status TEXT DEFAULT 'Actif',
    location_id INTEGER,
    assigned_user_id INTEGER,
    supplier_id INTEGER,
    contract_id INTEGER,
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(location_id) REFERENCES locations(id),
    FOREIGN KEY(assigned_user_id) REFERENCES users(id),
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY(contract_id) REFERENCES contracts(id)
  );
`);

// Support Migrations for existing databases
const migrations = [
  { table: 'assets', column: 'parent_asset_id', type: 'INTEGER REFERENCES assets(id)' },
  { table: 'assets', column: 'inventory_number', type: 'TEXT' },
  { table: 'contracts', column: 'description', type: 'TEXT' },
  { table: 'contracts', column: 'reference', type: 'TEXT' },
  { table: 'locations', column: 'parent_id', type: 'INTEGER REFERENCES locations(id)' },
  { table: 'users', column: 'role', type: 'TEXT DEFAULT "User"' },
  { table: 'licenses', column: 'supplier_id', type: 'INTEGER REFERENCES suppliers(id)' },
  { table: 'assets', column: 'condition', type: 'TEXT DEFAULT "neuf"' },
  { table: 'assets', column: 'value_euros', type: 'REAL DEFAULT 0' },
  { table: 'assets', column: 'manufacture_date', type: 'DATE' },
  { table: 'assets', column: 'commissioning_date', type: 'DATE' },
  { table: 'assets', column: 'has_warranty', type: 'INTEGER DEFAULT 0' },
  { table: 'assets', column: 'warranty_end', type: 'DATE' }
];

migrations.forEach(m => {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${m.table})`).all() as any[];
    if (!tableInfo.some(col => col.name === m.column)) {
      db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type}`);
    }
  } catch (err) {
    console.error(`Migration error (${m.table}.${m.column}):`, err);
  }
});

// Backfill inventory_number for existing assets if missing
try {
  const assetsWithoutCode = db.prepare("SELECT * FROM assets WHERE inventory_number IS NULL OR inventory_number = ''").all() as any[];
  if (assetsWithoutCode.length > 0) {
    console.log(`Backfilling inventory numbers for ${assetsWithoutCode.length} assets...`);
    const year = new Date().getFullYear().toString().slice(-2);
    const mapping: Record<string, string> = {
      'PC': 'PC',
      'Téléphone': 'TEL',
      'Imprimante': 'IMP',
      'Écran': 'ECR',
      'Périphérique': 'PER',
      'Réseau': 'NW'
    };

    assetsWithoutCode.forEach((asset, i) => {
      const prefix = mapping[asset.type] || 'AST';
      const code = `${prefix}-${year}-${(i + 1).toString().padStart(3, '0')}`;
      db.prepare("UPDATE assets SET inventory_number = ? WHERE id = ?").run(code, asset.id);
    });
  }
} catch (err) {
  console.error("Backfill error:", err);
}

// Seed initial data if empty
const seatUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (seatUsers.count <= 2) { // Increased threshold to ensure we add our new rich data
  // 1. Locations
  const locParis = db.prepare("INSERT INTO locations (name, address) VALUES (?, ?)").run('Siège Paris', '12 rue de la Paix').lastInsertRowid;
  const locLyon = db.prepare("INSERT INTO locations (name, address) VALUES (?, ?)").run('Agence Lyon', '45 avenue des Frères Lumière').lastInsertRowid;
  
  // 2. Suppliers
  const supHardware = db.prepare("INSERT INTO suppliers (name, contact, phone) VALUES (?, ?, ?)").run('Dell Business', 'Support Pro', '01 02 03 04 05').lastInsertRowid;
  const supSoftware = db.prepare("INSERT INTO suppliers (name, contact, phone) VALUES (?, ?, ?)").run('Microsoft Ltd', 'Volume Licensing', '0800 123 456').lastInsertRowid;
  const supPeriph = db.prepare("INSERT INTO suppliers (name, contact, phone) VALUES (?, ?, ?)").run('Logitech Pro', 'Service Clients', '01 99 88 77 66').lastInsertRowid;

  // 3. Users
  const userIT = db.prepare("INSERT INTO users (name, email, department, location_id, role) VALUES (?, ?, ?, ?, ?)").run('Alex Dev', 'alex.dev@tech.com', 'IT', locParis, 'Admin').lastInsertRowid;
  const userHR = db.prepare("INSERT INTO users (name, email, department, location_id, role) VALUES (?, ?, ?, ?, ?)").run('Sarah Rh', 'sarah.rh@tech.com', 'RH', locParis, 'User').lastInsertRowid;
  const userSales = db.prepare("INSERT INTO users (name, email, department, location_id, role) VALUES (?, ?, ?, ?, ?)").run('Marc Sal', 'm.sales@tech.com', 'Sales', locLyon, 'User').lastInsertRowid;

  // 4. Assets: Computers (Main Assets)
  const pcSpecs = JSON.stringify({ cpu: 'Intel Core i7-13700H', ram: '32GB DDR5', storage: '1TB NVMe Gen4', os: 'Windows 11 Pro', gpu: 'NVIDIA RTX A1000' });
  const pcId = db.prepare(`
    INSERT INTO assets (label, serial, type, subtype, status, location_id, supplier_id, assigned_user_id, specs, condition, value_euros, manufacture_date, commissioning_date, has_warranty, warranty_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Workstation-01', 'DELL-P87W-01', 'PC', 'Laptop', 'En service', locParis, supHardware, userIT, pcSpecs, 'neuf', 2450.50, '2023-11-01', '2024-01-05', 1, '2027-01-05').lastInsertRowid;

  const pc2Specs = JSON.stringify({ cpu: 'Apple M3 Pro', ram: '18GB', storage: '512GB', os: 'macOS Sonoma', gpu: '14-core GPU' });
  const pc2Id = db.prepare(`
    INSERT INTO assets (label, serial, type, subtype, status, location_id, supplier_id, assigned_user_id, specs, condition, value_euros, manufacture_date, commissioning_date, has_warranty, warranty_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('MacBook-Rh-02', 'APL-QC88-99', 'PC', 'Laptop', 'En service', locParis, supHardware, userHR, pc2Specs, 'neuf', 2999.00, '2023-10-15', '2023-11-20', 1, '2025-11-20').lastInsertRowid;

  // 5. Assets: Peripherals (Children of PC1)
  const monId = db.prepare(`
    INSERT INTO assets (label, serial, type, status, location_id, supplier_id, parent_asset_id, condition, value_euros, manufacture_date, commissioning_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Écran Dell Ultrasharp 27', 'MON-DS27-101', 'Écran', 'En service', locParis, supHardware, pcId, 'neuf', 550, '2023-01-01', '2024-01-05').lastInsertRowid;

  db.prepare(`
    INSERT INTO assets (label, serial, type, status, location_id, supplier_id, parent_asset_id, condition, value_euros, manufacture_date, commissioning_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Souris MX Master 3S', 'LOGI-MS78-9', 'Souris', 'En service', locParis, supPeriph, pcId, 'neuf', 99, '2023-05-01', '2024-01-10');

  db.prepare(`
    INSERT INTO assets (label, serial, type, status, location_id, supplier_id, parent_asset_id, condition, value_euros, manufacture_date, commissioning_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Clavier Apple Magic', 'APL-KB-442', 'Clavier', 'En service', locParis, supPeriph, pc2Id, 'neuf', 120, '2023-08-01', '2023-11-20');

  // 6. Softwares
  const swVsCode = db.prepare("INSERT INTO softwares (name, publisher, type, supplier_id) VALUES (?, ?, ?, ?)").run('VS Code', 'Microsoft', 'IDE', supSoftware).lastInsertRowid;
  const swOffice = db.prepare("INSERT INTO softwares (name, publisher, type, supplier_id) VALUES (?, ?, ?, ?)").run('Office 365', 'Microsoft', 'Productivity', supSoftware).lastInsertRowid;
  const swAdobe = db.prepare("INSERT INTO softwares (name, publisher, type, supplier_id) VALUES (?, ?, ?, ?)").run('Adobe Creative Cloud', 'Adobe', 'Design', supSoftware).lastInsertRowid;

  // 7. Licenses
  const licO365 = db.prepare(`
    INSERT INTO licenses (label, software, license_key, total_seats, type, status, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('Licence O365 Business Premium', 'Office 365', 'W269N-WFGWX-YVC9B-4J6C9-T83GX', 10, 'Subscription', 'Actif', supSoftware).lastInsertRowid;

  const licAdobe = db.prepare(`
    INSERT INTO licenses (label, software, license_key, total_seats, type, status, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('Adobe Suite (Design Team)', 'Adobe Creative Cloud', 'ADOBE-CC-2024-X99', 5, 'Subscription', 'Actif', '2025-12-31').lastInsertRowid;

  // 8. Associations
  // Link VS Code and Office to PC1
  db.prepare("INSERT INTO asset_softwares (asset_id, software_id) VALUES (?, ?)").run(pcId, swVsCode);
  db.prepare("INSERT INTO asset_softwares (asset_id, software_id) VALUES (?, ?)").run(pcId, swOffice);
  db.prepare("INSERT INTO asset_softwares (asset_id, software_id) VALUES (?, ?)").run(pc2Id, swOffice);
  
  // Assign License seats
  db.prepare("INSERT INTO asset_licenses (asset_id, license_id) VALUES (?, ?)").run(pcId, licO365);
  db.prepare("INSERT INTO asset_licenses (asset_id, license_id) VALUES (?, ?)").run(pc2Id, licO365);
  db.prepare("INSERT INTO user_licenses (user_id, license_id) VALUES (?, ?)").run(userIT, licAdobe);

  // 9. Contracts
  const contractMaint = db.prepare(`
    INSERT INTO contracts (label, type, supplier_id, start_date, end_date, price, status, description, reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Maintenance Pro-Support Dell', 'Maintenance', supHardware, '2024-01-01', '2027-01-01', 1500, 'Actif', 'Support 24/7 sur site J+1', 'CONTRAT-DELL-PREM').lastInsertRowid;

  const contractLeasing = db.prepare(`
    INSERT INTO contracts (label, type, supplier_id, start_date, end_date, price, status, description, reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Leasing Parc PC Lyon', 'Leasing', supHardware, '2023-06-15', '2026-06-15', 5000, 'Actif', 'Location longue durée 36 mois', 'LEASE-LYON-2023').lastInsertRowid;

  // Link Contract to PCs
  db.prepare("INSERT INTO asset_contracts (asset_id, contract_id) VALUES (?, ?)").run(pcId, contractMaint);
  db.prepare("INSERT INTO asset_contracts (asset_id, contract_id) VALUES (?, ?)").run(pc2Id, contractMaint);

  // 10. Initial Events
  db.prepare(`INSERT INTO events (asset_id, action, description) VALUES (?, ?, ?)`).run(pcId, 'Initialisation', 'Configuration complète du poste de travail Alex');
  db.prepare(`INSERT INTO events (asset_id, action, description) VALUES (?, ?, ?)`).run(pc2Id, 'Initialisation', 'Mise en service RH');

  // 11. Phone Lines
  db.prepare(`
    INSERT INTO phone_lines (label, number, status, location_id, assigned_user_id, supplier_id, contract_id, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Ligne Standard Paris', '01 40 00 11 22', 'Actif', locParis, null, supSoftware, contractLeasing, "Ligne d'accueil principale");
  
  db.prepare(`
    INSERT INTO phone_lines (label, number, status, location_id, assigned_user_id, supplier_id, contract_id, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Mobile Alex Dev', '06 12 34 56 78', 'Actif', locParis, userIT, supSoftware, contractMaint, "Forfait illimité pro");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  // Ensure inventory_number is unique and indexed
  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_inventory_number ON assets(inventory_number) WHERE inventory_number IS NOT NULL`);
  } catch (err) {
    console.error("Migration error (inventory_number index):", err);
  }

  // API to get next inventory number for a specific type
  app.get('/api/assets/next-inventory-number/:assetType', (req, res) => {
    const { assetType } = req.params;
    const year = new Date().getFullYear().toString().slice(-2);
    
    // Type mapping logic
    const mapping: Record<string, string> = {
      'PC': 'PC',
      'PC fixe': 'PC',
      'PC portable': 'PL',
      'Tablette': 'TB',
      'Téléphone': 'TEL',
      'Imprimante': 'IMP',
      'Écran': 'ECR',
      'Périphérique': 'PER',
      'Souris': 'PER',
      'Clavier': 'PER',
      'Casque': 'PER'
    };

    const prefix = mapping[assetType] || 'ASSET';
    const pattern = `${prefix}-${year}-%`;

    const lastAsset = db.prepare(`
      SELECT inventory_number FROM assets 
      WHERE inventory_number LIKE ? 
      ORDER BY inventory_number DESC 
      LIMIT 1
    `).get(pattern) as { inventory_number: string } | undefined;

    let nextNum = 1;
    if (lastAsset) {
      const parts = lastAsset.inventory_number.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextNum = lastSeq + 1;
      }
    }

    const formattedNum = nextNum.toString().padStart(3, '0');
    res.json({ nextNumber: `${prefix}-${year}-${formattedNum}` });
  });

  app.get('/api/stats', (req, res) => {
    const assetCount = db.prepare('SELECT COUNT(*) as count FROM assets').get() as { count: number };
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const locationCount = db.prepare('SELECT COUNT(*) as count FROM locations').get() as { count: number };
    const brokenAssets = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'Panne'").get() as { count: number };
    const activeContracts = db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status = 'Actif'").get() as { count: number };
    
    // Enhanced stats
    const totalValue = db.prepare("SELECT SUM(value_euros) as total FROM assets").get() as { total: number };
    const warrantyStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN has_warranty = 1 AND (warranty_end IS NULL OR warranty_end > DATE('now')) THEN 1 END) as under_warranty
      FROM assets
    `).get() as { total: number, under_warranty: number };
    
    const avgAge = db.prepare(`
      SELECT AVG(julianday('now') - julianday(manufacture_date)) as avg_days
      FROM assets
      WHERE manufacture_date IS NOT NULL
    `).get() as { avg_days: number | null };

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
      ORDER BY value DESC
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

    // Upcoming license expirations (next 4 months)
    const upcomingExpirations = db.prepare(`
      SELECT label as name, end_date as date, 'License' as type
      FROM licenses 
      WHERE end_date IS NOT NULL AND end_date > date('now') AND end_date <= date('now', '+4 months')
      UNION ALL
      SELECT label as name, end_date as date, 'Contrat' as type
      FROM contracts
      WHERE end_date IS NOT NULL AND end_date > date('now') AND end_date <= date('now', '+4 months')
      ORDER BY date ASC
      LIMIT 3
    `).all();

    res.json({
      counts: {
        assets: assetCount.count,
        users: userCount.count,
        locations: locationCount.count,
        broken: brokenAssets.count,
        contracts: activeContracts.count,
        totalValue: totalValue.total || 0,
        warrantyPercent: warrantyStats.total > 0 ? (warrantyStats.under_warranty / warrantyStats.total) * 100 : 0,
        averageAgeYears: avgAge.avg_days ? avgAge.avg_days / 365.25 : 0
      },
      recentEvents,
      upcomingExpirations,
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
      (SELECT COUNT(*) FROM asset_contracts ac WHERE ac.asset_id = a.id) as contract_count,
      (SELECT COUNT(*) FROM asset_softwares asw WHERE asw.asset_id = a.id) as software_count,
      (SELECT COUNT(*) FROM asset_licenses al WHERE al.asset_id = a.id) as license_count,
      (SELECT SUM(c.price) FROM contracts c JOIN asset_contracts ac ON c.id = ac.contract_id WHERE ac.asset_id = a.id) as total_contract_price
      FROM assets a 
      LEFT JOIN users u ON a.assigned_user_id = u.id 
      LEFT JOIN locations l ON a.location_id = l.id
    `).all();
    res.json(assets);
  });

  app.post('/api/assets', (req, res) => {
    const { label, serial, inventory_number, type, subtype, status, location_id, supplier_id, assigned_user_id, parent_asset_id, specs, condition, value_euros, manufacture_date, commissioning_date, has_warranty, warranty_end } = req.body;
    const info = db.prepare(`
      INSERT INTO assets (label, serial, inventory_number, type, subtype, status, location_id, supplier_id, assigned_user_id, parent_asset_id, specs, condition, value_euros, manufacture_date, commissioning_date, has_warranty, warranty_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(label, serial, inventory_number, type, subtype, status || 'Stock', location_id, supplier_id, assigned_user_id, parent_asset_id, specs, condition || 'neuf', value_euros || 0, manufacture_date, commissioning_date, has_warranty ? 1 : 0, warranty_end);
    
    // Log event
    db.prepare(`INSERT INTO events (asset_id, action, description) VALUES (?, ?, ?)`).run(info.lastInsertRowid, 'Création', `Asset créé: ${label}`);
    
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/assets/:id', (req, res) => {
    const { id } = req.params;
    const { label, serial, inventory_number, type, subtype, status, location_id, supplier_id, assigned_user_id, parent_asset_id, specs, condition, value_euros, manufacture_date, commissioning_date, has_warranty, warranty_end } = req.body;
    
    db.prepare(`
      UPDATE assets 
      SET label = ?, serial = ?, inventory_number = ?, type = ?, subtype = ?, status = ?, location_id = ?, supplier_id = ?, assigned_user_id = ?, parent_asset_id = ?, specs = ?, condition = ?, value_euros = ?, manufacture_date = ?, commissioning_date = ?, has_warranty = ?, warranty_end = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(label, serial, inventory_number, type, subtype, status, location_id, supplier_id, assigned_user_id, parent_asset_id, specs, condition, value_euros, manufacture_date, commissioning_date, has_warranty ? 1 : 0, warranty_end, id);

    db.prepare(`INSERT INTO events (asset_id, action, description) VALUES (?, ?, ?)`).run(id, 'Modification', `Asset mis à jour`);
    
    res.json({ success: true });
  });

  app.delete('/api/assets/:id', (req, res) => {
    const { id } = req.params;
    
    // Clean up relations
    db.prepare(`DELETE FROM asset_contracts WHERE asset_id = ?`).run(id);
    db.prepare(`DELETE FROM asset_softwares WHERE asset_id = ?`).run(id);
    db.prepare(`DELETE FROM asset_licenses WHERE asset_id = ?`).run(id);
    db.prepare(`UPDATE assets SET parent_asset_id = NULL WHERE parent_asset_id = ?`).run(id);
    db.prepare(`UPDATE mobile_subscriptions SET asset_id = NULL WHERE asset_id = ?`).run(id);
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
      ORDER BY u.name ASC
    `).all();
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const { name, email, department, location_id, role } = req.body;
    const info = db.prepare(`
      INSERT INTO users (name, email, department, location_id, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, department, location_id, role || 'User');
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, department, location_id, role } = req.body;
    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, department = ?, location_id = ?, role = ?
      WHERE id = ?
    `).run(name, email, department, location_id, role, id);
    res.json({ success: true });
  });

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.prepare(`UPDATE assets SET assigned_user_id = NULL WHERE assigned_user_id = ?`).run(id);
    db.prepare(`UPDATE phone_lines SET assigned_user_id = NULL WHERE assigned_user_id = ?`).run(id);
    db.prepare(`DELETE FROM user_licenses WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM user_softwares WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM mobile_subscriptions WHERE user_id = ?`).run(id);
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
    const { label, type, supplier_id, start_date, end_date, price, status, description, reference } = req.body;
    const info = db.prepare(`
      INSERT INTO contracts (label, type, supplier_id, start_date, end_date, price, status, description, reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(label, type, supplier_id, start_date, end_date, price, status, description, reference);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/contracts/:id', (req, res) => {
    const { id } = req.params;
    const { label, type, supplier_id, start_date, end_date, price, status, description, reference } = req.body;
    db.prepare(`
      UPDATE contracts 
      SET label = ?, type = ?, supplier_id = ?, start_date = ?, end_date = ?, price = ?, status = ?, description = ?, reference = ?
      WHERE id = ?
    `).run(label, type, supplier_id, start_date, end_date, price, status, description, reference, id);
    res.json({ success: true });
  });

  app.delete('/api/contracts/:id', (req, res) => {
    const { id } = req.params;
    db.prepare(`DELETE FROM asset_contracts WHERE contract_id = ?`).run(id);
    db.prepare(`UPDATE phone_lines SET contract_id = NULL WHERE contract_id = ?`).run(id);
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
      SELECT l.*, s.name as supplier_name,
      (SELECT COUNT(*) FROM asset_licenses al WHERE al.license_id = l.id) +
      (SELECT COUNT(*) FROM user_licenses ul WHERE ul.license_id = l.id) as used_seats
      FROM licenses l
      LEFT JOIN suppliers s ON l.supplier_id = s.id
      ORDER BY l.label ASC
    `).all();
    res.json(licenses);
  });

  app.post('/api/licenses', (req, res) => {
    const { label, software, license_key, total_seats, type, status, end_date, supplier_id } = req.body;
    const info = db.prepare(`
      INSERT INTO licenses (label, software, license_key, total_seats, type, status, end_date, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(label, software, license_key, total_seats || 1, type, status || 'Actif', end_date, supplier_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/licenses/:id', (req, res) => {
    const { id } = req.params;
    const { label, software, license_key, total_seats, type, status, end_date, supplier_id } = req.body;
    db.prepare(`
      UPDATE licenses 
      SET label = ?, software = ?, license_key = ?, total_seats = ?, type = ?, status = ?, end_date = ?, supplier_id = ?
      WHERE id = ?
    `).run(label, software, license_key, total_seats, type, status, end_date, supplier_id, id);
    res.json({ success: true });
  });

  // Softwares CRUD (Independent)
  app.get('/api/softwares', (req, res) => {
    const softwares = db.prepare(`
      SELECT s.*, sup.name as supplier_name,
      (SELECT COUNT(*) FROM licenses l WHERE l.software = s.name) as license_count
      FROM softwares s
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      ORDER BY s.name ASC
    `).all();
    res.json(softwares);
  });

  app.post('/api/softwares', (req, res) => {
    const { name, publisher, type, status, supplier_id, description } = req.body;
    const info = db.prepare(`
      INSERT INTO softwares (name, publisher, type, status, supplier_id, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, publisher, type, status || 'Actif', supplier_id, description);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/softwares/:id', (req, res) => {
    const { id } = req.params;
    const { name, publisher, type, status, supplier_id, description } = req.body;
    
    // If name changes, we might want to update licenses too if they reference by name
    const oldSoftware = db.prepare('SELECT name FROM softwares WHERE id = ?').get(id) as { name: string };
    if (oldSoftware && oldSoftware.name !== name) {
      db.prepare('UPDATE licenses SET software = ? WHERE software = ?').run(name, oldSoftware.name);
    }

    db.prepare(`
      UPDATE softwares 
      SET name = ?, publisher = ?, type = ?, status = ?, supplier_id = ?, description = ?
      WHERE id = ?
    `).run(name, publisher, type, status, supplier_id, description, id);
    res.json({ success: true });
  });

  app.delete('/api/softwares/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM softwares WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // Keep old bulk software rename for backward compatibility if needed, but we'll prefer the ID-based one
  app.put('/api/softwares-bulk', (req, res) => {
    const { oldName, newName, type, supplier_id } = req.body;
    if (!oldName || !newName) return res.status(400).json({ error: 'Noms requis' });
    
    let query = 'UPDATE licenses SET software = ?';
    const params = [newName];

    if (type !== undefined) {
      query += ', type = ?';
      params.push(type);
    }
    if (supplier_id !== undefined) {
      query += ', supplier_id = ?';
      params.push(supplier_id);
    }

    query += ' WHERE software = ?';
    params.push(oldName);

    db.prepare(query).run(...params);
    res.json({ success: true });
  });

  app.delete('/api/softwares/:name', (req, res) => {
    const { name } = req.params;
    
    // Get all license IDs for this software to clean up joins
    const licenses = db.prepare('SELECT id FROM licenses WHERE software = ?').all(name) as any[];
    const ids = licenses.map(l => l.id);
    
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`DELETE FROM asset_licenses WHERE license_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM user_licenses WHERE license_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM licenses WHERE id IN (${placeholders})`).run(...ids);
    }
    
    res.json({ success: true });
  });

  app.delete('/api/licenses/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM asset_licenses WHERE license_id = ?').run(id);
    db.prepare('DELETE FROM user_licenses WHERE license_id = ?').run(id);
    db.prepare('DELETE FROM licenses WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/licenses/:id/users', (req, res) => {
    const { id } = req.params;
    const users = db.prepare(`
      SELECT u.*, l.name as location_name
      FROM users u
      JOIN user_licenses ul ON u.id = ul.user_id
      LEFT JOIN locations l ON u.location_id = l.id
      WHERE ul.license_id = ?
    `).all(id);
    res.json(users);
  });

  app.post('/api/licenses/:id/users', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    
    // Check seats
    const license = db.prepare(`
      SELECT total_seats,
      (SELECT COUNT(*) FROM user_licenses WHERE license_id = ?) as used_seats
      FROM licenses WHERE id = ?
    `).get(id, id) as { total_seats: number, used_seats: number };

    if (license.used_seats >= license.total_seats) {
      return res.status(400).json({ error: 'Plus de sièges disponibles' });
    }

    try {
      db.prepare('INSERT INTO user_licenses (user_id, license_id) VALUES (?, ?)').run(user_id, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Échec de l\'association' });
    }
  });

  app.delete('/api/licenses/:id/users/:user_id', (req, res) => {
    const { id, user_id } = req.params;
    db.prepare('DELETE FROM user_licenses WHERE license_id = ? AND user_id = ?').run(id, user_id);
    res.json({ success: true });
  });

  // Locations CRUD
  app.get('/api/assets/:id/softwares', (req, res) => {
    const { id } = req.params;
    const softwares = db.prepare(`
      SELECT s.* 
      FROM softwares s
      JOIN asset_softwares asw ON s.id = asw.software_id
      WHERE asw.asset_id = ?
    `).all(id);
    res.json(softwares);
  });

  app.get('/api/assets/:id/licenses', (req, res) => {
    const { id } = req.params;
    const licenses = db.prepare(`
      SELECT l.* 
      FROM licenses l
      JOIN asset_licenses al ON l.id = al.license_id
      WHERE al.asset_id = ?
    `).all(id);
    res.json(licenses);
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

  app.post('/api/licenses/:id/assets', (req, res) => {
    const { id } = req.params;
    const { asset_id } = req.body;

    // Check seats
    const license = db.prepare(`
      SELECT total_seats,
      (SELECT COUNT(*) FROM asset_licenses WHERE license_id = ?) +
      (SELECT COUNT(*) FROM user_licenses WHERE license_id = ?) as used_seats
      FROM licenses WHERE id = ?
    `).get(id, id, id) as { total_seats: number, used_seats: number };

    if (license.used_seats >= license.total_seats) {
      return res.status(400).json({ error: 'Plus de sièges disponibles' });
    }

    try {
      db.prepare('INSERT INTO asset_licenses (asset_id, license_id) VALUES (?, ?)').run(asset_id, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Échec de l\'association' });
    }
  });

  app.delete('/api/licenses/:id/assets/:asset_id', (req, res) => {
    const { id, asset_id } = req.params;
    db.prepare('DELETE FROM asset_licenses WHERE license_id = ? AND asset_id = ?').run(id, asset_id);
    res.json({ success: true });
  });

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
    db.prepare('UPDATE phone_lines SET location_id = NULL WHERE location_id = ?').run(id);
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
    db.prepare('UPDATE licenses SET supplier_id = NULL WHERE supplier_id = ?').run(id);
    db.prepare('UPDATE softwares SET supplier_id = NULL WHERE supplier_id = ?').run(id);
    db.prepare('UPDATE phone_lines SET supplier_id = NULL WHERE supplier_id = ?').run(id);
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/assets/:id/children', (req, res) => {
    const { id } = req.params;
    const children = db.prepare(`
      SELECT a.*, u.name as user_name, l.name as location_name 
      FROM assets a
      LEFT JOIN users u ON a.assigned_user_id = u.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.parent_asset_id = ?
    `).all(id);
    res.json(children);
  });

  app.post('/api/assets/:id/link/:childId', (req, res) => {
    const { id, childId } = req.params;
    db.prepare('UPDATE assets SET parent_asset_id = ? WHERE id = ?').run(id, childId);
    res.json({ success: true });
  });

  app.post('/api/assets/:id/unlink/:childId', (req, res) => {
    const { childId } = req.params;
    db.prepare('UPDATE assets SET parent_asset_id = NULL WHERE id = ?').run(childId);
    res.json({ success: true });
  });

  app.get('/api/softwares/:id/users', (req, res) => {
    const users = db.prepare(`
      SELECT u.* FROM users u
      JOIN user_softwares us ON u.id = us.user_id
      WHERE us.software_id = ?
    `).all(req.params.id);
    res.json(users);
  });

  app.post('/api/softwares/:id/users/:userId', (req, res) => {
    try {
      db.prepare('INSERT INTO user_softwares (software_id, user_id) VALUES (?, ?)').run(req.params.id, req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'API Error' });
    }
  });

  app.delete('/api/softwares/:id/users/:userId', (req, res) => {
    db.prepare('DELETE FROM user_softwares WHERE software_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    res.json({ success: true });
  });

  app.get('/api/softwares/:id/assets', (req, res) => {
    const assets = db.prepare(`
      SELECT a.* FROM assets a
      JOIN asset_softwares asw ON a.id = asw.asset_id
      WHERE asw.software_id = ?
    `).all(req.params.id);
    res.json(assets);
  });

  app.post('/api/softwares/:id/assets/:assetId', (req, res) => {
    try {
      db.prepare('INSERT INTO asset_softwares (software_id, asset_id) VALUES (?, ?)').run(req.params.id, req.params.assetId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'API Error' });
    }
  });

  app.delete('/api/softwares/:id/assets/:assetId', (req, res) => {
    db.prepare('DELETE FROM asset_softwares WHERE software_id = ? AND asset_id = ?').run(req.params.id, req.params.assetId);
    res.json({ success: true });
  });

  // Phone Lines CRUD
  app.get('/api/phone-lines', (req, res) => {
    const lines = db.prepare(`
      SELECT p.*, l.name as location_name, u.name as user_name, s.name as supplier_name, c.label as contract_name
      FROM phone_lines p
      LEFT JOIN locations l ON p.location_id = l.id
      LEFT JOIN users u ON p.assigned_user_id = u.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN contracts c ON p.contract_id = c.id
      ORDER BY p.label ASC
    `).all();
    res.json(lines);
  });

  app.post('/api/phone-lines', (req, res) => {
    const { label, number, status, location_id, assigned_user_id, supplier_id, contract_id, comments } = req.body;
    const info = db.prepare(`
      INSERT INTO phone_lines (label, number, status, location_id, assigned_user_id, supplier_id, contract_id, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(label, number, status || 'Actif', location_id, assigned_user_id, supplier_id, contract_id, comments);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/phone-lines/:id', (req, res) => {
    const { id } = req.params;
    const { label, number, status, location_id, assigned_user_id, supplier_id, contract_id, comments } = req.body;
    db.prepare(`
      UPDATE phone_lines 
      SET label = ?, number = ?, status = ?, location_id = ?, assigned_user_id = ?, supplier_id = ?, contract_id = ?, comments = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(label, number, status, location_id, assigned_user_id, supplier_id, contract_id, comments, id);
    res.json({ success: true });
  });

  app.delete('/api/phone-lines/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM phone_lines WHERE id = ?').run(id);
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
