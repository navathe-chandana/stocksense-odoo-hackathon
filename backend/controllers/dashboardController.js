const pool = require("../config/db");

const getDashboard = async (req, res) => {
  try {
    const {
      location_id,
      category_id,
      status,
      document_type
    } = req.query;

    // -----------------------------
    // PRODUCT / STOCK FILTER
    // -----------------------------

    const stockParams = [];
    const stockConditions = [];

    if (location_id) {
      stockParams.push(location_id);
      stockConditions.push(`s.location_id = $${stockParams.length}`);
    }

    if (category_id) {
      stockParams.push(category_id);
      stockConditions.push(`p.category_id = $${stockParams.length}`);
    }

    const stockWhere = stockConditions.length
      ? `WHERE ${stockConditions.join(" AND ")}`
      : "";

    // Total products
    const productsResult = await pool.query(
      `
      SELECT COUNT(DISTINCT p.id) AS total_products
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      ${stockWhere}
      `,
      stockParams
    );

    // Low stock / out of stock
    const stockResult = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE COALESCE(s.quantity, 0) > 0
          AND COALESCE(s.quantity, 0) <= p.reorder_level
        ) AS low_stock,

        COUNT(*) FILTER (
          WHERE COALESCE(s.quantity, 0) = 0
        ) AS out_of_stock

      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      ${stockWhere}
      `,
      stockParams
    );

    // -----------------------------
    // PENDING DOCUMENTS
    // -----------------------------

    const documentStatus = status || "draft";

    let pendingReceipts = 0;
    let pendingDeliveries = 0;
    let pendingTransfers = 0;

    // Receipts
    if (!document_type || document_type === "receipt") {
      const params = [documentStatus];
      let query = `
        SELECT COUNT(*) AS count
        FROM receipts r
        WHERE r.status = $1
      `;

      if (location_id) {
        params.push(location_id);
        query += ` AND r.location_id = $${params.length}`;
      }

      const result = await pool.query(query, params);
      pendingReceipts = Number(result.rows[0].count);
    }

    // Deliveries
    if (!document_type || document_type === "delivery") {
      const params = [documentStatus];
      let query = `
        SELECT COUNT(*) AS count
        FROM deliveries d
        WHERE d.status = $1
      `;

      if (location_id) {
        params.push(location_id);
        query += ` AND d.location_id = $${params.length}`;
      }

      const result = await pool.query(query, params);
      pendingDeliveries = Number(result.rows[0].count);
    }

    // Transfers
    if (!document_type || document_type === "transfer") {
      const params = [documentStatus];
      let query = `
        SELECT COUNT(*) AS count
        FROM transfers t
        WHERE t.status = $1
      `;

      if (location_id) {
        params.push(location_id);
        query += `
          AND (
            t.from_location_id = $${params.length}
            OR t.to_location_id = $${params.length}
          )
        `;
      }

      const result = await pool.query(query, params);
      pendingTransfers = Number(result.rows[0].count);
    }

    res.json({
      total_products: Number(
        productsResult.rows[0].total_products
      ),

      low_stock: Number(
        stockResult.rows[0].low_stock
      ),

      out_of_stock: Number(
        stockResult.rows[0].out_of_stock
      ),

      pending_receipts: pendingReceipts,

      pending_deliveries: pendingDeliveries,

      pending_transfers: pendingTransfers
    });

  } catch (error) {
    console.error("Error fetching dashboard:", error);

    res.status(500).json({
      message: "Failed to fetch dashboard data"
    });
  }
};

module.exports = {
  getDashboard
};