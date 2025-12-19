const mongoose = require('mongoose');
const validator = require('validator');
const userRoles = require('../utils/userRoles');

const userSchema = new mongoose.Schema(
  {
    keycloak_id: {
      type: String,
      required: true,
      unique: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid email format"
      }
    },

    role: {
      type: String,
      enum: [userRoles.ADMIN, userRoles.PATIENT, userRoles.DOCTOR],
      required: true,
      default: userRoles.PATIENT
    },

    is_active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // adds createdAt + updatedAt
  }
);

module.exports = mongoose.model('User', userSchema);
