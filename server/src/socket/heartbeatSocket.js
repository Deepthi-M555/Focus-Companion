const activeUsers =
new Map();

module.exports =
(io, socket) => {

  activeUsers.set(
    socket.identity.userId,
    Date.now()
  );

  socket.on(
    "heartbeat",

    () => {

      activeUsers.set(

        socket.identity.userId,

        Date.now()

      );

    }
  );

  socket.on(
    "disconnect",

    () => {

      activeUsers.delete(
        socket.identity.userId
      );

    }
  );

};