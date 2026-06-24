require("dotenv").config();

const http = require("http");

const { Server } =
require("socket.io");

const app =
require("./app");

const connectDB =
require("./config/db");

const validateEnv =
require("./config/validateEnv");

const authenticateSocket =
require("./socket/authSocket");

const PORT =
process.env.PORT || 5000;

/*
  Validate Environment Variables
*/
validateEnv();

/*
  Create HTTP Server
*/
const server =
http.createServer(app);

/*
  Attach Socket.IO
*/
const io =
new Server(server, {

  cors: {
    origin: "*"
  }

});

app.set("io",io);

/*
  Socket Authentication
*/
io.use(
  authenticateSocket
);

/*
  User Connection
*/
io.on(
  "connection",

  (socket) => {

    console.log(
      "User Connected:",
      socket.id
    );

    /*
      SESSION EVENTS
    */
    require(
      "./socket/sessionSocket"
    )(
      io,
      socket
    );

    /*
      HEARTBEAT EVENTS
    */
    require(
      "./socket/heartbeatSocket"
    )(
      io,
      socket
    );

    /*
      CHECK-IN EVENTS
    */
    require(
      "./socket/checkInSocket"
    )(
      io,
      socket
    );

    socket.on(

      "disconnect",

      () => {

        console.log(
          "User Disconnected:",
          socket.id
        );

      }

    );

  }

);

/*
  Start Server
*/
const startServer =
async () => {

  try {

    await connectDB();

    server.listen(

      PORT,

      () => {

        console.log(
          `Server running on port ${PORT}`
        );

      }

    );

  } catch (error) {

    console.error(
      "Server Startup Failed:",
      error
    );

    process.exit(1);

  }

};

startServer();

/*
  APPLICATION FLOW

  Load ENV
        ↓
  Validate ENV
        ↓
  Connect Database
        ↓
  Start HTTP Server
        ↓
  Attach Socket.IO
        ↓
  Authenticate Sockets
        ↓
  Register Socket Modules
        ↓
  Accept Requests

  ------------------------

  SOCKET FLOW

  Client Connects
        ↓
  JWT Authentication
        ↓
  Session Events
        ↓
  Heartbeat Tracking
        ↓
  Check-In Events
        ↓
  Focus Engine
        ↓
  Real-Time Behavioral Logic

  ------------------------

  SERVER RESPONSIBILITIES

  Express:
  - REST APIs
  - Authentication
  - Analytics
  - Scheduling

  Socket.IO:
  - Real-time focus lifecycle
  - Presence tracking
  - Heartbeats
  - Session check-ins
  - Recovery workflows

  The backend remains
  the authoritative source
  of truth for focus state.
*/