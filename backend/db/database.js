const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const DB_FILE = path.join(dbDir, 'vpc_dashboard.json');

// Initial state
const defaultData = {
  resources: [],
  connectivity_tests: [],
  counters: {
    resources: 0,
    connectivity_tests: 0
  }
};

let store = defaultData;

// Load store from disk if exists
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    store = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Could not read existing database file, initializing default store', e);
  store = defaultData;
}

function saveStore() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// Seed default resources if empty
function seedResources() {
  if (store.resources && store.resources.length > 0) return;

  const seedData = [
    { name: 'VPC-1',             type: 'VPC',             vpc: 'VPC-1', region: 'ap-south-1', cidr: '10.28.0.0/16',    status: 'pending', notes: 'Primary VPC with public and private subnets' },
    { name: 'Public-Subnet-1',   type: 'Subnet',          vpc: 'VPC-1', region: 'ap-south-1', cidr: '10.28.1.0/24',    status: 'pending', notes: 'Public subnet — EC2 with public IP + IGW route' },
    { name: 'Private-Subnet-1',  type: 'Subnet',          vpc: 'VPC-1', region: 'ap-south-1', cidr: '10.28.2.0/24',    status: 'pending', notes: 'Private subnet — no direct internet access' },
    { name: 'IGW-1',             type: 'Internet Gateway',vpc: 'VPC-1', region: 'ap-south-1', cidr: null,             status: 'pending', notes: 'Internet Gateway attached to VPC-1' },
    { name: 'RT-Public-1',       type: 'Route Table',     vpc: 'VPC-1', region: 'ap-south-1', cidr: null,              status: 'pending', notes: 'Routes: 0.0.0.0/0 → IGW, 10.28.200.0/16 → Peering' },
    { name: 'RT-Private-1',      type: 'Route Table',     vpc: 'VPC-1', region: 'ap-south-1', cidr: null,              status: 'pending', notes: 'Routes: 10.28.200.0/16 → Peering connection' },
    { name: 'EC2-Public-1',      type: 'EC2 Instance',    vpc: 'VPC-1', region: 'ap-south-1', cidr: '10.28.1.10',      status: 'pending', notes: 'Bastion / jump host in public subnet' },
    { name: 'EC2-Private-1',     type: 'EC2 Instance',    vpc: 'VPC-1', region: 'ap-south-1', cidr: '10.28.2.10',      status: 'pending', notes: 'Private EC2 — access only via EC2-Public-1' },
    { name: 'VPC-2',             type: 'VPC',             vpc: 'VPC-2', region: 'ap-south-1', cidr: '10.28.200.0/16',  status: 'pending', notes: 'Second VPC — peered with VPC-1' },
    { name: 'Private-Subnet-2',  type: 'Subnet',          vpc: 'VPC-2', region: 'ap-south-1', cidr: '10.28.200.0/24',  status: 'pending', notes: 'Private subnet in VPC-2' },
    { name: 'RT-Private-2',      type: 'Route Table',     vpc: 'VPC-2', region: 'ap-south-1', cidr: null,              status: 'pending', notes: 'Routes: 10.28.0.0/16 → Peering connection' },
    { name: 'EC2-Private-2',     type: 'EC2 Instance',    vpc: 'VPC-2', region: 'ap-south-1', cidr: '10.28.200.10',    status: 'pending', notes: 'Target EC2 in VPC-2 private subnet' },
    { name: 'VPC-Peering-1-2',   type: 'VPC Peering',     vpc: 'Both',  region: 'ap-south-1', cidr: null,              status: 'pending', notes: 'Peering connection between VPC-1 and VPC-2' },
  ];

  store.resources = [];
  store.counters.resources = 0;
  seedData.forEach(item => {
    store.counters.resources += 1;
    store.resources.push({
      id: store.counters.resources,
      aws_id: null,
      created_at: new Date().toISOString(),
      ...item
    });
  });
  saveStore();
}

seedResources();

// Pure JS SQLite-compatible Prepare Engine
const db = {
  pragma: () => {},
  exec: () => {},
  transaction: (fn) => (args) => fn(args),
  prepare: (sql) => {
    const trimmed = sql.trim().replace(/\s+/g, ' ');

    return {
      all: (...params) => {
        // SELECT * FROM resources [WHERE ...] [ORDER BY ...]
        if (trimmed.includes('FROM resources')) {
          if (trimmed.includes('GROUP BY status')) {
            const counts = {};
            store.resources.forEach(r => {
              counts[r.status] = (counts[r.status] || 0) + 1;
            });
            return Object.entries(counts).map(([status, count]) => ({ status, count }));
          }
          if (trimmed.includes('GROUP BY vpc')) {
            const counts = {};
            store.resources.forEach(r => {
              counts[r.vpc] = (counts[r.vpc] || 0) + 1;
            });
            return Object.entries(counts).map(([vpc, count]) => ({ vpc, count }));
          }
          if (trimmed.includes('GROUP BY type')) {
            const counts = {};
            store.resources.forEach(r => {
              counts[r.type] = (counts[r.type] || 0) + 1;
            });
            return Object.entries(counts)
              .map(([type, count]) => ({ type, count }))
              .sort((a, b) => b.count - a.count);
          }

          let items = [...store.resources];
          // Conditions
          if (trimmed.includes('WHERE')) {
            let pIdx = 0;
            if (trimmed.includes('vpc = ?')) {
              const v = params[pIdx++];
              items = items.filter(r => r.vpc === v);
            }
            if (trimmed.includes('type = ?')) {
              const t = params[pIdx++];
              items = items.filter(r => r.type === t);
            }
            if (trimmed.includes('status = ?')) {
              const s = params[pIdx++];
              items = items.filter(r => r.status === s);
            }
          }
          return items.sort((a, b) => a.id - b.id);
        }

        // SELECT * FROM connectivity_tests
        if (trimmed.includes('FROM connectivity_tests')) {
          let items = [...store.connectivity_tests];
          if (trimmed.includes('WHERE status = ?')) {
            const st = params[0];
            items = items.filter(t => t.status === st);
          }
          items.sort((a, b) => new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime());
          if (trimmed.includes('LIMIT 5')) {
            items = items.slice(0, 5);
          }
          return items;
        }

        return [];
      },

      get: (...params) => {
        // SELECT COUNT(*) as cnt FROM resources ...
        if (trimmed.includes('SELECT COUNT(*) as cnt FROM resources')) {
          if (trimmed.includes("status IN ('created','active')")) {
            const cnt = store.resources.filter(r => r.status === 'created' || r.status === 'active').length;
            return { cnt };
          }
          return { cnt: store.resources.length };
        }

        // SELECT COUNT(*) as cnt FROM connectivity_tests ...
        if (trimmed.includes('SELECT COUNT(*) as cnt FROM connectivity_tests')) {
          if (trimmed.includes("status='success'")) {
            return { cnt: store.connectivity_tests.filter(t => t.status === 'success').length };
          }
          if (trimmed.includes("status='failed'")) {
            return { cnt: store.connectivity_tests.filter(t => t.status === 'failed' || t.status === 'timeout').length };
          }
          return { cnt: store.connectivity_tests.length };
        }

        // AVG latency
        if (trimmed.includes('SELECT AVG(latency_ms) as avg FROM connectivity_tests')) {
          const valid = store.connectivity_tests.filter(t => t.latency_ms !== null && t.latency_ms !== undefined && t.status === 'success');
          if (valid.length === 0) return { avg: null };
          const sum = valid.reduce((acc, curr) => acc + Number(curr.latency_ms), 0);
          return { avg: sum / valid.length };
        }

        // Single resource by ID
        if (trimmed.includes('FROM resources WHERE id = ?')) {
          const id = Number(params[0]);
          return store.resources.find(r => r.id === id) || null;
        }

        // Single connectivity test by ID
        if (trimmed.includes('FROM connectivity_tests WHERE id = ?')) {
          const id = Number(params[0]);
          return store.connectivity_tests.find(t => t.id === id) || null;
        }

        return null;
      },

      run: (params = {}) => {
        // INSERT INTO resources
        if (trimmed.startsWith('INSERT INTO resources')) {
          store.counters.resources = (store.counters.resources || 0) + 1;
          const newId = store.counters.resources;
          const newResource = {
            id: newId,
            name: params.name,
            type: params.type,
            vpc: params.vpc || 'VPC-1',
            region: params.region || 'ap-south-1',
            cidr: params.cidr || null,
            status: params.status || 'pending',
            aws_id: params.aws_id || null,
            notes: params.notes || null,
            created_at: new Date().toISOString()
          };
          store.resources.push(newResource);
          saveStore();
          return { lastInsertRowid: newId };
        }

        // UPDATE resources
        if (trimmed.startsWith('UPDATE resources')) {
          const targetId = Number(params.id);
          const index = store.resources.findIndex(r => r.id === targetId);
          if (index !== -1) {
            store.resources[index] = {
              ...store.resources[index],
              name: params.name,
              type: params.type,
              vpc: params.vpc,
              region: params.region,
              cidr: params.cidr,
              status: params.status,
              aws_id: params.aws_id,
              notes: params.notes
            };
            saveStore();
          }
          return { changes: 1 };
        }

        // DELETE FROM resources WHERE id = ?
        if (trimmed.startsWith('DELETE FROM resources')) {
          const targetId = Number(params);
          store.resources = store.resources.filter(r => r.id !== targetId);
          saveStore();
          return { changes: 1 };
        }

        // INSERT INTO connectivity_tests
        if (trimmed.startsWith('INSERT INTO connectivity_tests')) {
          store.counters.connectivity_tests = (store.counters.connectivity_tests || 0) + 1;
          const newId = store.counters.connectivity_tests;
          const newTest = {
            id: newId,
            source: params.source,
            destination: params.destination,
            protocol: params.protocol || 'ICMP (ping)',
            status: params.status || 'pending',
            latency_ms: params.latency_ms !== undefined ? params.latency_ms : null,
            packet_loss: params.packet_loss !== undefined ? params.packet_loss : null,
            notes: params.notes || null,
            tested_at: new Date().toISOString()
          };
          store.connectivity_tests.push(newTest);
          saveStore();
          return { lastInsertRowid: newId };
        }

        // UPDATE connectivity_tests
        if (trimmed.startsWith('UPDATE connectivity_tests')) {
          const targetId = Number(params.id);
          const index = store.connectivity_tests.findIndex(t => t.id === targetId);
          if (index !== -1) {
            store.connectivity_tests[index] = {
              ...store.connectivity_tests[index],
              source: params.source,
              destination: params.destination,
              protocol: params.protocol,
              status: params.status,
              latency_ms: params.latency_ms,
              packet_loss: params.packet_loss,
              notes: params.notes
            };
            saveStore();
          }
          return { changes: 1 };
        }

        // DELETE FROM connectivity_tests
        if (trimmed.startsWith('DELETE FROM connectivity_tests')) {
          const targetId = Number(params);
          store.connectivity_tests = store.connectivity_tests.filter(t => t.id !== targetId);
          saveStore();
          return { changes: 1 };
        }

        return { changes: 0 };
      }
    };
  }
};

module.exports = db;
