// models/PatientRecord.js
const mongoose = require('mongoose');

const patientRecordSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  diagnosis: {
    type: String,
    trim: true
  },

  prescription: {
    type: String,
    trim: true
  },

  notes: {
    type: String,
    trim: true
  },

  is_draft: {
    type: Boolean,
    default: true
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PatientRecord', patientRecordSchema);
