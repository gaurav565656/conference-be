// seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Department = require('./models/Department');
const Building = require('./models/Building');
const Room = require('./models/Room');
const Booking = require('./models/Booking');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  try {
    // Clear old data
    await User.deleteMany();
    await Department.deleteMany();
    await Building.deleteMany();
    await Room.deleteMany();

    // Create buildings with location coordinates
    const building1 = await Building.create({
      name: "Shastri Bhavan",
      address: "Rajpath, New Delhi",
      location: {
        type: "Point",
        coordinates: [77.2090, 28.6139] // [longitude, latitude] - Rajpath, New Delhi
      }
    });
    const building2 = await Building.create({
      name: "Udyog Bhavan",
      address: "Rajpath, New Delhi",
      location: {
        type: "Point",
        coordinates: [77.2088, 28.6142] // [longitude, latitude] - Near Rajpath
      }
    });

    // Create departments
    const deptIT = await Department.create({ name: "IT Department", building: building1._id });
    const deptHR = await Department.create({ name: "HR Department", building: building1._id });
    const deptFinance = await Department.create({ name: "Finance Department", building: building2._id });

    // Create rooms
    await Room.create([
      { name: "Conference Room A", capacity: 20, building: building1._id, allowedDepartments: [deptIT._id] },
      { name: "Conference Room B", capacity: 15, building: building1._id },
      { name: "Conference Room C", capacity: 25, building: building2._id, allowedDepartments: [deptFinance._id] },
    ]);

    // Hash passwords for users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const officialPassword = await bcrypt.hash("user123", salt);

    // Create users with hashed passwords
    await User.create([
      {
        name: "System Administrator",
        email: "admin.room@gov.com",
        password: adminPassword,
        role: "admin",
        department: deptIT._id
      },
      {
        name: "John Official",
        email: "john@it.com",
        password: officialPassword,
        role: "official",
        department: deptIT._id
      },
      {
        name: "Jane Finance",
        email: "jane@finance.com",
        password: officialPassword,
        role: "official",
        department: deptFinance._id
      },
      {
        name: "Bob HR",
        email: "bob@hr.com",
        password: officialPassword,
        role: "official",
        department: deptHR._id
      }
    ]);

    console.log('👑 Admin account created:');
    console.log('   Email: admin.room@gov.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('');
    console.log('👤 Test official accounts created:');
    console.log('   john@it.com / jane@finance.com / bob@hr.com');
    console.log('   Password: user123');

    console.log('🌱 Dummy data seeded');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
