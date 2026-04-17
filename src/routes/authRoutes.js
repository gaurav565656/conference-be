const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
require('dotenv').config();

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
  console.log('=== SIGNUP REQUEST RECEIVED ===');
  console.log('Request body:', req.body);

  const { name, email, password } = req.body;

  try {
    // Validate email domain
    const emailDomain = email.split("@")[1];
    console.log('Email domain:', emailDomain);

    // Block admin domain from signup
    if (emailDomain === "gov.com") {
      return res.status(400).json({ message: "Gov.com domain is restricted. Admin accounts are pre-created." });
    }

    // Check for valid domains
    const validDomains = ['it.com', 'finance.com', 'hr.com'];
    if (!validDomains.includes(emailDomain)) {
      return res.status(400).json({ message: "Invalid email domain. Use it.com, finance.com, or hr.com" });
    }

    // Map email domain to department name
    let departmentName;
    if (emailDomain === 'it.com') {
      departmentName = 'IT Department';
    } else if (emailDomain === 'finance.com') {
      departmentName = 'Finance Department';
    } else if (emailDomain === 'hr.com') {
      departmentName = 'HR Department';
    }

    console.log('Looking for department:', departmentName);

    // Find department
    const department = await Department.findOne({ name: departmentName });
    console.log('Found department:', department);

    if (!department) {
      return res.status(400).json({ message: `Department '${departmentName}' not found. Please contact admin.` });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    console.log('Creating user with department ID:', department._id);
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "official",
      department: department._id
    });

    console.log('User created successfully:', user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate("department");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;