const axios = require("axios");

const API = "http://localhost:5000/api/bookings";
const AUTH = "http://localhost:5000/api/auth";

async function testAdminBookings() {
  try {
    // Login as admin/official
    const loginRes = await axios.post(`${AUTH}/login`, {
      email: "admin@test.com",
      password: "123456"
    });
    const token = loginRes.data.token;

    // 1. Approve a booking
    const bookingId = "68af573188e706ac18892390"; // replace with real booking _id
    const approveRes = await axios.patch(`${API}/${bookingId}/status`,
      { status: "approved" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("✅ Booking Approved:", approveRes.data);

    // 2. Reject another booking
    const rejectRes = await axios.patch(`${API}/${bookingId}/status`,
      { status: "rejected" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("✅ Booking Rejected:", rejectRes.data);

  } catch (err) {
    console.error("❌ Error:", err.response ? err.response.data : err.message);
  }
}

testAdminBookings();
