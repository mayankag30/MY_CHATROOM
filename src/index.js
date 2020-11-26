const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersRoom } = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server); // Server supports web sockets

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log("New Web Socket Connection")

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options });

        if (error) {
            return callback(error);
        }

        socket.join(user.room)

        socket.emit('message', generateMessage("ADMIN", 'WELCOME FORKS!')); // to emit to that particular connection
        socket.broadcast.to(user.room).emit('message', generateMessage("ADMIN", `${user.username} has joined`)); // to emit to everyone except that particular connection
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersRoom(user.room),
        });

        callback();
        // io.to.emit -> emit an event to everyone in a room
        // socket.broadcast.to.emit => seding an event to everyone except the connection particular to a room
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message)); // to emit to everyone
        callback();
    });

    // SHARING YOUR LOCATIONS
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.lat},${coords.long}`));

        // Sending back the acknowledgment
        callback();
    });

    // When a user diconnects
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage("ADMIN", `${user.username} has left!`));
            
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersRoom(user.room),
            });
        }
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

// server (emit) -> client(recieve) - countUpdated
// client (emit) -> server(recieve) - increment

