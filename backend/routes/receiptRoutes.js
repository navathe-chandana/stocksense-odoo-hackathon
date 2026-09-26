const express = require("express");

const {
  getReceipts,
  getReceiptById,
  createReceipt,
  validateReceipt
} = require("../controllers/receiptController");

const router = express.Router();

router.get("/", getReceipts);
router.get("/:id", getReceiptById);
router.post("/", createReceipt);
router.patch("/:id/validate", validateReceipt);

module.exports = router;