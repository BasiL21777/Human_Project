const Appointment = require("../models/Appointment.model");
const User = require("../models/users.model");

module.exports = function appointmentAccess() {
  return async (req, res, next) => {
    const roles = req.user?.realm_access?.roles || [];
    const keycloakId = req.user?.sub;

    // Admin → full access
    if (roles.includes("Admin_ROLE")) return next();

    // Load MongoDB user
    const mongoUser = await User.findOne({ keycloak_id: keycloakId });

    if (!mongoUser) {
      return res.status(404).json({ error: "User not found in DB" });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Doctor → only his appointments
    if (
      roles.includes("Doctor_ROLE") &&
      appointment.doctor_id?.toString() === mongoUser._id.toString()
    ) {
      return next();
    }

    // Patient → only his appointments
    if (
      roles.includes("Patient_ROLE") &&
      appointment.patient_id?.toString() === mongoUser._id.toString()
    ) {
      return next();
    }

    return res.status(403).json({
      error: "Forbidden",
      message: "You do not have permission to access this appointment"
    });
  };
};
