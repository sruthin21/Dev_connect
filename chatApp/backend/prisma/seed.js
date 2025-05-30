import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'alice',
        email: 'alice@example.com',
        isOnline: true
      }
    }),
    prisma.user.create({
      data: {
        username: 'bob',
        email: 'bob@example.com',
        isOnline: false
      }
    }),
    prisma.user.create({
      data: {
        username: 'charlie',
        email: 'charlie@example.com',
        isOnline: true
      }
    })
  ]);

  console.log('✅ Created users:', users.map(u => u.username));

  // Create sample rooms
  const generalRoom = await prisma.room.create({
    data: {
      name: 'General',
      description: 'General discussion room',
      createdById: users[0].id,
      participants: {
        connect: users.map(user => ({ id: user.id }))
      }
    }
  });

  const techRoom = await prisma.room.create({
    data: {
      name: 'Tech Talk',
      description: 'Discuss technology and programming',
      createdById: users[1].id,
      participants: {
        connect: [{ id: users[0].id }, { id: users[1].id }]
      }
    }
  });

  console.log('✅ Created rooms:', [generalRoom.name, techRoom.name]);

  // Create sample messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        content: 'Welcome to the general chat room!',
        senderId: users[0].id,
        roomId: generalRoom.id,
        messageType: 'SYSTEM'
      }
    }),
    prisma.message.create({
      data: {
        content: 'Hello everyone! 👋',
        senderId: users[0].id,
        roomId: generalRoom.id
      }
    }),
    prisma.message.create({
      data: {
        content: 'Hey Alice! How are you doing?',
        senderId: users[1].id,
        roomId: generalRoom.id
      }
    }),
    prisma.message.create({
      data: {
        content: 'Welcome to Tech Talk! Let\'s discuss the latest in technology.',
        senderId: users[1].id,
        roomId: techRoom.id,
        messageType: 'SYSTEM'
      }
    }),
    prisma.message.create({
      data: {
        content: 'Has anyone tried the new JavaScript features in ES2024?',
        senderId: users[0].id,
        roomId: techRoom.id
      }
    })
  ]);

  console.log('✅ Created messages:', messages.length);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });