import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    autoConnect: false
});

export function connectSocket() {

    if (socket.connected) {
        return;
    }

    socket.auth = {
        token: sessionStorage.getItem("token")
    };

    socket.connect();
}

export function disconnectSocket() {
    socket.disconnect();
}

export default socket;