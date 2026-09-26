const pool = require("../config/db");

// Get all transfers
const getTransfers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.from_location_id,
        fl.name AS from_location_name,
        t.to_location_id,
        tl.name AS to_location_name,
        t.status,
        t.created_by,
        t.created_at
      FROM transfers t
      JOIN locations fl ON t.from_location_id = fl.id
      JOIN locations tl ON t.to_location_id = tl.id
      ORDER BY t.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching transfers:", error);
    res.status(500).json({
      message: "Failed to fetch transfers"
    });
  }
};

// Get transfer by ID with items
const getTransferById = async (req, res) => {
  try {
    const { id } = req.params;

    const transferResult = await pool.query(`
      SELECT
        t.id,
        t.from_location_id,
        fl.name AS from_location_name,
        t.to_location_id,
        tl.name AS to_location_name,
        t.status,
        t.created_by,
        t.created_at
      FROM transfers t
      JOIN locations fl ON t.from_location_id = fl.id
      JOIN locations tl ON t.to_location_id = tl.id
      WHERE t.id = $1
    `, [id]);

    if (transferResult.rows.length === 0) {
      return res.status(404).json({
        message: "Transfer not found"
      });
    }

    const itemsResult = await pool.query(`
      SELECT
        ti.id,
        ti.product_id,
        p.name AS product_name,
        p.sku,
        ti.quantity
      FROM transfer_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE ti.transfer_id = $1
      ORDER BY ti.id
    `, [id]);

    res.json({
      ...transferResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error("Error fetching transfer:", error);
    res.status(500).json({
      message: "Failed to fetch transfer"
    });
  }
};

// Create a transfer with items
const createTransfer = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      from_location_id,
      to_location_id,
      created_by,
      items
    } = req.body;

    if (!from_location_id || !to_location_id) {
      return res.status(400).json({
        message: "Source and destination locations are required"
      });
    }

    if (from_location_id === to_location_id) {
      return res.status(400).json({
        message: "Source and destination locations must be different"
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one transfer item is required"
      });
    }

    await client.query("BEGIN");

    const transferResult = await client.query(`
      INSERT INTO transfers
      (from_location_id, to_location_id, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [
      from_location_id,
      to_location_id,
      created_by || null
    ]);

    const transfer = transferResult.rows[0];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error("Invalid transfer item");
      }

      await client.query(`
        INSERT INTO transfer_items
        (transfer_id, product_id, quantity)
        VALUES ($1, $2, $3)
      `, [
        transfer.id,
        item.product_id,
        item.quantity
      ]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Transfer created successfully",
      transfer_id: transfer.id,
      status: transfer.status
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating transfer:", error);

    res.status(500).json({
      message: "Failed to create transfer"
    });
  } finally {
    client.release();
  }
};

// Validate transfer
const validateTransfer = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Get transfer
    const transferResult = await client.query(
      `SELECT *
       FROM transfers
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (transferResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Transfer not found"
      });
    }

    const transfer = transferResult.rows[0];

    if (transfer.status === "validated") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Transfer is already validated"
      });
    }

    // Get transfer items
    const itemsResult = await client.query(
      `SELECT *
       FROM transfer_items
       WHERE transfer_id = $1`,
      [id]
    );

    if (itemsResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Transfer has no items"
      });
    }

    // Process each item
    for (const item of itemsResult.rows) {

      // Lock source stock
      const sourceStockResult = await client.query(
        `SELECT id, quantity
         FROM stock
         WHERE product_id = $1
         AND location_id = $2
         FOR UPDATE`,
        [
          item.product_id,
          transfer.from_location_id
        ]
      );

      if (sourceStockResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: `No stock found at source for product ${item.product_id}`
        });
      }

      const sourceQuantity =
        sourceStockResult.rows[0].quantity;

      if (sourceQuantity < item.quantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: `Insufficient source stock for product ${item.product_id}`,
          available: sourceQuantity,
          requested: item.quantity
        });
      }

      // Decrease source stock
      await client.query(
        `UPDATE stock
         SET quantity = quantity - $1
         WHERE product_id = $2
         AND location_id = $3`,
        [
          item.quantity,
          item.product_id,
          transfer.from_location_id
        ]
      );

      // Add/increase destination stock
      await client.query(
        `INSERT INTO stock
         (product_id, location_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, location_id)
         DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity`,
        [
          item.product_id,
          transfer.to_location_id,
          item.quantity
        ]
      );

      // Source movement
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
          transfer.from_location_id,
          "transfer_out",
          -item.quantity,
          transfer.id,
          "transfer",
          transfer.created_by
        ]
      );

      // Destination movement
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
          transfer.to_location_id,
          "transfer_in",
          item.quantity,
          transfer.id,
          "transfer",
          transfer.created_by
        ]
      );
    }

    // Mark transfer as validated
    const updatedTransfer = await client.query(
      `UPDATE transfers
       SET status = 'validated'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Transfer validated successfully",
      transfer: updatedTransfer.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error validating transfer:", error);

    res.status(500).json({
      message: "Failed to validate transfer"
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getTransfers,
  getTransferById,
  createTransfer,
  validateTransfer
};
