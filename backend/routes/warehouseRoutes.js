const express = require("express");

const {
  getWarehouses,
  getWarehouseById,
  createWarehouse
} = require("../controllers/warehouseController");

const router = express.Router();

router.get("/", getWarehouses);
router.get("/:id", getWarehouseById);
router.post("/", createWarehouse);

module.exports = router;