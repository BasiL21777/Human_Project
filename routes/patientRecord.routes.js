const express = require("express");
const router = express.Router();

const recordController = require("../controllers/patientRecord.controller");
const requiresAuth = require("../middelwares/requiresAuth");

// Admin only
router.get("/", requiresAuth(), recordController.getAllRecords);

// Admin, Doctor owner, Patient owner
router.get("/:id", requiresAuth(), recordController.getRecord);

// Doctor or Admin
router.post("/", requiresAuth(), recordController.createRecord);

// Doctor owner or Admin
router.put("/:id", requiresAuth(), recordController.updateRecord);

// Admin only
router.delete("/:id", requiresAuth(), recordController.deleteRecord);

module.exports = router;
