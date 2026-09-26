const pool = require("../config/db");

// Get all receipts
const getReceipts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.location_id,
        l.name AS location_name,
        r.status,
        r.created_by,
        r.created_at
      FROM receipts r
      JOIN locations l ON r.location_id = l.id
      ORDER BY r.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    res.status(500).json({
      message: "Failed to fetch receipts"
    });
  }
};

// Get receipt by ID with items
const getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;

    const receiptResult = await pool.query(`
      SELECT
        r.id,
        r.location_id,
        l.name AS location_name,
        r.status,
        r.created_by,
        r.created_at
      FROM receipts r
      JOIN locations l ON r.location_id = l.id
      WHERE r.id = $1
    `, [id]);

    if (receiptResult.rows.length === 0) {
      return res.status(404).json({
        message: "Receipt not found"
      });
    }

    const itemsResult = await pool.query(`
      SELECT
        ri.id,
        ri.product_id,
        p.name AS product_name,
        p.sku,
        ri.quantity
      FROM receipt_items ri
      JOIN products p ON ri.product_id = p.id
      WHERE ri.receipt_id = $1
      ORDER BY ri.id
    `, [id]);

    res.json({
      ...receiptResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({
      message: "Failed to fetch receipt"
    });
  }
};

// Create a receipt with items
const createReceipt = async (req, res) => {
  const client = await pool.connect();

  try {
    const { location_id, created_by, items } = req.body;

    if (!location_id) {
      return res.status(400).json({
        message: "Location ID is required"
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one receipt item is required"
      });
    }

    await client.query("BEGIN");

    const receiptResult = await client.query(`
      INSERT INTO receipts (location_id, created_by)
      VALUES ($1, $2)
      RETURNING *
    `, [location_id, created_by || null]);

    const receipt = receiptResult.rows[0];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error("Invalid receipt item");
      }

      await client.query(`
        INSERT INTO receipt_items
        (receipt_id, product_id, quantity)
        VALUES ($1, $2, $3)
      `, [
        receipt.id,
        item.product_id,
        item.quantity
      ]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Receipt created successfully",
      receipt_id: receipt.id,
      status: receipt.status
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating receipt:", error);

    res.status(500).json({
      message: "Failed to create receipt"
    });
  } finally {
    client.release();
  }
};
// Validate receipt
const validateReceipt = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Get receipt
    const receiptResult = await client.query(
      `SELECT * FROM receipts WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (receiptResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Receipt not found"
      });
    }

    const receipt = receiptResult.rows[0];

    // Prevent validating twice
    if (receipt.status === "validated") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Receipt is already validated"
      });
    }

    // Get receipt items
    const itemsResult = await client.query(
      `SELECT * FROM receipt_items WHERE receipt_id = $1`,
      [id]
    );

    if (itemsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Receipt has no items"
      });
    }

    // Process every item
    for (const item of itemsResult.rows) {

      // Check whether stock record exists
      const stockResult = await client.query(
        `SELECT id, quantity
         FROM stock
         WHERE product_id = $1
         AND location_id = $2
         FOR UPDATE`,
        [item.product_id, receipt.location_id]
      );

      if (stockResult.rows.length === 0) {

        // Create stock record
        await client.query(
          `INSERT INTO stock
           (product_id, location_id, quantity)
           VALUES ($1, $2, $3)`,
          [
            item.product_id,
            receipt.location_id,
            item.quantity
          ]
        );

      } else {

        // Increase existing stock
        await client.query(
          `UPDATE stock
           SET quantity = quantity + $1
           WHERE product_id = $2
           AND location_id = $3`,
          [
            item.quantity,
            item.product_id,
            receipt.location_id
          ]
        );
      }

      // Record stock movement
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
          item.product_id,
          receipt.location_id,
          "receipt",
          item.quantity,
          receipt.id,
          "receipt",
          receipt.created_by
        ]
      );
    }

    // Mark receipt as validated
    const updatedReceipt = await client.query(
      `UPDATE receipts
       SET status = 'validated'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Receipt validated successfully",
      receipt: updatedReceipt.rows[0]
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error("Error validating receipt:", error);

    res.status(500).json({
      message: "Failed to validate receipt"
    });

  } finally {
    client.release();
  }
};

module.exports = {
  getReceipts,
  getReceiptById,
  createReceipt,
  validateReceipt
};