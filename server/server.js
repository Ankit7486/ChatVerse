require("dotenv").config();
const jwt = require("jsonwebtoken");
const http = require("http");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const statusRoutes = require("./routes/statusRoutes");
const messageRoutes = require("./routes/messageRoutes");
const aiRoutes = require("./routes/aiRoutes");
const pollRoutes = require("./routes/pollRoutes");

connectDB();    // Connects to MongoDB

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(authRoutes);
app.use(userRoutes);
app.use(chatRoutes);
app.use(messageRoutes);
app.use(statusRoutes);
app.use("/ai",aiRoutes);
app.use(pollRoutes);

const { Server } = require("socket.io");

const io = new Server(server, {
    cors: {
        origin: "https://chat-verse-eta.vercel.app",
        methods: ["GET", "POST"]
    }
});

app.set("io", io);
const onlineUsers = new Map();

app.use((req, res, next) => {
    req.io = io;
    next();
});

io.use((socket, next) => {

    try {

        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(
                new Error("Authentication required")
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.userId = decoded.id.toString();

        next();

    } catch (error) {

        next(
            new Error("Invalid socket token")
        );

    }

});

io.on("connection", async (socket) => {

    console.log(
        "Socket connected:",
        socket.id
    );

    const userId = socket.userId;

     // User is online
    await User.findByIdAndUpdate(
        userId,
        {
            lastSeen: null
        }
    );

    // ONLINE
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }

    onlineUsers
        .get(userId)
        .add(socket.id);

    io.emit(
        "onlineUsers",
        Array.from(onlineUsers.keys())
    );


    // JOIN CHAT
    socket.on("joinChat", (chatId) => {

        if (!chatId) return;

        socket.join(chatId.toString());

        console.log(
            `${socket.id} joined ${chatId}`
        );

    });


    // LEAVE CHAT
    socket.on("leaveChat", (chatId) => {

        if (!chatId) return;

        socket.leave(chatId.toString());

    });


    // TYPING
    socket.on("typing", (chatId) => {

        socket.to(chatId).emit(
            "typing",
            {
                chatId,
                userId
            }
        );

    });


    // STOP TYPING
    socket.on("stopTyping", (chatId) => {

        socket.to(chatId).emit(
            "stopTyping",
            {
                chatId,
                userId
            }
        );

    });

    // =========================
// VOICE / VIDEO CALL SIGNALING
// =========================

socket.on(
    "call:offer",
    ({ to, offer, callType }) => {

        if (!to || !offer) {
            return;
        }

        const targetSockets =
            onlineUsers.get(
                to.toString()
            );

        if (!targetSockets) {
            return;
        }

        targetSockets.forEach(
            (socketId) => {

                io.to(socketId).emit(
                    "call:incoming",
                    {
                        from: userId,
                        offer,
                        callType
                    }
                );

            }
        );
    }
);


socket.on(
    "call:answer",
    ({ to, answer }) => {

        if (!to || !answer) {
            return;
        }

        const targetSockets =
            onlineUsers.get(
                to.toString()
            );

        if (!targetSockets) {
            return;
        }

        targetSockets.forEach(
            (socketId) => {

                io.to(socketId).emit(
                    "call:answered",
                    {
                        from: userId,
                        answer
                    }
                );

            }
        );
    }
);


socket.on(
    "call:ice-candidate",
    ({ to, candidate }) => {

        if (!to || !candidate) {
            return;
        }

        const targetSockets =
            onlineUsers.get(
                to.toString()
            );

        if (!targetSockets) {
            return;
        }

        targetSockets.forEach(
            (socketId) => {

                io.to(socketId).emit(
                    "call:ice-candidate",
                    {
                        from: userId,
                        candidate
                    }
                );

            }
        );
    }
);


socket.on(
    "call:reject",
    ({ to }) => {

        if (!to) {
            return;
        }

        const targetSockets =
            onlineUsers.get(
                to.toString()
            );

        if (!targetSockets) {
            return;
        }

        targetSockets.forEach(
            (socketId) => {

                io.to(socketId).emit(
                    "call:rejected",
                    {
                        from: userId
                    }
                );

            }
        );
    }
);


socket.on(
    "call:end",
    ({ to }) => {

        if (!to) {
            return;
        }

        const targetSockets =
            onlineUsers.get(
                to.toString()
            );

        if (!targetSockets) {
            return;
        }

        targetSockets.forEach(
            (socketId) => {

                io.to(socketId).emit(
                    "call:ended",
                    {
                        from: userId
                    }
                );

            }
        );
    }
);

    socket.on("messageEdited", (message) => {

    if (!message?.chat?._id) return;

    io.to(message.chat._id.toString()).emit(
        "messageEdited",
        message
    );

    });
   
    socket.on("messageDeleted", (message) => {

    if (!message?.chat?._id) return;

    io.to(message.chat._id.toString()).emit(
        "messageDeleted",
        message
    );

    });


    // DISCONNECT
    socket.on("disconnect", async () => {

        const sockets =
            onlineUsers.get(userId);

        if (sockets) {

            sockets.delete(socket.id);

            if (sockets.size === 0) {
                onlineUsers.delete(userId);

                await User.findByIdAndUpdate(
                userId,
                {
                    lastSeen: new Date()
                }
            );
            }
        }

        io.emit(
            "onlineUsers",
            Array.from(onlineUsers.keys())
        );

        console.log(
            "Socket disconnected:",
            socket.id
        );

    });


});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});