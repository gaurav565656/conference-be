// models/Building.js
const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Building', BuildingSchema);
