const User = require("../models/users.model");
const asyncWrapper = require("../middelwares/async_wrappers");
const appError = require("../utils/appError");
const { assignRealmRoleToUser, removeRealmRoleFromUser, updateKeycloakUser } = require("../middelwares/keycloakAdmin");

// Helper to detect admin roles
function isAdmin(user) {
  return user.role && user.role.toLowerCase().includes("admin");
}

// GET all users
exports.getAllUsers = asyncWrapper(async (req, res) => {
  const requesterRole = req.user?.realm_access?.roles || [];
  const requesterId = req.user?.sub;

  let users;

  if (requesterRole.some(r => r.toLowerCase().includes("admin"))) {
    // Admin → list all non-admins + their own record
    users = await User.find({
      $or: [
        { role: { $nin: ["admin", "Admin_ROLE", "ADMIN"] } },
        { keycloak_id: requesterId }
      ]
    });
  } else {
    // Non-admin → list all non-admins only
    users = await User.find({ role: { $nin: ["admin", "Admin_ROLE", "ADMIN"] } });
  }

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users
  });
});

// GET single user
exports.getUser = asyncWrapper(async (req, res, next) => {
  const requesterRole = req.user?.realm_access?.roles || [];
  const requesterId = req.user?.sub;

  const user = await User.findById(req.params.id);
  if (!user) return next(appError.create("User not found", 404));

  if (isAdmin(user)) {
    if (user.keycloak_id !== requesterId) {
      return next(appError.create("Access denied: cannot view other admin details", 403));
    }
  }

  res.status(200).json({ status: "success", data: user });
});

// CREATE user
exports.createUser = asyncWrapper(async (req, res, next) => {
  if (req.body.role && req.body.role.toLowerCase().includes("admin")) {
    return next(appError.create("Forbidden: cannot create admin user", 403));
  }

  const user = await User.create(req.body);
  res.status(201).json({ status: "success", data: user });
});

// UPDATE user
exports.updateUser = asyncWrapper(async (req, res, next) => {
  const requesterRole = req.user?.realm_access?.roles || [];
  const requesterId = req.user?.sub;

  const user = await User.findById(req.params.id);
  if (!user) return next(appError.create("User not found", 404));

  if (isAdmin(user)) {
    if (user.keycloak_id !== requesterId) {
      return next(appError.create("Forbidden: cannot update other admin data", 403));
    }
  }

  // Update Keycloak user basic info
  await updateKeycloakUser(user.keycloak_id, {
    email: req.body.email,
    enabled: req.body.is_active
  });

  // Update Keycloak role (if role changed)
  if (req.body.role && req.body.role !== user.role) {
    if (user.role) {
      await removeRealmRoleFromUser(user.keycloak_id, user.role);
    }
    await assignRealmRoleToUser(user.keycloak_id, req.body.role);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({ status: "success", data: updatedUser });
});

// DELETE user
exports.deleteUser = asyncWrapper(async (req, res, next) => {
  const requesterRole = req.user?.realm_access?.roles || [];
  const requesterId = req.user?.sub;

  const user = await User.findById(req.params.id);
  if (!user) return next(appError.create("User not found", 404));

  if (isAdmin(user)) {
    if (user.keycloak_id !== requesterId) {
      return next(appError.create("Forbidden: cannot delete other admin", 403));
    }
  }

  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: "success", message: "User deleted successfully" });
});
