import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stray-animal.go.th' },
    update: {},
    create: {
      email: 'admin@stray-animal.go.th',
      passwordHash: await bcrypt.hash('admin123', 12),
      displayName: 'ผู้ดูแลระบบ',
      role: 'ADMIN',
      district: 'บางกะปิ',
      consentGiven: true,
      consentDate: new Date(),
    },
  });

  // Create vet user
  const vet = await prisma.user.upsert({
    where: { email: 'vet@stray-animal.go.th' },
    update: {},
    create: {
      email: 'vet@stray-animal.go.th',
      passwordHash: await bcrypt.hash('vet123', 12),
      displayName: 'สพ.สมชาย',
      role: 'VET',
      district: 'วัฒนา',
      consentGiven: true,
      consentDate: new Date(),
    },
  });

  // Create citizen user
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@example.com' },
    update: {},
    create: {
      email: 'citizen@example.com',
      passwordHash: await bcrypt.hash('citizen123', 12),
      displayName: 'สมศรี ใจดี',
      role: 'CITIZEN',
      district: 'จตุจักร',
      consentGiven: true,
      consentDate: new Date(),
    },
  });

  console.log('  ✅ Users created');

  // Create sample animals
  const animals = await Promise.all([
    prisma.animal.create({
      data: {
        animalId: 'ANM-20240601-0001',
        type: 'DOG',
        name: 'น้องโก้',
        color: 'น้ำตาล',
        size: 'MEDIUM',
        gender: 'MALE',
        personality: 'เป็นมิตร ชอบเล่น',
        neutered: true,
        neuteredDate: new Date('2024-03-15'),
        earTipped: true,
        vaccinated: true,
        status: 'ADOPTABLE',
        latitude: 13.7563,
        longitude: 100.5018,
        district: 'บางกะปิ',
        registeredBy: admin.id,
      },
    }),
    prisma.animal.create({
      data: {
        animalId: 'ANM-20240601-0002',
        type: 'CAT',
        name: 'น้องส้ม',
        color: 'ส้ม',
        size: 'SMALL',
        gender: 'FEMALE',
        personality: 'ขี้อ้อน ชอบนอนตัก',
        neutered: true,
        neuteredDate: new Date('2024-02-20'),
        earTipped: true,
        vaccinated: true,
        status: 'ADOPTABLE',
        latitude: 13.7450,
        longitude: 100.5340,
        district: 'วัฒนา',
        registeredBy: admin.id,
      },
    }),
    prisma.animal.create({
      data: {
        animalId: 'ANM-20240601-0003',
        type: 'DOG',
        name: null,
        color: 'ดำ-ขาว',
        size: 'LARGE',
        gender: 'MALE',
        neutered: false,
        vaccinated: false,
        status: 'STRAY',
        latitude: 13.7800,
        longitude: 100.5500,
        district: 'จตุจักร',
        registeredBy: citizen.id,
      },
    }),
    prisma.animal.create({
      data: {
        animalId: 'ANM-20240601-0004',
        type: 'CAT',
        name: 'น้องขาว',
        color: 'ขาว',
        size: 'SMALL',
        gender: 'FEMALE',
        neutered: false,
        vaccinated: false,
        status: 'AWAITING_NEUTER',
        latitude: 13.7600,
        longitude: 100.4900,
        district: 'บางซื่อ',
        registeredBy: admin.id,
      },
    }),
    prisma.animal.create({
      data: {
        animalId: 'ANM-20240601-0005',
        type: 'DOG',
        name: 'ไมโล',
        color: 'ทอง',
        size: 'MEDIUM',
        gender: 'MALE',
        personality: 'สุขภาพดี ร่าเริง',
        neutered: true,
        earTipped: true,
        vaccinated: true,
        status: 'ADOPTED',
        latitude: 13.7400,
        longitude: 100.5100,
        district: 'วัฒนา',
        registeredBy: admin.id,
      },
    }),
    prisma.animal.create({
      data: {
        animalId: 'ANM-20240601-0006',
        type: 'DOG',
        name: null,
        color: 'เทา',
        size: 'SMALL',
        gender: 'UNKNOWN',
        neutered: false,
        vaccinated: false,
        status: 'STRAY',
        latitude: 13.7700,
        longitude: 100.5200,
        district: 'ลาดพร้าว',
        registeredBy: citizen.id,
      },
    }),
  ]);

  console.log(`  ✅ ${animals.length} animals created`);

  // Create sample reports
  const now = new Date();
  const reports = await Promise.all([
    prisma.report.create({
      data: {
        trackingId: 'RPT-20240601-0001',
        type: 'NEW_SIGHTING',
        description: 'พบสุนัขจรจัดฝูง 5 ตัว บริเวณหน้าตลาดนัดจตุจักร',
        latitude: 13.7999,
        longitude: 100.5533,
        district: 'จตุจักร',
        status: 'RECEIVED',
        reporterId: citizen.id,
        slaDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      },
    }),
    prisma.report.create({
      data: {
        trackingId: 'RPT-20240601-0002',
        type: 'INJURED',
        description: 'แมวบาดเจ็บขาหลังหัก อยู่ข้างร้านสะดวกซื้อ ซอยสุขุมวิท 23',
        latitude: 13.7380,
        longitude: 100.5650,
        district: 'วัฒนา',
        urgent: true,
        status: 'ASSIGNED',
        reporterId: citizen.id,
        slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.report.create({
      data: {
        trackingId: 'RPT-20240601-0003',
        type: 'AGGRESSIVE',
        description: 'สุนัขก้าวร้าว ไล่กัดคนเดินผ่าน หน้าวัดธาตุทอง',
        latitude: 13.7250,
        longitude: 100.5800,
        district: 'วัฒนา',
        urgent: true,
        status: 'RESOLVED',
        reporterId: citizen.id,
        slaDeadline: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`  ✅ ${reports.length} reports created`);

  // Create feeding station
  await prisma.feedingStation.create({
    data: {
      feederId: citizen.id,
      latitude: 13.7650,
      longitude: 100.5380,
      district: 'จตุจักร',
      feedingTime: '07:00, 18:00',
      animalCount: 8,
      isActive: true,
      lastCheckIn: new Date(),
    },
  });

  console.log('  ✅ Feeding station created');

  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('📝 Login credentials:');
  console.log('   Admin: admin@stray-animal.go.th / admin123');
  console.log('   Vet:   vet@stray-animal.go.th / vet123');
  console.log('   User:  citizen@example.com / citizen123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
