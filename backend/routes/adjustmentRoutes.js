const express = require("express");

const {
  getAdjustments,
  getAdjustmentById,
  createAdjustment
} = require("../controllers/adjustmentController");

const router = express.Router();

router.get("/", getAdjustments);
router.get("/:id", getAdjustmentById);
router.post("/", createAdjustment);

module.exports = router;