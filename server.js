var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);

// Serve the home screen (multiplayer home page)
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'home.html')); // Serving home screen (home.html)
});

// Serve the math game (game page)
app.get('/game', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html')); // Serve the game page (index.html)
});

// Serve static files (game assets)
app.use('/static', express.static(path.join(__dirname, 'static')));

// Store player data
var players = {};

// Define a function to generate random math questions
function generateMathQuestion() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operation = Math.random() < 0.5 ? '+' : '-';
  let answer = 0;

  if (operation === '+') {
    answer = num1 + num2;
  } else {
    answer = num1 - num2;
  }

  return {
    question: `${num1} ${operation} ${num2}`,
    correctAnswer: answer
  };
}

// Handle new player connection
io.on('connection', function(socket) {
  console.log('A player connected:', socket.id);

  // Add player to the list
  players[socket.id] = { score: 0, currentQuestion: generateMathQuestion() };

  // Send the current question to the new player
  socket.emit('newQuestion', players[socket.id].currentQuestion);

  // Handle player's answer submission
  socket.on('submitAnswer', function(answer) {
    const player = players[socket.id];

    if (parseInt(answer) === player.currentQuestion.correctAnswer) {
      player.score += 10;
    }

    player.currentQuestion = generateMathQuestion();
    socket.emit('newQuestion', player.currentQuestion);
    io.emit('scoreUpdate', players);
  });

  // Handle player disconnect
  socket.on('disconnect', function() {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('scoreUpdate', players);
  });
});

// Start the server
server.listen(5000, function() {
  console.log('Server running on port 5000');
});
