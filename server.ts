import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { LocalJsonDb } from "./src/services/localJsonDb";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

type Database = LocalJsonDb;
let db: Database | null = null;

// Initialize SQLite Database schema
async function initDb() {
  db = new LocalJsonDb();

  // Create Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT,
      createdAt TEXT
    )
  `);

  // Create Materials table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      itemCode TEXT,
      materialName TEXT,
      grade TEXT,
      active INTEGER,
      specs TEXT,
      createdAt TEXT,
      rawData TEXT
    )
  `);

  // Create Suppliers table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE,
      gstNumber TEXT,
      address TEXT,
      email TEXT,
      contactNumber TEXT,
      createdAt TEXT
    )
  `);

  // Create GRN table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS grns (
      id TEXT PRIMARY KEY,
      grnNumber TEXT,
      invoiceNumber TEXT,
      grnDate TEXT,
      receivedDate TEXT,
      supplierName TEXT,
      supplierGst TEXT,
      materialId TEXT,
      materialName TEXT,
      grade TEXT,
      quantity REAL,
      batchNumber TEXT,
      vehicleNumber TEXT,
      receivedQty REAL,
      qcStatus TEXT,
      qcReleaseDate TEXT,
      operatorName TEXT,
      createdAt TEXT,
      rawData TEXT
    )
  `);

  // Create Outwards table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS outwards (
      id TEXT PRIMARY KEY,
      outwardNumber TEXT,
      outwardDate TEXT,
      issueToDept TEXT,
      batchNumber TEXT,
      materialId TEXT,
      materialName TEXT,
      quantityRequested REAL,
      quantityIssued REAL,
      operatorName TEXT,
      createdAt TEXT,
      rawData TEXT
    )
  `);

  // Create Company Profile table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS company_profile (
      id TEXT PRIMARY KEY,
      companyName TEXT,
      logoUrl TEXT,
      gstNumber TEXT,
      address TEXT,
      email TEXT,
      contactNumber TEXT,
      updatedAt TEXT
    )
  `);

  // Run migrations dynamically to ensure rawData exists in any existing tables
  try {
    await db.exec(`ALTER TABLE materials ADD COLUMN rawData TEXT;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE grns ADD COLUMN rawData TEXT;`);
  } catch (e) {}
  try {
    await db.exec(`ALTER TABLE outwards ADD COLUMN rawData TEXT;`);
  } catch (e) {}

  // Seed default data if users table is empty
  const userCount = await db.get("SELECT COUNT(*) as count FROM users");
  if (userCount && userCount.count === 0) {
    console.log("Seeding initial administrator and operator users into SQLite...");
    const seedUsers = [
      { id: 'u1', username: 'hr@ulivanutrition.com', password: '123', name: 'SUMIT SURELIYA', role: 'Admin', createdAt: new Date().toISOString() },
      { id: 'u2', username: 'operator', password: '123', name: 'Material Operator', role: 'GRN Operator', createdAt: new Date().toISOString() },
      { id: 'u3', username: 'qc', password: '123', name: 'QC Manager', role: 'QC Operator', createdAt: new Date().toISOString() },
      { id: 'u4', username: 'admin', password: '123', name: 'Super Admin', role: 'Admin', createdAt: new Date().toISOString() }
    ];
    for (const u of seedUsers) {
      await db.run(
        `INSERT OR IGNORE INTO users (id, username, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [u.id, u.username, u.password, u.name, u.role, u.createdAt]
      );
    }
  }

  // Seed default suppliers if empty
  const supplierCount = await db.get("SELECT COUNT(*) as count FROM suppliers");
  if (supplierCount && supplierCount.count === 0) {
    console.log("Seeding default suppliers in SQLite...");
    const seedSuppliers = [
      { id: 'sup1', name: 'Alkem Laboratories Ltd', gstNumber: '24AAAAC1234A1Z1', address: 'Plot 12, GIDC, Ankleshwar', email: 'ankleshwar@alkem.com', contactNumber: '9876543210', createdAt: new Date().toISOString() },
      { id: 'sup2', name: 'Sun Pharmaceutical Industries', gstNumber: '24AAACT5678B2Z2', address: 'Survey No. 45, Halol, Gujarat', email: 'purchase@sunpharma.com', contactNumber: '8765432109', createdAt: new Date().toISOString() },
      { id: 'sup3', name: 'Aarti Industries Ltd', gstNumber: '24AAACA9876C3Z3', address: 'Plot 501, Sachin GIDC, Surat', email: 'sales@aarti.com', contactNumber: '7654321098', createdAt: new Date().toISOString() }
    ];
    for (const s of seedSuppliers) {
      await db.run(
        `INSERT OR IGNORE INTO suppliers (id, name, gstNumber, address, email, contactNumber, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.name, s.gstNumber, s.address, s.email, s.contactNumber, s.createdAt]
      );
    }
  }

  // Seed company profile if empty
  const profileCount = await db.get("SELECT COUNT(*) as count FROM company_profile");
  if (profileCount && profileCount.count === 0) {
    await db.run(
      `INSERT OR IGNORE INTO company_profile (id, companyName, logoUrl, gstNumber, address, email, contactNumber, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['main', 'U Liva Nutrition Pvt. Ltd.', '', '24AAACU1234M1Z5', 'Plot No. 89A, GIDC Industrial Estate, Nadiad, Gujarat, 387001', 'info@ulivanutrition.com', '+91 99999 88888', new Date().toISOString()]
    );
  }
}

// REST Interface declarations
async function startServer() {
  await initDb();

  // --- API ROUTE HANDLERS ---

  // Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "alive", engine: "SQLite 3", file: "data.db" });
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const rows = await db!.all("SELECT * FROM users");
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { id, username, password, name, role, createdAt } = req.body;
      await db!.run(
        `INSERT OR REPLACE INTO users (id, username, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, username, password, name, role, createdAt]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Materials
  app.get("/api/materials", async (req, res) => {
    try {
      const rows = await db!.all("SELECT * FROM materials");
      const mapped = rows.map(r => {
        if (r.rawData) {
          try {
            return JSON.parse(r.rawData);
          } catch (err) {}
        }
        return {
          id: r.id,
          materialCode: r.itemCode || '',
          materialName: r.materialName || '',
          category: 'Raw Material',
          uom: 'KG',
          minStock: 550,
          active: r.active === 1,
          createdAt: r.createdAt || new Date().toISOString()
        };
      });
      res.json(mapped);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const material = req.body;
      const { id, materialCode, materialName, active, createdAt } = material;
      const activeInt = active ? 1 : 0;
      await db!.run(
        `INSERT OR REPLACE INTO materials (id, itemCode, materialName, active, createdAt, rawData) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, materialCode || null, materialName || null, activeInt, createdAt || null, JSON.stringify(material)]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      await db!.run(`DELETE FROM materials WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    try {
      const rows = await db!.all("SELECT * FROM suppliers");
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const { id, name, gstNumber, address, email, contactNumber, createdAt } = req.body;
      await db!.run(
        `INSERT OR REPLACE INTO suppliers (id, name, gstNumber, address, email, contactNumber, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, gstNumber, address, email, contactNumber, createdAt]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GRN records
  app.get("/api/grns", async (req, res) => {
    try {
      const rows = await db!.all("SELECT * FROM grns");
      const mapped = rows.map(r => {
        if (r.rawData) {
          try {
            return JSON.parse(r.rawData);
          } catch (err) {}
        }
        return {
          id: r.id,
          grnNo: r.grnNumber || '',
          grnDate: r.grnDate || '',
          supplierName: r.supplierName || '',
          materialId: r.materialId || '',
          materialName: r.materialName || '',
          batchNo: r.batchNumber || '',
          qty: r.quantity || 0,
          qcStatus: r.qcStatus || 'Pending',
          qcReleaseDate: r.qcReleaseDate || undefined,
          invoiceNo: r.invoiceNumber || undefined,
          receivedBy: r.operatorName || undefined,
          createdOn: r.createdAt || new Date().toISOString()
        };
      });
      res.json(mapped);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/grns", async (req, res) => {
    try {
      const grn = req.body;
      const { 
        id, grnNo, invoiceNo, grnDate, supplierName, materialId, materialName, qty, batchNo, qcStatus, qcReleaseDate, receivedBy, createdOn 
      } = grn;

      await db!.run(
        `INSERT OR REPLACE INTO grns (
          id, grnNumber, invoiceNumber, grnDate, supplierName, materialId, materialName, quantity, batchNumber, qcStatus, qcReleaseDate, operatorName, createdAt, rawData
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          grnNo || null, 
          invoiceNo || null, 
          grnDate || null, 
          supplierName || null, 
          materialId || null, 
          materialName || null, 
          qty || null, 
          batchNo || null, 
          qcStatus || null, 
          qcReleaseDate || null, 
          receivedBy || null, 
          createdOn || null, 
          JSON.stringify(grn)
        ]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/grns/:id/status", async (req, res) => {
    try {
       const { qcStatus, qcReleaseDate } = req.body;
      
       // Update columns
       await db!.run(
         `UPDATE grns SET qcStatus = ?, qcReleaseDate = ? WHERE id = ?`,
         [qcStatus, qcReleaseDate, req.params.id]
       );
      
       // Mirror qcStatus / release date changes in serialized rawData
       const row = await db!.get(`SELECT rawData FROM grns WHERE id = ?`, [req.params.id]);
       if (row && row.rawData) {
         try {
           const parsed = JSON.parse(row.rawData);
           parsed.qcStatus = qcStatus;
           parsed.qcReleaseDate = qcReleaseDate;
           await db!.run(
             `UPDATE grns SET rawData = ? WHERE id = ?`,
             [JSON.stringify(parsed), req.params.id]
           );
         } catch (e) {}
       }
       res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/grns/:id", async (req, res) => {
    try {
      await db!.run(`DELETE FROM grns WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Outward records
  app.get("/api/outwards", async (req, res) => {
    try {
      const rows = await db!.all("SELECT * FROM outwards");
      const mapped = rows.map(r => {
        if (r.rawData) {
          try {
            return JSON.parse(r.rawData);
          } catch (err) {}
        }
        return {
          id: r.id,
          outwardNo: r.outwardNumber || '',
          outwardDate: r.outwardDate || '',
          department: r.issueToDept || '',
          batchNo: r.batchNumber || '',
          materialId: r.materialId || '',
          materialName: r.materialName || '',
          qty: r.quantityIssued || 0,
          issuedBy: r.operatorName || '',
          createdOn: r.createdAt || new Date().toISOString()
        };
      });
      res.json(mapped);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/outwards", async (req, res) => {
    try {
      const outward = req.body;
      const { id, outwardNo, outwardDate, department, batchNo, materialId, materialName, qty, issuedBy, createdOn } = outward;

      await db!.run(
        `INSERT OR REPLACE INTO outwards (
          id, outwardNumber, outwardDate, issueToDept, batchNumber, materialId, materialName, quantityRequested, quantityIssued, operatorName, createdAt, rawData
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          outwardNo || null,
          outwardDate || null,
          department || null,
          batchNo || null,
          materialId || null,
          materialName || null,
          qty || null,
          qty || null,
          issuedBy || null,
          createdOn || null,
          JSON.stringify(outward)
        ]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/outwards/:id", async (req, res) => {
    try {
      await db!.run(`DELETE FROM outwards WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Company Profile
  app.get("/api/company-profile", async (req, res) => {
    try {
      const row = await db!.get("SELECT * FROM company_profile WHERE id = 'main'");
      if (!row) {
        return res.json({
          companyName: '',
          logoUrl: '',
          gstNumber: '',
          address: '',
          email: '',
          contactNumber: '',
          updatedAt: new Date().toISOString()
        });
      }
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/company-profile", async (req, res) => {
    try {
      const { companyName, logoUrl, gstNumber, address, email, contactNumber, updatedAt } = req.body;
      await db!.run(
        `INSERT OR REPLACE INTO company_profile (id, companyName, logoUrl, gstNumber, address, email, contactNumber, updatedAt) VALUES ('main', ?, ?, ?, ?, ?, ?, ?)`,
        [companyName, logoUrl, gstNumber, address, email, contactNumber, updatedAt]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // Serve client assets with Vite middlewares or production static path
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application serving SQLite records live on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Failed to start combined server: ", e);
});
