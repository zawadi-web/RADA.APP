const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      gender: true,
      interestedInGenders: true,
      county: true,
      area: true,
      latitude: true,
      longitude: true,
      photos: {
        select: {
          id: true,
          url: true,
          isPrimary: true,
          order: true,
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      users.map((u) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        gender: u.gender,
        interestedIn: u.interestedInGenders,
        county: u.county,
        area: u.area,
        lat: u.latitude,
        lng: u.longitude,
        photosCount: u.photos.length,
        photos: u.photos.map((p) => ({
          id: p.id,
          order: p.order,
          isPrimary: p.isPrimary,
          urlPrefix: p.url ? p.url.slice(0, 100) : "EMPTY",
          urlLength: p.url ? p.url.length : 0,
        })),
      })),
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
