const Appointment = require("../models/Appointment.model");
const User = require("../models/users.model");
const asyncWrapper = require("../middelwares/async_wrappers");
const appError = require("../utils/appError");

// Helper: load MongoDB user from Keycloak token
async function getMongoUser(req) {
  const keycloakId = req.user?.sub;
  if (!keycloakId) return null;
  return await User.findOne({ keycloak_id: keycloakId });
}

// Get all appointments (Admin only)
exports.getAllAppointments = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];

  // if (!roles.includes("Admin_ROLE")) {
  //   return next(appError.create("Forbidden", 403));
  // }

  const appointments = await Appointment.find()
    .populate("patient_id", "email role")
    .populate("doctor_id", "email role");

  res.status(200).json({
    status: "success",
    results: appointments.length,
    data: appointments
  });
});


// Get appointment by ID (Admin, Doctor owner, Patient owner)
exports.getAppointment = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];
  const mongoUser = await getMongoUser(req);

  // populate patient_id and doctor_id with email + role
  const appointment = await Appointment.findById(req.params.id)
    .populate("patient_id", "email role")
    .populate("doctor_id", "email role");

  if (!appointment) {
    return next(appError.create("Appointment not found", 404));
  }

  // Admin → allowed
  if (roles.includes("Admin_ROLE")) {
    return res.status(200).json({ status: "success", data: appointment });
  }

  // Doctor → only his appointments
  if (
    roles.includes("Doctor_ROLE") &&
    appointment.doctor_id &&
    appointment.doctor_id._id.toString() === mongoUser?._id.toString()
  ) {
    return res.status(200).json({ status: "success", data: appointment });
  }

  // Patient → only his appointments
  if (
    roles.includes("Patient_ROLE") &&
    appointment.patient_id &&
    appointment.patient_id._id.toString() === mongoUser?._id.toString()
  ) {
    return res.status(200).json({ status: "success", data: appointment });
  }

  return next(appError.create("Forbidden", 403));
});


// Create appointment (Patient or Admin)
exports.createAppointment = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];

  if (!roles.includes("Patient_ROLE") && !roles.includes("Admin_ROLE")) {
    return next(appError.create("Forbidden", 403));
  }

  const appointment = await Appointment.create(req.body);

  res.status(201).json({
    status: "success",
    data: appointment
  });
});

// Update appointment (Admin or Doctor owner)
exports.updateAppointment = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];
  const mongoUser = await getMongoUser(req);

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(appError.create("Appointment not found", 404));
  }

  // Admin → allowed
  if (roles.includes("Admin_ROLE")) {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    return res.status(200).json({ status: "success", data: updated });
  }

  // Doctor → only his appointments
  if (
    roles.includes("Doctor_ROLE") &&
    appointment.doctor_id?.toString() === mongoUser?._id.toString()
  ) {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    return res.status(200).json({ status: "success", data: updated });
  }

  return next(appError.create("Forbidden", 403));
});

// Delete appointment (Admin only)
exports.deleteAppointment = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];

  // if (!roles.includes("Admin_ROLE")) {
  //   return next(appError.create("Forbidden", 403));
  // }

  const appointment = await Appointment.findByIdAndDelete(req.params.id);

  if (!appointment) {
    return next(appError.create("Appointment not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Appointment deleted successfully"
  });
});
