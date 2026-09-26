const pool = require("../config/db");

// Get all stock
const getStock = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.product_id,
        p.name AS product_name,
        p.sku,
        s.location_id,
        l.name AS location_name,
        l.warehouse_id,
        w.name AS warehouse_name,
        s.quantity
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN locations l ON s.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
      ORDER BY s.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ message: "Failed to fetch stock" });
  }
};

// Get stock by ID
const getStockById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        s.id,
        s.product_id,
        p.name AS product_name,
        p.sku,
        s.location_id,
        l.name AS location_name,
        l.warehouse_id,
        w.name AS warehouse_name,
        s.quantity
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN locations l ON s.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Stock record not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({
      message: "Failed to fetch stock"
    });
  }
};

// Create or update stock
const createStock = async (req, res) => {
  try {
    const { product_id, location_id, quantity } = req.body;

    if (
      !product_id ||
      !location_id ||
      quantity === undefined ||
      quantity === null
    ) {
      return res.status(400).json({
        message: "Product ID, location ID and quantity are required"
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        message: "Quantity cannot be negative"
      });
    }

    const result = await pool.query(`
      INSERT INTO stock (product_id, location_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET quantity = EXCLUDED.quantity
      RETURNING *
    `, [product_id, location_id, quantity]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating stock:", error);
    res.status(500).json({
      message: "Failed to create stock"
    });
  }
};

module.exports = {
  getStock,
  getStockById,
  createStock
};