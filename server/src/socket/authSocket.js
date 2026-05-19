const jwt =
require("jsonwebtoken");

module.exports =
(socket, next) => {

  try {

    const token =
      socket.handshake.auth.token;

    if (!token) {
      return next(
        new Error("Unauthorized")
      );
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    socket.user = decoded;

    next();

  } catch (error) {

    next(
      new Error("Invalid Token")
    );

  }
};




// WHAT IS HAPPENING?

// During socket connection:

// Client sends JWT
// ↓
// Socket verifies identity
// ↓
// Socket becomes authenticated

// Now:
// real-time layer becomes secure.

// VERY important.

// UPDATE server.js

// Add:

// const authenticateSocket =
// require("./socket/authSocket");

// io.use(authenticateSocket);

// BEFORE:

// io.on("connection")