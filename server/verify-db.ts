import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('=== TaskForge Auth System - Database Verification ===\n');

  // Check users
  const users = await prisma.user.findMany();
  console.log(`👥 Total Users: ${users.length}`);
  if (users.length > 0) {
    console.log('User Records:');
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} (${user.name}) - Active: ${user.isActive}`);
    });
  }

  // Check sessions
  const sessions = await prisma.session.findMany();
  console.log(`\n🔑 Active Sessions: ${sessions.length}`);
  if (sessions.length > 0) {
    console.log('Session Records:');
    sessions.forEach((session, i) => {
      console.log(`  ${i + 1}. User: ${session.userId} - Expires: ${session.expiresAt}`);
    });
  }

  await prisma.$disconnect();
}

verifyDatabase().catch(console.error);
