const pool = require("../config/db");

// Get all stock adjustments
const getAdjustments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sa.id,
        sa.location_id,
        l.name AS location_name,
        sa.product_id,
        p.name AS product_name,
        p.sku,
        sa.system_quantity,
        sa.physical_quantity,
        sa.difference,
        sa.reason,
        sa.created_by,
        sa.created_at
      FROM stock_adjustments sa
      JOIN locations l ON sa.location_id = l.id
      JOIN products p ON sa.product_id = p.id
      ORDER BY sa.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching adjustments:", error);
    res.status(500).json({
      message: "Failed to fetch adjustments"
    });
  }
};

// Get adjustment by ID
const getAdjustmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        sa.id,
        sa.location_id,
        l.name AS location_name,
        sa.product_id,
        p.name AS product_name,
        p.sku,
        sa.system_quantity,
        sa.physical_quantity,
        sa.difference,
        sa.reason,
        sa.created_by,
        sa.created_at
      FROM stock_adjustments sa
      JOIN locations l ON sa.location_id = l.id
      JOIN products p ON sa.product_id = p.id
      WHERE sa.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Adjustment not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching adjustment:", error);
    res.status(500).json({
      message: "Failed to fetch adjustment"
    });
  }
};

// Create inventory adjustment
const createAdjustment = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      location_id,
      product_id,
      physical_quantity,
      reason,
      created_by
    } = req.body;

    if (!location_id || !product_id || physical_quantity === undefined) {
      return res.status(400).json({
        message:
          "Location ID, product ID and physical quantity are required"
      });
    }

    if (physical_quantity < 0) {
      return res.status(400).json({
        message: "Physical quantity cannot be negative"
      });
    }

    await client.query("BEGIN");

    // Get current stock
    const stockResult = await client.query(
      `SELECT id, quantity
       FROM stock
       WHERE product_id = $1
       AND location_id = $2
       FOR UPDATE`,
      [product_id, location_id]
    );

    if (stockResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Stock record not found for this product and location"
      });
    }

    const systemQuantity = stockResult.rows[0].quantity;

    const difference = physical_quantity - systemQuantity;

    // Update stock to physical quantity
    await client.query(
      `UPDATE stock
       SET quantity = $1
       WHERE product_id = $2
       AND location_id = $3`,
      [
        physical_quantity,
        product_id,
        location_id
      ]
    );

    // Record adjustment
    const adjustmentResult = await client.query(
      `INSERT INTO stock_adjustments
       (
         location_id,
         product_id,
         system_quantity,
         physical_quantity,
         difference,
         reason,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        location_id,
        product_id,
        systemQuantity,
        physical_quantity,
        difference,
        reason || null,
        created_by || null
      ]
    );

    // Record stock movement
    if (difference !== 0) {
      await client.query(
        `INSERT INTO stock_movements
         (
           product_id,
           location_id,
           movement_type,
           quantity,
           reference_id,
           reference_type,
           created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          product_id,
          location_id,
          "adjustment",
          difference,
          adjustmentResult.rows[0].id,
          "adjustment",
          created_by || null
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Stock adjustment created successfully",
      adjustment: adjustmentResult.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating adjustment:", error);

    res.status(500).json({
      message: "Failed to create adjustment"
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getAdjustments,
  getAdjustmentById,
  createAdjustment
};