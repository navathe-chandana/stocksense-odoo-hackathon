const pool = require("../config/db");

// GET all products
const getProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.unit,
        p.reorder_level,
        c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);

    res.status(500).json({
      message: "Failed to fetch products"
    });
  }
};

// GET one product
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.unit,
        p.reorder_level,
        c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error);

    res.status(500).json({
      message: "Failed to fetch product"
    });
  }
};

// CREATE product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category_id,
      unit,
      reorder_level
    } = req.body;

    if (!name || !sku || !unit) {
      return res.status(400).json({
        message: "Name, SKU and unit are required"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO products
      (name, sku, category_id, unit, reorder_level)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        name,
        sku,
        category_id || null,
        unit,
        reorder_level || 0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating product:", error);

    res.status(500).json({
      message: "Failed to create product"
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct
};