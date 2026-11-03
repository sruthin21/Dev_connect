
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock Prisma methods
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    room: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
  },
}));

// Mock PrismaClient
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => prismaMock),
}));

// Import Express app after mocking Prisma
import { app } from './server.js';

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================
// GET /api/users
// =====================================================

describe('GET /api/users', () => {
  it('should return all users', async () => {
    const users = [
      {
        id: 'user1',
        username: 'sruthin',
        email: 'sruthin@example.com',
        isOnline: true,
        lastSeen: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user2',
        username: 'teja',
        email: 'teja@example.com',
        isOnline: false,
        lastSeen: null,
        createdAt: new Date().toISOString(),
      },
    ];

    prismaMock.user.findMany.mockResolvedValue(users);

    const response = await request(app)
      .get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].username).toBe('sruthin');
    expect(response.body[1].username).toBe('teja');

    expect(prismaMock.user.findMany).toHaveBeenCalled();
  });

  it('should return an empty array when no users exist', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return 500 if fetching users fails', async () => {
    prismaMock.user.findMany.mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .get('/api/users');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Failed to fetch users'
    );
  });
});

// =====================================================
// POST /api/users
// =====================================================

describe('POST /api/users', () => {
  it('should create a new user', async () => {
    const user = {
      id: 'user1',
      username: 'sruthin',
      email: 'sruthin@example.com',
      isOnline: true,
    };

    prismaMock.user.create.mockResolvedValue(user);

    const response = await request(app)
      .post('/api/users')
      .send({
        username: 'sruthin',
        email: 'sruthin@example.com',
      });

    expect(response.status).toBe(201);
    expect(response.body.username).toBe('sruthin');
    expect(response.body.email).toBe(
      'sruthin@example.com'
    );
    expect(response.body.isOnline).toBe(true);

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        username: 'sruthin',
        email: 'sruthin@example.com',
        isOnline: true,
      },
    });
  });

  it('should return 400 if username is missing', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'sruthin@example.com',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Username and email are required'
    );

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('should return 400 if email is missing', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        username: 'sruthin',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Username and email are required'
    );

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('should return 400 if both fields are missing', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Username and email are required'
    );
  });

  it('should return 400 for duplicate username or email', async () => {
    const error = new Error('Unique constraint failed');
    error.code = 'P2002';

    prismaMock.user.create.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/users')
      .send({
        username: 'sruthin',
        email: 'sruthin@example.com',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Username or email already exists'
    );
  });

  it('should return 500 if user creation fails', async () => {
    prismaMock.user.create.mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .post('/api/users')
      .send({
        username: 'sruthin',
        email: 'sruthin@example.com',
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Failed to create user'
    );
  });
});

// =====================================================
// GET /api/rooms
// =====================================================

describe('GET /api/rooms', () => {
  it('should return all chat rooms', async () => {
    const rooms = [
      {
        id: 'room1',
        name: 'General',
        description: 'General chat',
        participants: [
          {
            id: 'user1',
            username: 'sruthin',
            isOnline: true,
          },
        ],
        messages: [],
      },
    ];

    prismaMock.room.findMany.mockResolvedValue(rooms);

    const response = await request(app)
      .get('/api/rooms');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('General');
    expect(response.body[0].participants).toHaveLength(1);
  });

  it('should return an empty array when no rooms exist', async () => {
    prismaMock.room.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/rooms');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return 500 if fetching rooms fails', async () => {
    prismaMock.room.findMany.mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .get('/api/rooms');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Failed to fetch rooms'
    );
  });
});

// =====================================================
// POST /api/rooms
// =====================================================

describe('POST /api/rooms', () => {
  it('should create a new chat room', async () => {
    const room = {
      id: 'room1',
      name: 'General',
      description: 'General chat',
      createdById: 'user1',
      participants: [
        {
          id: 'user1',
          username: 'sruthin',
          isOnline: true,
        },
      ],
    };

    prismaMock.room.create.mockResolvedValue(room);

    const response = await request(app)
      .post('/api/rooms')
      .send({
        name: 'General',
        description: 'General chat',
        createdById: 'user1',
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('General');
    expect(response.body.createdById).toBe('user1');

    expect(prismaMock.room.create).toHaveBeenCalledWith({
      data: {
        name: 'General',
        description: 'General chat',
        createdById: 'user1',
        participants: {
          connect: {
            id: 'user1',
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            isOnline: true,
          },
        },
      },
    });
  });

  it('should return 400 if room name is missing', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({
        createdById: 'user1',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Room name and creator ID are required'
    );
  });

  it('should return 400 if creator ID is missing', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({
        name: 'General',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Room name and creator ID are required'
    );
  });

  it('should return 500 if room creation fails', async () => {
    prismaMock.room.create.mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .post('/api/rooms')
      .send({
        name: 'General',
        createdById: 'user1',
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Failed to create room'
    );
  });
});

// =====================================================
// POST /api/rooms/:roomId/join
// =====================================================

describe('POST /api/rooms/:roomId/join', () => {
  it('should allow a user to join a room', async () => {
    const room = {
      id: 'room1',
      name: 'General',
      participants: [
        {
          id: 'user1',
          username: 'sruthin',
          isOnline: true,
        },
      ],
    };

    prismaMock.room.update.mockResolvedValue(room);

    const response = await request(app)
      .post('/api/rooms/room1/join')
      .send({
        userId: 'user1',
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('room1');
    expect(response.body.participants).toHaveLength(1);

    expect(prismaMock.room.update).toHaveBeenCalledWith({
      where: {
        id: 'room1',
      },
      data: {
        participants: {
          connect: {
            id: 'user1',
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            isOnline: true,
          },
        },
      },
    });
  });

  it('should return 400 if user ID is missing', async () => {
    const response = await request(app)
      .post('/api/rooms/room1/join')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'User ID is required'
    );

    expect(prismaMock.room.update).not.toHaveBeenCalled();
  });

  it('should return 500 if joining room fails', async () => {
    prismaMock.room.update.mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .post('/api/rooms/room1/join')
      .send({
        userId: 'user1',
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Failed to join room'
    );
  });
});

// =====================================================
// GET /api/rooms/:roomId/messages
// =====================================================

describe('GET /api/rooms/:roomId/messages', () => {
  it('should return messages in chronological order', async () => {
    const messages = [
      {
        id: 'message2',
        content: 'Second message',
        sender: {
          id: 'user1',
          username: 'sruthin',
        },
      },
      {
        id: 'message1',
        content: 'First message',
        sender: {
          id: 'user2',
          username: 'teja',
        },
      },
    ];

    prismaMock.message.findMany.mockResolvedValue(messages);

    const response = await request(app)
      .get('/api/rooms/room1/messages');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    // The API reverses the database result
    expect(response.body[0].content).toBe('First message');
    expect(response.body[1].content).toBe('Second message');
  });

  it('should return an empty array if no messages exist', async () => {
    prismaMock.message.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/rooms/room1/messages');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should support pagination', async () => {
    prismaMock.message.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/rooms/room1/messages?page=2&limit=10');

    expect(response.status).toBe(200);

    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          roomId: 'room1',
        },
        skip: 10,
        take: 10,
      })
    );
  });

  it('should use default pagination values', async () => {
    prismaMock.message.findMany.mockResolvedValue([]);

    await request(app)
      .get('/api/rooms/room1/messages');

    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 50,
      })
    );
  });

  it('should return 500 if fetching messages fails', async () => {
    prismaMock.message.findMany.mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .get('/api/rooms/room1/messages');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Failed to fetch messages'
    );
  });
});

// =====================================================
// GET /health
// =====================================================

describe('GET /health', () => {
  it('should return server health status', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();

    expect(
      new Date(response.body.timestamp).toISOString()
    ).toBe(response.body.timestamp);
  });
});
