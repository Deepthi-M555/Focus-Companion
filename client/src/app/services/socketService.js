import { io } from "socket.io-client";
import { getToken } from "../utils/token";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, { autoConnect: false });

export function connectSocket() {
    if (socket.connected) return;
    const token = getToken();
    socket.auth = { token };
    socket.connect();
}

export function disconnectSocket() {
    socket.disconnect();
}

export default socket;
