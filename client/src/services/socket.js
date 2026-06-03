import { io }
from "socket.io-client";

const socket = io(
  "http://localhost:5000"
);

// socket.on("connect", () => {

//   console.log(
//     "Socket Connected:",
//     socket.id
//   );

// });

setInterval(() => {

  socket.emit("heartbeat");

  console.log(
    "Heartbeat Sent"
  );

}, 30000);

export default socket;