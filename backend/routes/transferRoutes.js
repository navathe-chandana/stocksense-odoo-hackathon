const express = require("express");

const {
  getTransfers,
  getTransferById,
  createTransfer,
  validateTransfer
} = require("../controllers/transferController");

const router = express.Router();

router.get("/", getTransfers);
router.get("/:id", getTransferById);
router.post("/", createTransfer);
router.patch("/:id/validate", validateTransfer);

module.exports = router;