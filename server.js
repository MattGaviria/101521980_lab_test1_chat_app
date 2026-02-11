require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const GroupMessege = require('./models/GroupMessage');
const PrivateMessage = require('./models/PrivateMessage');
const http = require("http");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

//front-end
app.use("/public", express.static('public'));
app.get('/', (req, res) => res.redirect("/public/view/login.html"));

//api
app.use('/api/auth', authRoutes);

const server = http.createServer(app);
const io = require('socket.io')(server);

// Chat Rooms
const ROOMS = ['General', 'Sports', 'Games', 'Music'];

io.on('connection', (socket) => {
    socket.data.username = null;
    socket.data.room = null;

    socket.emit("rooms:list", ROOMS);

    socket.on("user:set", (username) => {
        socket.data.username = username;
    });

    socket.on("room:join", async (room) => {
        if (!ROOMS.includes(room)) return;

        if (socket.data.room) socket.leave(socket.data.room);

        socket.data.room = room;
        socket.join(room);

        const history = await GroupMessege.find({room}).sort({date_sent: 1, _id: -1}).limit(50);
        socket.emit("room:history", history);
    });

    socket.on('room:leave', () => {
        if (!socket.data.room) return;
        socket.leave(socket.data.room);
        socket.data.room = null;
        socket.emit("room:left");
    });

    socket.on("room:message", async (text) => {
        const room = socket.data.room;
        const from_user = socket.data.username;
        if (!room || !from_user || !text) return;

        const doc = await GroupMessege.create({from_user, room, message: text});
        io.to(room).emit("room:message", doc);
    });

    socket.on("pm:message", async ({to_user, message}) => {
        const from_user = socket.data.username;
        if (!from_user || !to_user || !message) return;

        const doc = await PrivateMessage.create({from_user, to_user, message});
    
        socket.emit("pm:message", doc);

        io.sockets.sockets.forEach(s => {
            if (s.data.username === to_user) {
                s.emit("pm:message", doc);
            }
        });

    });

    socket.on("pm:typing", ({to_user, typing}) => {
        const from_user = socket.data.username;
        if (!from_user || !to_user) return;

        io.sockets.sockets.forEach(s => {
            if (s.data.username === to_user) {
                s.emit("pm:typing", { from_user, typing: !!typing });
            }
        });
    });
});



async function start()  {
    try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}





start();