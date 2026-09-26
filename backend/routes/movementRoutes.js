const express = require("express");

const {
  getMovements,
  getMovementById
} = require("../controllers/movementController");

const router = express.Router();

router.get("/", getMovements);
router.get("/:id", getMovementById);

module.exports = router;