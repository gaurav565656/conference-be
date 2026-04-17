const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

const router = express.Router();

// @route   GET /api/rooms/available
// @desc    Get available rooms for given date/time/capacity
// @access  Protected
router.get('/available', protect, async (req, res) => {
  const { date, startTime, endTime, capacity } = req.query;

  if (!date || !startTime || !endTime || !capacity) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    // 1. Find rooms that meet capacity
    let rooms = await Room.find({
      capacity: { $gte: Number(capacity) },
      isAvailable: true,
      $or: [
        { allowedDepartments: { $size: 0 } },
        { allowedDepartments: req.user.department }
      ]
    }).populate("building");

    // 2. Find booked rooms that overlap with given time
    const bookedRooms = await Booking.find({
      date,
      status: { $in: ["booked", "approved", "pending"] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } } // overlap check
      ]
    }).select("room");

    const bookedRoomIds = bookedRooms.map(b => b.room.toString());

    // 3. Filter out booked ones
    rooms = rooms.filter(r => !bookedRoomIds.includes(r._id.toString()));

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/admin/rooms
// @desc    Add a new room (admin only)
// @access  Admin
router.post('/admin/rooms', protect, adminOnly, async (req, res) => {
  const { name, capacity, building, allowedDepartments } = req.body;

  try {
    const newRoom = await Room.create({
      name,
      capacity,
      building,
      allowedDepartments: allowedDepartments || []
    });

    res.json(newRoom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
