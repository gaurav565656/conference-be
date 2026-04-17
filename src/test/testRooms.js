
const axios = require("axios");
const connectDB = require("../db");

async function main() {
  await connectDB();
  require("../models/Building");
  require("../models/Department");
  require("../models/User");
  require("../models/Room");
  require("../models/Booking");

  // ...existing code...
  const API = "http://localhost:5000/api/rooms";
  const AUTH = "http://localhost:5000/api/auth";

  async function testRooms() {
    try {
      // Login as official user
      const loginRes = await axios.post(`${AUTH}/login`, {
        email: "official@test.com",
        password: "123456"
      });
      const token = loginRes.data.token;

      // Check available rooms
      const availableRes = await axios.get(`${API}/available`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: "2025-09-10", startTime: "10:00", endTime: "11:00", capacity: 10 }
      });

      console.log("✅ Available Rooms:", availableRes.data);
    } catch (err) {
      console.error("❌ Error:", err.response ? err.response.data : err.message);
    }
  }

  await testRooms();
}

main();
