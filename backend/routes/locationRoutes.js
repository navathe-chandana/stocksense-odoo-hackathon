const express = require("express");

const {
  getLocations,
  getLocationById,
  createLocation
} = require("../controllers/locationController");

const router = express.Router();

router.get("/", getLocations);
router.get("/:id", getLocationById);
router.post("/", createLocation);

module.exports = router;