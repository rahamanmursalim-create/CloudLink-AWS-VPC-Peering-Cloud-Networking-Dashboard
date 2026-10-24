const express = require('express');
const router = express.Router();
const db = require('../db/database');

// ─── GET all resources ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { vpc, type, status } = req.query;
    let query = 'SELECT * FROM resources';
    const conditions = [];
    const params = [];

    if (vpc)    { conditions.push('vpc = ?');    params.push(vpc); }
    if (type)   { conditions.push('type = ?');   params.push(type); }
    if (status) { conditions.push('status = ?'); params.push(status); }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY id ASC';

    const rows = db.prepare(query).all(...params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET single resource ───────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST create resource ──────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, type, vpc = 'VPC-1', region = 'ap-south-1', cidr, status = 'pending', aws_id, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'name and type are required' });
    }

    const VALID_STATUSES = ['pending', 'created', 'active', 'failed', 'deleted'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const stmt = db.prepare(`
      INSERT INTO resources (name, type, vpc, region, cidr, status, aws_id, notes)
      VALUES (@name, @type, @vpc, @region, @cidr, @status, @aws_id, @notes)
    `);
    const result = stmt.run({ name, type, vpc, region, cidr: cidr || null, status, aws_id: aws_id || null, notes: notes || null });
    const created = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT update resource ───────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Resource not found' });

    const { name, type, vpc, region, cidr, status, aws_id, notes } = req.body;

    const updated = {
      name:    name    ?? existing.name,
      type:    type    ?? existing.type,
      vpc:     vpc     ?? existing.vpc,
      region:  region  ?? existing.region,
      cidr:    cidr    !== undefined ? cidr : existing.cidr,
      status:  status  ?? existing.status,
      aws_id:  aws_id  !== undefined ? aws_id : existing.aws_id,
      notes:   notes   !== undefined ? notes : existing.notes,
      id:      req.params.id,
    };

    db.prepare(`
      UPDATE resources
      SET name=@name, type=@type, vpc=@vpc, region=@region, cidr=@cidr,
          status=@status, aws_id=@aws_id, notes=@notes
      WHERE id=@id
    `).run(updated);

    const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE resource ───────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Resource not found' });

    db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Resource deleted', data: existing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
