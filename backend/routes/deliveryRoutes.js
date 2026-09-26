const express = require("express");

const {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  validateDelivery
} = require("../controllers/deliveryController");

const router = express.Router();

router.get("/", getDeliveries);
router.get("/:id", getDeliveryById);
router.post("/", createDelivery);
router.patch("/:id/validate", validateDelivery);

module.exports = router;