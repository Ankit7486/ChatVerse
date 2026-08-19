import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
});

export const connectSocket = () => {

    const token = localStorage.getItem("token");

    if (!token) {
        return false;
    }

    socket.auth = {
        token
    };

    if (!socket.connected) {
        socket.connect();
    }

    return true;
};

export default socket;