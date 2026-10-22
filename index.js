const express = require("express");
const http = require("http");
require("dotenv").config();
const PORT = process.env.PORT || 9110;
const app = express();
// Keep the raw bytes around — Razorpay webhook signatures are computed over
// the exact request body, which re-serialising req.body wouldn't reproduce.
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// ✅ Log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

const cors = require("cors");

app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization,x-user-data",
  }),
);

const fileUpload = require("express-fileupload");
app.use(
  fileUpload({
    limits: { fileSize: 100000000 },
  }),
);

// Mount all routes
app.use("/v1/api", require("./src/routes"));

// Health route
app.get("/", (req, res) => {
  res.send("Hello from main");
});

// 404 for any unmatched path — prevents silently returning 200 for mis-routed requests
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

// Wrapping in a plain http.Server (instead of app.listen) so Socket.IO can
// attach to the same port for real-time chat delivery.
const server = http.createServer(app);

const socket = require("./src/util/socket");
socket.initSocket(server);

const scheduler = require("./src/util/scheduler");
scheduler.start();

// ✅ Start the server
server.listen(PORT, () => {
  console.log("service listening on port " + PORT);
});
