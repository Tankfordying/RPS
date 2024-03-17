// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('setUsername', (username) => {
        users[socket.id] = { username: username, socket: socket, choice: null };
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        delete users[socket.id];
    });

    socket.on('play', (choice) => {
        const userSocketId = socket.id;
        const opponentId = Object.keys(users).find(id => id !== userSocketId);

        users[userSocketId].choice = choice;

        if (opponentId && users[opponentId].choice !== null) {
            const userChoice = users[userSocketId].choice;
            const opponentChoice = users[opponentId].choice;
            let result;

            if (userChoice === opponentChoice) {
                result = "It's a tie!";
            } else if ((userChoice === 'rock' && opponentChoice === 'scissors') ||
                    (userChoice === 'paper' && opponentChoice === 'rock') ||
                    (userChoice === 'scissors' && opponentChoice === 'paper')) {
                result = `${users[userSocketId].username} wins!`;
            } else {
                result = `${users[opponentId].username} wins!`;
            }

            io.to(userSocketId).emit('opponentPlayed', { choice: opponentChoice, result: result, username: users[opponentId].username });
            io.to(opponentId).emit('opponentPlayed', { choice: userChoice, result: result, username: users[userSocketId].username });

            // Reset choices for the next round
            users[userSocketId].choice = null;
            users[opponentId].choice = null;
        }
    });
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
