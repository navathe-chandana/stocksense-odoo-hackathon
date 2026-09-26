const pool = require("../config/db");

// GET all locations
const getLocations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.id,
        l.name,
        l.warehouse_id,
        w.name AS warehouse_name
      FROM locations l
      JOIN warehouses w ON l.warehouse_id = w.id
      ORDER BY l.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching locations:", error);

    res.status(500).json({
      message: "Failed to fetch locations"
    });
  }
};

// GET one location
const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        l.id,
        l.name,
        l.warehouse_id,
        w.name AS warehouse_name
      FROM locations l
      JOIN warehouses w ON l.warehouse_id = w.id
      WHERE l.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Location not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching location:", error);

    res.status(500).json({
      message: "Failed to fetch location"
    });
  }
};

// CREATE location
const createLocation = async (req, res) => {
  try {
    const { warehouse_id, name } = req.body;

    if (!warehouse_id || !name) {
      return res.status(400).json({
        message: "Warehouse ID and location name are required"
      });
    }

    const result = await pool.query(`
      INSERT INTO locations (warehouse_id, name)
      VALUES ($1, $2)
      RETURNING *
    `, [warehouse_id, name]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating location:", error);

    res.status(500).json({
      message: "Failed to create location"
    });
  }
};

module.exports = {
  getLocations,
  getLocationById,
  createLocation
};