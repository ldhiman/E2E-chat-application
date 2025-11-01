// app.js
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const authRoutes = require("./routes/auth_routes");
const deviceRoutes = require("./routes/device_routes");
const messageRoutes = require("./routes/messages_routes");
const userRoutes = require("./routes/user_routes");
const { authenticate } = require("./middleware/auth");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS
app.use(
  cors({
     origin: [
      "http://localhost:3001",         // local development
      "https://e2e-chat-frontend.vercel.app" // deployed frontend
    ],
    credentials: true, // if you plan to send cookies or auth headers
  })
);

app.use(express.json());

// Use authentication routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/devices", authenticate, deviceRoutes);
app.use("/api/v1/messages", authenticate, messageRoutes);
app.use("/api/v1/users", authenticate, userRoutes);
// Define a simple route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
