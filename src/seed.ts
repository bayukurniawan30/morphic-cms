import { db } from './db/index.js';
import { users } from './db/schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding default super admin user...');
  
  const email = 'baycore.dev@gmail.com';
  const rawPassword = 'secret123';
  
  // Hash the password with bcrypt (cost factor 10)
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  try {
    const [user] = await db.insert(users).values({
      email: email,
      username: 'superadmin', // Username is required and unique
      password: hashedPassword,
      role: 'super_admin'
    }).returning();
    
    console.log(`✅ Super admin created successfully!`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
  } catch (err: any) {
    if (err.code === '23505') { // Postgres unique violation error code
      console.log('⚠️ Super admin user already exists. Skipping seed.');
    } else {
      console.error('❌ Failed to seed super admin:', err);
    }
  }
  
  process.exit(0);
}

seed();
