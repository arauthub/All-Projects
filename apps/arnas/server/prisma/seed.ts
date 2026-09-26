import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { storageService } from '../src/services/storage.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ARNAS database seeding...');

  // Ensure storage folder hierarchy exists
  await storageService.init();

  // Create or retrieve default family
  let family = await prisma.family.findFirst({
    where: { name: 'Raut Family' },
  });

  if (!family) {
    family = await prisma.family.create({
      data: {
        name: 'Raut Family',
      },
    });
    console.log(`✅ Created family: ${family.name} (${family.id})`);
  }

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'abhijeet@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: 'Abhijeet Raut',
      passwordHash,
      role: Role.ADMIN,
      familyId: family.id,
      storageQuotaBytes: BigInt(107374182400), // 100 GB
    },
  });

  console.log(`✅ Admin user seeded: ${adminUser.email} (${adminUser.id})`);

  // Ensure disk directories exist for this user & family
  await storageService.ensureMemberDirs(family.id, adminUser.id);

  // Create Shared Family Vault folder root record in DB if not present
  const sharedVault = await prisma.fileItem.findFirst({
    where: {
      familyId: family.id,
      isSharedVault: true,
      parentFolderId: null,
    },
  });

  if (!sharedVault) {
    await prisma.fileItem.create({
      data: {
        name: 'Family Shared Vault',
        isDirectory: true,
        isSharedVault: true,
        familyId: family.id,
        userId: adminUser.id,
      },
    });
    console.log('✅ Created root Family Shared Vault folder record');
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
