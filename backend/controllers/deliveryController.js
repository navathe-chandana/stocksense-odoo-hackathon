const pool = require("../config/db");

// Get all deliveries
const getDeliveries = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.id,
        d.location_id,
        l.name AS location_name,
        d.status,
        d.created_by,
        d.created_at
      FROM deliveries d
      JOIN locations l ON d.location_id = l.id
      ORDER BY d.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    res.status(500).json({
      message: "Failed to fetch deliveries"
    });
  }
};

// Get delivery by ID with items
const getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryResult = await pool.query(`
      SELECT
        d.id,
        d.location_id,
        l.name AS location_name,
        d.status,
        d.created_by,
        d.created_at
      FROM deliveries d
      JOIN locations l ON d.location_id = l.id
      WHERE d.id = $1
    `, [id]);

    if (deliveryResult.rows.length === 0) {
      return res.status(404).json({
        message: "Delivery not found"
      });
    }

    const itemsResult = await pool.query(`
      SELECT
        di.id,
        di.product_id,
        p.name AS product_name,
        p.sku,
        di.quantity
      FROM delivery_items di
      JOIN products p ON di.product_id = p.id
      WHERE di.delivery_id = $1
      ORDER BY di.id
    `, [id]);

    res.json({
      ...deliveryResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error("Error fetching delivery:", error);
    res.status(500).json({
      message: "Failed to fetch delivery"
    });
  }
};

// Create a delivery with items
const createDelivery = async (req, res) => {
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
        message: "At least one delivery item is required"
      });
    }

    await client.query("BEGIN");

    const deliveryResult = await client.query(`
      INSERT INTO deliveries (location_id, created_by)
      VALUES ($1, $2)
      RETURNING *
    `, [location_id, created_by || null]);

    const delivery = deliveryResult.rows[0];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error("Invalid delivery item");
      }

      await client.query(`
        INSERT INTO delivery_items
        (delivery_id, product_id, quantity)
        VALUES ($1, $2, $3)
      `, [
        delivery.id,
        item.product_id,
        item.quantity
      ]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Delivery created successfully",
      delivery_id: delivery.id,
      status: delivery.status
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating delivery:", error);

    res.status(500).json({
      message: "Failed to create delivery"
    });
  } finally {
    client.release();
  }
};

// Validate delivery
const validateDelivery = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Get delivery
    const deliveryResult = await client.query(
      `SELECT * FROM deliveries WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (deliveryResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Delivery not found"
      });
    }

    const delivery = deliveryResult.rows[0];

    if (delivery.status === "validated") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Delivery is already validated"
      });
    }

    // Get delivery items
    const itemsResult = await client.query(
      `SELECT * FROM delivery_items WHERE delivery_id = $1`,
      [id]
    );

    if (itemsResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Delivery has no items"
      });
    }

    // Process each item
    for (const item of itemsResult.rows) {
      const stockResult = await client.query(
        `SELECT id, quantity
         FROM stock
         WHERE product_id = $1
         AND location_id = $2
         FOR UPDATE`,
        [item.product_id, delivery.location_id]
      );

      if (stockResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: `No stock found for product ${item.product_id}`
        });
      }

      const currentQuantity = stockResult.rows[0].quantity;

      if (currentQuantity < item.quantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: `Insufficient stock for product ${item.product_id}`,
          available: currentQuantity,
          requested: item.quantity
        });
      }

      // Decrease stock
      await client.query(
        `UPDATE stock
         SET quantity = quantity - $1
         WHERE product_id = $2
         AND location_id = $3`,
        [
          item.quantity,
          item.product_id,
          delivery.location_id
        ]
      );

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
          delivery.location_id,
          "delivery",
          -item.quantity,
          delivery.id,
          "delivery",
          delivery.created_by
        ]
      );
    }

    // Mark delivery as validated
    const updatedDelivery = await client.query(
      `UPDATE deliveries
       SET status = 'validated'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Delivery validated successfully",
      delivery: updatedDelivery.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error validating delivery:", error);

    res.status(500).json({
      message: "Failed to validate delivery"
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  validateDelivery
};