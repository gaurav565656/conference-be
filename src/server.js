require("./models/Building");
require("./models/Department");
require("./models/User");
require("./models/Room");
require("./models/Booking");

const express = require('express');
const connectDB = require('./db');
require('dotenv').config();

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use('/api/admin', require('./routes/adminRoutes'));



// Test route
app.get('/', (req, res) => {
  res.send("🚀 Conference Room Booking API Running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
