const PatientRecord = require("../models/PatientRecord.model");
const User = require("../models/users.model");
const asyncWrapper = require("../middelwares/async_wrappers");
const appError = require("../utils/appError");

// Helper: load MongoDB user from Keycloak token
async function getMongoUser(req) {
  const keycloakId = req.user?.sub;
  if (!keycloakId) return null;
  return await User.findOne({ keycloak_id: keycloakId });
}

// Get all records (Admin only)
exports.getAllRecords = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];

  // if (!roles.includes("Admin_ROLE")) {
  //   return next(appError.create("Forbidden", 403));
  // }

  const records = await PatientRecord.find()
    .populate("patient_id", "email role")
    .populate("doctor_id", "email role");

  res.status(200).json({
    status: "success",
    results: records.length,
    data: records
  });
});


exports.getRecord = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];
  const mongoUser = await getMongoUser(req);

  const record = await PatientRecord.findById(req.params.id)
    .populate("patient_id", "email role")
    .populate("doctor_id", "email role");

  if (!record) {
    return next(appError.create("Record not found", 404));
  }

  // Admin → allowed
  if (roles.includes("Admin_ROLE")) {
    return res.status(200).json({
      status: "success",
      results: 1,
      data: [record]
    });
  }

  // Doctor → only his records
  if (
    roles.includes("Doctor_ROLE") &&
    record.doctor_id &&
    record.doctor_id._id.toString() === mongoUser._id.toString()
  ) {
    return res.status(200).json({
      status: "success",
      results: 1,
      data: [record]
    });
  }

  // Patient → only his records
  if (
    roles.includes("Patient_ROLE") &&
    record.patient_id &&
    record.patient_id._id.toString() === mongoUser._id.toString()
  ) {
    return res.status(200).json({
      status: "success",
      results: 1,
      data: [record]
    });
  }

  return next(appError.create("Forbidden", 403));
});




// Create record (Doctor or Admin)
exports.createRecord = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];

  if (!roles.includes("Doctor_ROLE") && !roles.includes("Admin_ROLE")) {
    return next(appError.create("Forbidden", 403));
  }

  const record = await PatientRecord.create(req.body);

  res.status(201).json({
    status: "success",
    data: record
  });
});

// Update record (Admin or Doctor owner)
exports.updateRecord = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];
  const mongoUser = await getMongoUser(req);

  const record = await PatientRecord.findById(req.params.id);

  if (!record) {
    return next(appError.create("Record not found", 404));
  }

  // Admin → allowed
  if (roles.includes("Admin_ROLE")) {
    const updated = await PatientRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    return res.status(200).json({ status: "success", data: updated });
  }

  // Doctor → only his records
  if (
    roles.includes("Doctor_ROLE") &&
    record.doctor_id.toString() === mongoUser._id.toString()
  ) {
    const updated = await PatientRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    return res.status(200).json({ status: "success", data: updated });
  }

  return next(appError.create("Forbidden", 403));
});

// Delete record (Admin only)
exports.deleteRecord = asyncWrapper(async (req, res, next) => {
  const roles = req.user?.realm_access?.roles || [];

  if (!roles.includes("Admin_ROLE")) {
    return next(appError.create("Forbidden", 403));
  }

  const record = await PatientRecord.findByIdAndDelete(req.params.id);

  if (!record) {
    return next(appError.create("Record not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Record deleted successfully"
  });
});
