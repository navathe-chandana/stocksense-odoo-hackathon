const pool = require("../config/db");

// GET all warehouses
const getWarehouses = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM warehouses ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching warehouses:", error);

    res.status(500).json({
      message: "Failed to fetch warehouses"
    });
  }
};

// GET one warehouse
const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM warehouses WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Warehouse not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching warehouse:", error);

    res.status(500).json({
      message: "Failed to fetch warehouse"
    });
  }
};

// CREATE warehouse
const createWarehouse = async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Warehouse name is required"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO warehouses (name, address)
      VALUES ($1, $2)
      RETURNING *
      `,
      [name, address || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating warehouse:", error);

    res.status(500).json({
      message: "Failed to create warehouse"
    });
  }
};

module.exports = {
  getWarehouses,
  getWarehouseById,
  createWarehouse
};