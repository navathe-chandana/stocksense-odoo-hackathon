const express = require("express");

const {
  getStock,
  getStockById,
  createStock
} = require("../controllers/stockController");

const router = express.Router();

router.get("/", getStock);
router.get("/:id", getStockById);
router.post("/", createStock);

module.exports = router;