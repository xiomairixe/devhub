const express   = require('express');
const cors      = require('cors');
const dotenv    = require('dotenv');
const http      = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);   // wrap express in http server for Socket.io

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://devhub-liard.vercel.app'
];

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

// Store io on app so routes can emit events via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  // Client joins a room by projectId or their userId (for direct messages)
  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('leave_room', (room) => {
    socket.leave(room);
  });

  socket.on('disconnect', () => {});
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/clients',   require('./routes/clients'));
app.use('/api/projects',  require('./routes/projects'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/messages',  require('./routes/messages'));

app.get('/', (req, res) => res.send('DevHub API running'));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));