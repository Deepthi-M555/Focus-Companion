require("dotenv").config();

const http = require("http");

const { Server } =
require("socket.io");

const app = require("./app");

const connectDB = require("./config/db");

const authenticateSocket = require("./socket/authSocket");

const PORT = process.env.PORT || 5000;

const validateEnv = require("./config/validateEnv");
/*
  Create HTTP Server
*/
const server = http.createServer(app);

/*
  Attach Socket.IO
*/
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/*
  Socket Authentication
*/
io.use(authenticateSocket);

/*
  User Connection
*/
io.on("connection", (socket) => {

  console.log(
    "User Connected:",
    socket.id
  );

  /*
    SESSION SOCKET EVENTS
  */
  require("./socket/sessionSocket")(
    io,
    socket
  );
  require("./socket/heartbeatSocket")(
    io,
    socket
  );

  socket.on("disconnect", () => {

    console.log(
      "User Disconnected:",
      socket.id
    );

  });

});

validateEnv();

const startServer = async () => {

  try {

    await connectDB();

    server.listen(PORT, () => {

      console.log(
        `Server running on port ${PORT}`
      );

    });

  } catch (error) {

    console.error(error);

  }
};

startServer();


// Load ENV
// ↓
// Connect Database
// ↓
// Start Express Server
// ↓
// Accept Requests

// HTTP Server
// ↓
// Express API
// +
// Socket.IO Real-Time Layer