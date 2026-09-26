const pool = require("../config/db");

// Get all stock movements
const getMovements = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sm.id,
        sm.product_id,
        p.name AS product_name,
        p.sku,
        sm.location_id,
        l.name AS location_name,
        sm.movement_type,
        sm.quantity,
        sm.reference_id,
        sm.reference_type,
        sm.created_by,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN locations l ON sm.location_id = l.id
      ORDER BY sm.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching movements:", error);
    res.status(500).json({
      message: "Failed to fetch stock movements"
    });
  }
};

// Get movement by ID
const getMovementById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        sm.id,
        sm.product_id,
        p.name AS product_name,
        p.sku,
        sm.location_id,
        l.name AS location_name,
        sm.movement_type,
        sm.quantity,
        sm.reference_id,
        sm.reference_type,
        sm.created_by,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN locations l ON sm.location_id = l.id
      WHERE sm.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Movement not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error fetching movement:", error);
    res.status(500).json({
      message: "Failed to fetch movement"
    });
  }
};

module.exports = {
  getMovements,
  getMovementById
};