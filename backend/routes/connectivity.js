const express = require('express');
const router = express.Router();
const db = require('../db/database');

// ─── GET all connectivity tests ────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM connectivity_tests';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY tested_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET single test ───────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM connectivity_tests WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Test not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST log a connectivity test ──────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const {
      source,
      destination,
      protocol = 'ICMP (ping)',
      status = 'pending',
      latency_ms,
      packet_loss,
      notes,
    } = req.body;

    if (!source || !destination) {
      return res.status(400).json({ success: false, error: 'source and destination are required' });
    }

    const VALID_STATUSES = ['pending', 'success', 'failed', 'timeout'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const stmt = db.prepare(`
      INSERT INTO connectivity_tests (source, destination, protocol, status, latency_ms, packet_loss, notes)
      VALUES (@source, @destination, @protocol, @status, @latency_ms, @packet_loss, @notes)
    `);

    const result = stmt.run({
      source,
      destination,
      protocol,
      status,
      latency_ms:   latency_ms   !== undefined ? Number(latency_ms)   : null,
      packet_loss:  packet_loss  !== undefined ? Number(packet_loss)  : null,
      notes:        notes || null,
    });

    const created = db.prepare('SELECT * FROM connectivity_tests WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT update a test ─────────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM connectivity_tests WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Test not found' });

    const { source, destination, protocol, status, latency_ms, packet_loss, notes } = req.body;

    const updated = {
      source:       source       ?? existing.source,
      destination:  destination  ?? existing.destination,
      protocol:     protocol     ?? existing.protocol,
      status:       status       ?? existing.status,
      latency_ms:   latency_ms   !== undefined ? Number(latency_ms)  : existing.latency_ms,
      packet_loss:  packet_loss  !== undefined ? Number(packet_loss) : existing.packet_loss,
      notes:        notes        !== undefined ? notes               : existing.notes,
      id:           req.params.id,
    };

    db.prepare(`
      UPDATE connectivity_tests
      SET source=@source, destination=@destination, protocol=@protocol,
          status=@status, latency_ms=@latency_ms, packet_loss=@packet_loss, notes=@notes
      WHERE id=@id
    `).run(updated);

    const row = db.prepare('SELECT * FROM connectivity_tests WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE a test ─────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM connectivity_tests WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Test not found' });

    db.prepare('DELETE FROM connectivity_tests WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Test log deleted', data: existing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
