const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/appointment.controllor");
const requiresAuth = require("../middelwares/requiresAuth");
const requireRole = require("../middelwares/requireRole");
const appointmentAccess = require("../middelwares/appointmentAccess");

// Admin → get all
router.get(
  "/",
  requiresAuth(),
  // requireRole(["Admin_ROLE"]),
  appointmentController.getAllAppointments
);

// Get single appointment → Admin, Doctor owner, Patient owner
router.get(
  "/:id",
  requiresAuth(),
  appointmentAccess(),
  appointmentController.getAppointment
);

// Create appointment → Patient or Admin
router.post(
  "/",
  requiresAuth(),
  requireRole(["Patient_ROLE", "Admin_ROLE"]),
  appointmentController.createAppointment
);

// Update appointment → Admin or Doctor owner
router.put(
  "/:id",
  requiresAuth(),
  appointmentAccess(),
  appointmentController.updateAppointment
);

// Delete appointment → Admin only
router.delete(
  "/:id",
  requiresAuth(),
  requireRole(["Admin_ROLE","Patient_ROLE"]),
  appointmentController.deleteAppointment
);

module.exports = router;
