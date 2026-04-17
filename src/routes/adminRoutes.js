const express = require('express');
const Building = require('../models/Building');
const Department = require('../models/Department');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/buildings', async (req, res) => {
  try {
    const buildings = await Building.find().sort({ createdAt: -1 });
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/buildings', async (req, res) => {
  const { name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({ message: 'Name and address are required' });
  }

  try {
    const building = await Building.create({ name, address });
    res.status(201).json(building);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/buildings/:id', async (req, res) => {
  const { name, address } = req.body;

  try {
    const building = await Building.findById(req.params.id);
    if (!building) return res.status(404).json({ message: 'Building not found' });

    building.name = name ?? building.name;
    building.address = address ?? building.address;

    await building.save();
    res.json(building);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/buildings/:id', async (req, res) => {
  try {
    const inUseByDepartments = await Department.exists({ building: req.params.id });
    const inUseByRooms = await Room.exists({ building: req.params.id });

    if (inUseByDepartments || inUseByRooms) {
      return res.status(400).json({ message: 'Cannot delete building linked to departments or rooms' });
    }

    const deleted = await Building.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Building not found' });

    res.json({ message: 'Building deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().populate('building').sort({ createdAt: -1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/departments', async (req, res) => {
  const { name, building } = req.body;

  if (!name || !building) {
    return res.status(400).json({ message: 'Name and building are required' });
  }

  try {
    const buildingDoc = await Building.findById(building);
    if (!buildingDoc) return res.status(404).json({ message: 'Building not found' });

    const department = await Department.create({ name, building });
    const populated = await Department.findById(department._id).populate('building');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  const { name, building } = req.body;

  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    if (building) {
      const buildingDoc = await Building.findById(building);
      if (!buildingDoc) return res.status(404).json({ message: 'Building not found' });
      department.building = building;
    }

    department.name = name ?? department.name;
    await department.save();

    const populated = await Department.findById(department._id).populate('building');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    const inUseByUsers = await require('../models/User').exists({ department: req.params.id });
    const inUseByRooms = await Room.exists({ allowedDepartments: req.params.id });

    if (inUseByUsers || inUseByRooms) {
      return res.status(400).json({ message: 'Cannot delete department linked to users or room restrictions' });
    }

    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Department not found' });

    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('building')
      .populate('allowedDepartments')
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/rooms', async (req, res) => {
  const { name, capacity, building, allowedDepartments, isAvailable } = req.body;

  if (!name || !capacity || !building) {
    return res.status(400).json({ message: 'Name, capacity and building are required' });
  }

  try {
    const buildingDoc = await Building.findById(building);
    if (!buildingDoc) return res.status(404).json({ message: 'Building not found' });

    const room = await Room.create({
      name,
      capacity,
      building,
      allowedDepartments: allowedDepartments || [],
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true
    });

    const populated = await Room.findById(room._id).populate('building').populate('allowedDepartments');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/rooms/:id', async (req, res) => {
  const { name, capacity, building, allowedDepartments, isAvailable } = req.body;

  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (building) {
      const buildingDoc = await Building.findById(building);
      if (!buildingDoc) return res.status(404).json({ message: 'Building not found' });
      room.building = building;
    }

    if (Array.isArray(allowedDepartments)) {
      room.allowedDepartments = allowedDepartments;
    }

    if (typeof isAvailable === 'boolean') {
      room.isAvailable = isAvailable;
    }

    room.name = name ?? room.name;
    room.capacity = capacity ?? room.capacity;

    await room.save();

    const populated = await Room.findById(room._id).populate('building').populate('allowedDepartments');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/rooms/:id', async (req, res) => {
  try {
    const activeBookingExists = await Booking.exists({ room: req.params.id, status: { $in: ['booked', 'approved', 'pending'] } });
    if (activeBookingExists) {
      return res.status(400).json({ message: 'Cannot delete room with active bookings' });
    }

    const deleted = await Room.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Room not found' });

    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({ path: 'room', populate: { path: 'building' } })
      .populate({ path: 'user', populate: { path: 'department' } })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/bookings/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['booked', 'approved', 'rejected', 'cancelled', 'pending'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate({ path: 'room', populate: { path: 'building' } })
      .populate({ path: 'user', populate: { path: 'department' } });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;