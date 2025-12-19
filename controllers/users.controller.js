const User = require("../models/users.model");
const asyncWrapper = require("../middelwares/async_wrappers");
const appError = require("../utils/appError");
const {assignRealmRoleToUser,updateKeycloakUser} = require("../middelwares/keycloakAdmin");

// GET all users
exports.getAllUsers = asyncWrapper(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    results: users.length,
    data: users
  });
});

// GET single user
exports.getUser = asyncWrapper(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(appError.create("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: user
  });
});

// CREATE user (local DB only — not Keycloak)
exports.createUser = asyncWrapper(async (req, res) => {
  const user = await User.create(req.body);

  res.status(201).json({
    status: "success",
    data: user
  });
});

// UPDATE user

exports.updateUser = asyncWrapper(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(appError.create("User not found", 404));
  }

  // Update Keycloak user basic info
  await updateKeycloakUser(user.keycloak_id, {
    email: req.body.email,
    enabled: req.body.is_active
  });

  // Update Keycloak role (if role changed)
  if (req.body.role) {
    await assignRealmRoleToUser(user.keycloak_id, req.body.role);
  }

  // Update MongoDB
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    data: updatedUser
  });
});


// DELETE user
exports.deleteUser = asyncWrapper(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(appError.create("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "User deleted successfully"
  });
});
