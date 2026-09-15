const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Local JSON Storage for offline resilience (with Vercel serverless /tmp support)
const LOCAL_SEED_FILE = path.join(__dirname, 'data.json');
const DB_FILE = process.env.VERCEL ? path.join('/tmp', 'data.json') : LOCAL_SEED_FILE;

function loadDb() {
  try {
    if (process.env.VERCEL && !fs.existsSync(DB_FILE) && fs.existsSync(LOCAL_SEED_FILE)) {
      try { fs.copyFileSync(LOCAL_SEED_FILE, DB_FILE); } catch (_) {}
    }
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read local db file, initializing new state:', e);
  }
  return {
    users: [],
    projects: [],
    frames: [],
    published_animations: []
  };
}

let dbState = loadDb();
let saveTimeout = null;

function saveDb() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing local db:', e);
    }
  }, 100);
}

class LocalQueryBuilder {
  constructor(table) {
    this.table = table;
    this.operation = 'select'; // 'select', 'insert', 'update', 'delete'
    this.selectFields = '*';
    this.insertData = null;
    this.updateData = null;
    this.filters = [];
    this.orFilters = [];
    this.orderBy = null;
    this.rangeLimit = null;
    this.isSingle = false;
  }

  select(fields = '*') {
    if (this.operation !== 'insert') {
      this.operation = 'select';
    }
    this.selectFields = fields;
    return this;
  }

  insert(data) {
    this.operation = 'insert';
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(col, val) {
    this.filters.push({ col, val });
    return this;
  }

  in(col, vals) {
    this.filters.push({ col, in: new Set(vals) });
    return this;
  }

  or(conditionStr) {
    // Condition string like "username.eq.hendra,email.eq.hendra" or "title.ilike.%test%,author_name.ilike.%test%"
    const parts = conditionStr.split(',');
    const orGroup = [];
    for (const p of parts) {
      const tokens = p.split('.');
      if (tokens.length >= 3) {
        const col = tokens[0];
        const op = tokens[1];
        const val = tokens.slice(2).join('.');
        orGroup.push({ col, op, val });
      }
    }
    if (orGroup.length > 0) {
      this.orFilters.push(orGroup);
    }
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orderBy = { col, ascending };
    return this;
  }

  range(from, to) {
    this.rangeLimit = { from, to };
    return this;
  }

  limit(count) {
    this.rangeLimit = { from: 0, to: count - 1 };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async execute() {
    if (!dbState[this.table]) {
      dbState[this.table] = [];
    }
    const tableData = dbState[this.table];

    if (this.operation === 'insert') {
      const inserted = [];
      for (const item of this.insertData) {
        const newRow = {
          id: item.id || (this.table === 'frames' ? (tableData.length ? Math.max(...tableData.map(f => f.id || 0)) + 1 : 1) : crypto.randomUUID()),
          ...item,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        };
        tableData.push(newRow);
        inserted.push(newRow);
      }
      saveDb();
      const result = this.isSingle ? (inserted[0] || null) : inserted;
      return { data: result, error: null };
    }

    // Filter matching rows
    let rows = tableData.filter(row => {
      // AND filters
      for (const f of this.filters) {
        if (f.in) {
          if (!f.in.has(row[f.col])) return false;
        } else if (String(row[f.col]) !== String(f.val)) {
          return false;
        }
      }
      // OR filters
      for (const group of this.orFilters) {
        const matched = group.some(({ col, op, val }) => {
          const rowVal = String(row[col] || '');
          if (op === 'eq') {
            return rowVal.toLowerCase() === val.toLowerCase();
          } else if (op === 'ilike') {
            const clean = val.replace(/%/g, '').toLowerCase();
            return rowVal.toLowerCase().includes(clean);
          }
          return false;
        });
        if (!matched) return false;
      }
      return true;
    });

    if (this.operation === 'update') {
      const updated = [];
      for (const row of rows) {
        Object.assign(row, this.updateData, { updated_at: new Date().toISOString() });
        updated.push(row);
      }
      saveDb();
      return { data: this.isSingle ? (updated[0] || null) : updated, error: null };
    }

    if (this.operation === 'delete') {
      const deletedIds = new Set(rows.map(r => r.id));
      dbState[this.table] = tableData.filter(r => !deletedIds.has(r.id));
      saveDb();
      return { data: rows, error: null };
    }

    // SELECT
    if (this.orderBy) {
      const { col, ascending } = this.orderBy;
      rows.sort((a, b) => {
        if (a[col] < b[col]) return ascending ? -1 : 1;
        if (a[col] > b[col]) return ascending ? 1 : -1;
        return 0;
      });
    }

    if (this.rangeLimit) {
      rows = rows.slice(this.rangeLimit.from, this.rangeLimit.to + 1);
    }

    // Handle field projection
    if (this.selectFields !== '*') {
      const fields = this.selectFields.split(',').map(s => s.trim());
      rows = rows.map(r => {
        const projected = {};
        for (const f of fields) {
          projected[f] = r[f];
        }
        return projected;
      });
    }

    const data = this.isSingle ? (rows[0] || null) : rows;
    return { data, error: null };
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }
}

const localClient = {
  from: (table) => new LocalQueryBuilder(table)
};

let activeClient = localClient;

// Attempt to use Supabase if online, otherwise fallback cleanly to localClient
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    // Test connectivity
    supabase.from('users').select('id').limit(1).then(({ error }) => {
      if (error) {
        console.warn('⚠️ Supabase remote endpoint unreachable. Operating in resilient Local Mode.');
        activeClient = localClient;
      } else {
        console.log('✅ Connected to Supabase remote database.');
        activeClient = supabase;
      }
    }).catch(() => {
      console.warn('⚠️ Supabase remote endpoint unreachable. Operating in resilient Local Mode.');
      activeClient = localClient;
    });
  } catch (e) {
    console.warn('⚠️ Initializing local database adapter:', e.message);
    activeClient = localClient;
  }
}

// Proxy client that routes calls to activeClient
const clientProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'from') {
      return (table) => activeClient.from(table);
    }
    return activeClient[prop];
  }
});

module.exports = clientProxy;
