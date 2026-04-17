// src/models/Booking.js
const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: String, // Format YYYY-MM-DD
    required: true
  },
  startTime: {
    type: String, // Format HH:mm
    required: true
  },
  endTime: {
    type: String, // Format HH:mm
    required: true
  },
  status: {
    type: String,
    enum: ["booked", "pending", "approved", "rejected", "cancelled"],
    default: "booked"
  },
  purpose: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
