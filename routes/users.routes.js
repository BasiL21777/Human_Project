const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const requiresAuth = require("../middelwares/requiresAuth");
const requireRole = require("../middelwares/requireRole");

// GET all users → Admin only
router.get(
  "/",
  requiresAuth(),
  usersController.getAllUsers
);

// GET single user → Admin only (or later: self)
router.get(
  "/:id",
  requiresAuth(),
  requireRole(["Admin_ROLE"]),
  usersController.getUser
);

// CREATE user → Admin only
router.post(
  "/",
  requiresAuth(),
  requireRole(["Admin_ROLE"]),
  usersController.createUser
);

// UPDATE user → Admin only
router.put(
  "/:id",
  requiresAuth(),
  requireRole(["Admin_ROLE"]),
  usersController.updateUser
);

// DELETE user → Admin only
router.delete(
  "/:id",
  requiresAuth(),
  requireRole(["Admin_ROLE"]),
  usersController.deleteUser
);

module.exports = router;
