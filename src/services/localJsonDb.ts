import fs from "fs";
import path from "path";

export class LocalJsonDb {
  private filePath: string = path.resolve(process.cwd(), "./data_store.json");
  private data: {
    users: any[];
    materials: any[];
    suppliers: any[];
    grns: any[];
    outwards: any[];
    company_profile: any[];
  } = {
    users: [],
    materials: [],
    suppliers: [],
    grns: [],
    outwards: [],
    company_profile: []
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(content);
        this.data = {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          materials: Array.isArray(parsed.materials) ? parsed.materials : [],
          suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : [],
          grns: Array.isArray(parsed.grns) ? parsed.grns : [],
          outwards: Array.isArray(parsed.outwards) ? parsed.outwards : [],
          company_profile: Array.isArray(parsed.company_profile) ? parsed.company_profile : []
        };
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Error loading json database:", e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving json database:", e);
    }
  }

  async exec(sql: string): Promise<void> {
    this.load();
    const clean = sql.trim().toUpperCase();
    if (clean.includes("CREATE TABLE IF NOT EXISTS USERS")) {
      if (!this.data.users) this.data.users = [];
    }
    if (clean.includes("CREATE TABLE IF NOT EXISTS MATERIALS")) {
      if (!this.data.materials) this.data.materials = [];
    }
    if (clean.includes("CREATE TABLE IF NOT EXISTS SUPPLIERS")) {
      if (!this.data.suppliers) this.data.suppliers = [];
    }
    if (clean.includes("CREATE TABLE IF NOT EXISTS GRNS")) {
      if (!this.data.grns) this.data.grns = [];
    }
    if (clean.includes("CREATE TABLE IF NOT EXISTS OUTWARDS")) {
      if (!this.data.outwards) this.data.outwards = [];
    }
    if (clean.includes("CREATE TABLE IF NOT EXISTS COMPANY_PROFILE")) {
      if (!this.data.company_profile) this.data.company_profile = [];
    }
    this.save();
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    this.load();
    const clean = sql.trim().toUpperCase();
    
    if (clean.includes("SELECT COUNT(*)") && clean.includes("USERS")) {
      return { count: this.data.users.length };
    }
    if (clean.includes("SELECT COUNT(*)") && clean.includes("SUPPLIERS")) {
      return { count: this.data.suppliers.length };
    }
    if (clean.includes("SELECT COUNT(*)") && clean.includes("COMPANY_PROFILE")) {
      return { count: this.data.company_profile.length };
    }
    if (clean.includes("FROM COMPANY_PROFILE") && clean.includes("ID = 'MAIN'")) {
      return this.data.company_profile.find(p => p.id === 'main') || null;
    }
    if (clean.includes("FROM GRNS") && clean.includes("ID = ?")) {
      const id = params[0];
      const found = this.data.grns.find(g => g.id === id);
      return found ? { rawData: found.rawData } : null;
    }
    return null;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    this.load();
    const clean = sql.trim().toUpperCase();
    
    if (clean.includes("FROM USERS")) {
      return this.data.users;
    }
    if (clean.includes("FROM MATERIALS")) {
      // Map back database values logic to what sever expects if rawData isn't parsed
      return this.data.materials.map(m => ({
        ...m,
        // Ensure standard fields map correctly
        itemCode: m.materialCode || m.itemCode || '',
        active: m.active === 1 || m.active === true ? 1 : 0
      }));
    }
    if (clean.includes("FROM SUPPLIERS")) {
      return this.data.suppliers;
    }
    if (clean.includes("FROM GRNS")) {
      return this.data.grns.map(g => ({
        ...g,
        grnNumber: g.grnNo || g.grnNumber || '',
        invoiceNumber: g.invoiceNo || g.invoiceNumber || '',
        quantity: g.qty || g.quantity || 0,
        batchNumber: g.batchNo || g.batchNumber || '',
        operatorName: g.receivedBy || g.operatorName || '',
        createdAt: g.createdOn || g.createdAt || ''
      }));
    }
    if (clean.includes("FROM OUTWARDS")) {
      return this.data.outwards.map(o => ({
        ...o,
        outwardNumber: o.outwardNo || o.outwardNumber || '',
        issueToDept: o.department || o.issueToDept || '',
        batchNumber: o.batchNo || o.batchNumber || '',
        quantityIssued: o.qty || o.quantityIssued || 0,
        operatorName: o.issuedBy || o.operatorName || '',
        createdAt: o.createdOn || o.createdAt || ''
      }));
    }
    if (clean.includes("FROM COMPANY_PROFILE")) {
      return this.data.company_profile;
    }
    return [];
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    this.load();
    const clean = sql.trim().toUpperCase();

    if (clean.includes("INSERT OR IGNORE INTO USERS") || clean.includes("INSERT OR REPLACE INTO USERS")) {
      const [id, username, password, name, role, createdAt] = params;
      const index = this.data.users.findIndex(u => u.id === id || u.username === username);
      const row = { id, username, password, name, role, createdAt };
      if (index >= 0) {
        if (clean.includes("REPLACE")) {
          this.data.users[index] = row;
        }
      } else {
        this.data.users.push(row);
      }
    }
    else if (clean.includes("INSERT OR IGNORE INTO SUPPLIERS") || clean.includes("INSERT OR REPLACE INTO SUPPLIERS")) {
      const [id, name, gstNumber, address, email, contactNumber, createdAt] = params;
      const index = this.data.suppliers.findIndex(s => s.id === id);
      const row = { id, name, gstNumber, address, email, contactNumber, createdAt };
      if (index >= 0) {
        if (clean.includes("REPLACE")) {
          this.data.suppliers[index] = row;
        }
      } else {
        this.data.suppliers.push(row);
      }
    }
    else if (clean.includes("COMPANY_PROFILE") && (clean.includes("INSERT OR IGNORE") || clean.includes("INSERT OR REPLACE"))) {
      let id = "main";
      let companyName: any, logoUrl: any, gstNumber: any, address: any, email: any, contactNumber: any, updatedAt: any;
      if (params.length === 8) {
        [id, companyName, logoUrl, gstNumber, address, email, contactNumber, updatedAt] = params;
      } else if (params.length === 7) {
        [companyName, logoUrl, gstNumber, address, email, contactNumber, updatedAt] = params;
      } else {
        [id, companyName, logoUrl, gstNumber, address, email, contactNumber, updatedAt] = params;
      }
      const row = { id: id || "main", companyName, logoUrl, gstNumber, address, email, contactNumber, updatedAt };
      const index = this.data.company_profile.findIndex(c => c.id === row.id);
      if (index >= 0) {
        this.data.company_profile[index] = row;
      } else {
        this.data.company_profile.push(row);
      }
    }
    else if (clean.includes("INSERT OR REPLACE INTO MATERIALS")) {
      const [id, itemCode, materialName, active, createdAt, rawData] = params;
      const row = { id, itemCode, materialName, active, createdAt, rawData };
      const index = this.data.materials.findIndex(m => m.id === id);
      if (index >= 0) {
        this.data.materials[index] = row;
      } else {
        this.data.materials.push(row);
      }
    }
    else if (clean.includes("DELETE FROM MATERIALS")) {
      const id = params[0];
      this.data.materials = this.data.materials.filter(m => m.id !== id);
    }
    else if (clean.includes("INSERT OR REPLACE INTO GRNS")) {
      const [id, grnNumber, invoiceNumber, grnDate, supplierName, materialId, materialName, quantity, batchNumber, qcStatus, qcReleaseDate, operatorName, createdAt, rawData] = params;
      const row = { id, grnNumber, invoiceNumber, grnDate, supplierName, materialId, materialName, quantity, batchNumber, qcStatus, qcReleaseDate, operatorName, createdAt, rawData };
      const index = this.data.grns.findIndex(g => g.id === id);
      if (index >= 0) {
        this.data.grns[index] = row;
      } else {
        this.data.grns.push(row);
      }
    }
    else if (clean.includes("UPDATE GRNS SET QCSTATUS = ?, QCRELEASEDATE = ? WHERE ID = ?")) {
      const [qcStatus, qcReleaseDate, id] = params;
      const index = this.data.grns.findIndex(g => g.id === id);
      if (index >= 0) {
        this.data.grns[index].qcStatus = qcStatus;
        this.data.grns[index].qcReleaseDate = qcReleaseDate;
      }
    }
    else if (clean.includes("UPDATE GRNS SET RAWDATA = ? WHERE ID = ?")) {
      const [rawData, id] = params;
      const index = this.data.grns.findIndex(g => g.id === id);
      if (index >= 0) {
        this.data.grns[index].rawData = rawData;
      }
    }
    else if (clean.includes("DELETE FROM GRNS")) {
      const id = params[0];
      this.data.grns = this.data.grns.filter(g => g.id !== id);
    }
    else if (clean.includes("INSERT OR REPLACE INTO OUTWARDS")) {
      const [id, outwardNumber, outwardDate, issueToDept, batchNumber, materialId, materialName, quantityRequested, quantityIssued, operatorName, createdAt, rawData] = params;
      const row = { id, outwardNumber, outwardDate, issueToDept, batchNumber, materialId, materialName, quantityRequested, quantityIssued, operatorName, createdAt, rawData };
      const index = this.data.outwards.findIndex(o => o.id === id);
      if (index >= 0) {
        this.data.outwards[index] = row;
      } else {
        this.data.outwards.push(row);
      }
    }
    else if (clean.includes("DELETE FROM OUTWARDS")) {
      const id = params[0];
      this.data.outwards = this.data.outwards.filter(o => o.id !== id);
    }

    this.save();
    return { changes: 1 };
  }
}
