const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("1. Deleting all dummy/sample photos from Photo table...");
  const deletedPhotos = await prisma.photo.deleteMany({});
  console.log(`Deleted ${deletedPhotos.count} photos.`);

  console.log("2. Updating all users to Chuka, Tharaka-Nithi...");
  const updateResult = await prisma.user.updateMany({
    data: {
      county: "Tharaka-Nithi",
      area: "Chuka",
      latitude: -0.3344,
      longitude: 37.6528,
      locationUpdatedAt: new Date(),
    },
  });
  console.log(`Updated ${updateResult.count} users.`);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      gender: true,
      county: true,
      area: true,
      latitude: true,
      longitude: true,
      photos: true,
    },
  });

  console.log("All accounts in database now:");
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
