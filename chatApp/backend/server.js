import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// REST API Routes

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        isOnline: true
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Get all chat rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            isOnline: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                username: true
              }
            }
          }
        }
      }
    });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create a new chat room
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, description, createdById } = req.body;
    
    if (!name || !createdById) {
      return res.status(400).json({ error: 'Room name and creator ID are required' });
    }

    const room = await prisma.room.create({
      data: {
        name,
        description,
        createdById,
        participants: {
          connect: { id: createdById }
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            isOnline: true
          }
        }
      }
    });
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Join a room
app.post('/api/rooms/:roomId/join', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        participants: {
          connect: { id: userId }
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            isOnline: true
          }
        }
      }
    });
    
    res.json(room);
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Get messages for a room
app.get('/api/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    });
    
    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins a room
  socket.on('join_room', async (data) => {
    try {
      const { roomId, userId } = data;
      socket.join(roomId);
      
      // Update user online status
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true }
      });
      
      // Notify others in the room
      socket.to(roomId).emit('user_joined', {
        userId,
        message: 'User joined the room'
      });
      
      console.log(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle new messages
  socket.on('send_message', async (data) => {
    try {
      const { roomId, senderId, content, messageType = 'TEXT' } = data;
      
      // Save message to database
      const message = await prisma.message.create({
        data: {
          content,
          messageType,
          senderId,
          roomId
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true
            }
          }
        }
      });
      
      // Broadcast message to all users in the room
      io.to(roomId).emit('new_message', message);
      
      console.log(`Message sent in room ${roomId}:`, content);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { roomId, userId, username } = data;
    socket.to(roomId).emit('user_typing', { userId, username });
  });

  socket.on('typing_stop', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('user_stopped_typing', { userId });
  });

  // Handle user leaving room
  socket.on('leave_room', async (data) => {
    try {
      const { roomId, userId } = data;
      socket.leave(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit('user_left', {
        userId,
        message: 'User left the room'
      });
      
      console.log(`User ${userId} left room ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Note: In a production app, you'd want to track which user this socket belongs to
    // and update their online status accordingly
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

