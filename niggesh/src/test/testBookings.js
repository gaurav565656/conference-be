const axios = require("axios");

const API = "http://localhost:5000/api/bookings";
const AUTH = "http://localhost:5000/api/auth";

async function testBookings() {
  try {
    // Login as student
    const loginRes = await axios.post(`${AUTH}/login`, {
      email: "cliuser@test.com",
      password: "123456"
    });
    const token = loginRes.data.token;

    // 1. Request a booking
    const bookingRes = await axios.post(`${API}`, {
      room: "68af47862359dfd30d3d2a71",
      date: "2025-09-10",
      startTime: "10:00",
      endTime: "11:00",
      purpose: "Group Study"
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log("✅ Booking Requested:", bookingRes.data);

    // 2. View my bookings
    const myBookings = await axios.get(`${API}/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("✅ My Bookings:", myBookings.data);

  } catch (err) {
    console.error("❌ Error:", err.response ? err.response.data : err.message);
  }
}

testBookings();
