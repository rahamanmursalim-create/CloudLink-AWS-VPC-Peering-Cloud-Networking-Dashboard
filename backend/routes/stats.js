const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/stats — aggregate project progress stats
router.get('/', (req, res) => {
  try {
    // Resource counts by status
    const resourceStats = db.prepare(`
      SELECT status, COUNT(*) as count FROM resources GROUP BY status
    `).all();

    const totalResources = db.prepare('SELECT COUNT(*) as cnt FROM resources').get().cnt;
    const createdResources = db.prepare("SELECT COUNT(*) as cnt FROM resources WHERE status IN ('created','active')").get().cnt;

    // Resource counts by VPC
    const byVpc = db.prepare(`
      SELECT vpc, COUNT(*) as count FROM resources GROUP BY vpc
    `).all();

    // Resource counts by type
    const byType = db.prepare(`
      SELECT type, COUNT(*) as count FROM resources GROUP BY type ORDER BY count DESC
    `).all();

    // Connectivity test stats
    const totalTests = db.prepare('SELECT COUNT(*) as cnt FROM connectivity_tests').get().cnt;
    const successTests = db.prepare("SELECT COUNT(*) as cnt FROM connectivity_tests WHERE status='success'").get().cnt;
    const failedTests  = db.prepare("SELECT COUNT(*) as cnt FROM connectivity_tests WHERE status='failed'").get().cnt;

    const avgLatency = db.prepare(`
      SELECT AVG(latency_ms) as avg FROM connectivity_tests WHERE latency_ms IS NOT NULL AND status='success'
    `).get().avg;

    // Last 5 connectivity tests
    const recentTests = db.prepare(`
      SELECT * FROM connectivity_tests ORDER BY tested_at DESC LIMIT 5
    `).all();

    // Completion percentage
    const completionPct = totalResources > 0
      ? Math.round((createdResources / totalResources) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        resources: {
          total:     totalResources,
          created:   createdResources,
          completion: completionPct,
          byStatus:  resourceStats,
          byVpc,
          byType,
        },
        connectivity: {
          total:      totalTests,
          success:    successTests,
          failed:     failedTests,
          avgLatency: avgLatency ? Math.round(avgLatency * 10) / 10 : null,
          successRate: totalTests > 0 ? Math.round((successTests / totalTests) * 100) : 0,
          recent:     recentTests,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
