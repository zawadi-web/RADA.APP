const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Premium curated portrait URLs for African/Kenyan profiles
const SAMPLE_WOMAN_PHOTOS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
];

const SAMPLE_MAN_PHOTOS = [
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
];

async function main() {
  console.log("Cleaning up base64 bloat and duplicate users...");

  // 1. Find all photos that have base64 data URLs
  const base64Photos = await prisma.photo.findMany({
    where: {
      url: { startsWith: "data:image" },
    },
    include: {
      user: true,
    },
  });

  console.log(`Found ${base64Photos.length} base64 photos.`);

  for (const photo of base64Photos) {
    const isWoman = photo.user?.gender === "WOMAN";
    const replacementPool = isWoman ? SAMPLE_WOMAN_PHOTOS : SAMPLE_MAN_PHOTOS;
    const replacementUrl = replacementPool[photo.order % replacementPool.length];

    await prisma.photo.update({
      where: { id: photo.id },
      data: { url: replacementUrl },
    });
  }

  // 2. Remove duplicate test users created with dummy emails, keep the main accounts
  // Main accounts to keep:
  // - cmv18o5p000003886mvrxjnji (Baby Myrah - myrahb43@gmail.com)
  // - cmv46w5tk000s3hmd24pxcct4 (Oino Oino - ooino57@gmail.com)
  // - cmv2efxtx0008ejkt8moqkamz (Gift Mukhwana - giftmukhwana@gmail.com)
  const dummyUsers = await prisma.user.findMany({
    where: {
      email: { startsWith: "user_179" },
    },
    select: { id: true, email: true, fullName: true },
  });

  console.log(`Found ${dummyUsers.length} dummy test accounts from onboarding runs.`);
  for (const u of dummyUsers) {
    // Delete their likes, matches, and photos first
    await prisma.like.deleteMany({ where: { OR: [{ senderId: u.id }, { receiverId: u.id }] } });
    await prisma.match.deleteMany({ where: { OR: [{ user1Id: u.id }, { user2Id: u.id }] } });
    await prisma.photo.deleteMany({ where: { userId: u.id } });
    await prisma.prompt.deleteMany({ where: { userId: u.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
  }

  // 3. Make sure Baby Myrah has valid photos (not just the Google letter avatar)
  const babyUser = await prisma.user.findUnique({
    where: { id: "cmv18o5p000003886mvrxjnji" },
    include: { photos: true },
  });

  if (babyUser) {
    console.log("Baby Myrah user found, county:", babyUser.county, "photos:", babyUser.photos.length);
    // If only has 1 Google avatar photo, add high-quality photos
    const hasOnlyGoogle = babyUser.photos.every((p) => p.url.includes("googleusercontent.com"));
    if (hasOnlyGoogle || babyUser.photos.length < 3) {
      await prisma.photo.deleteMany({ where: { userId: babyUser.id } });
      for (let i = 0; i < SAMPLE_WOMAN_PHOTOS.length; i++) {
        await prisma.photo.create({
          data: {
            userId: babyUser.id,
            url: SAMPLE_WOMAN_PHOTOS[i],
            isPrimary: i === 0,
            order: i,
          },
        });
      }
      console.log("Added 3 curated photos for Baby Myrah.");
    }
  }

  // 4. Make sure Oino Oino has valid photos (not just the Google letter avatar)
  const oinoUser = await prisma.user.findUnique({
    where: { id: "cmv46w5tk000s3hmd24pxcct4" },
    include: { photos: true },
  });

  if (oinoUser) {
    console.log("Oino user found, county:", oinoUser.county, "photos:", oinoUser.photos.length);
    // Ensure Oino is set to MAN interested in WOMAN
    await prisma.user.update({
      where: { id: oinoUser.id },
      data: {
        gender: "MAN",
        interestedInGenders: ["WOMAN"],
      },
    });

    const hasOnlyGoogle = oinoUser.photos.every((p) => p.url.includes("googleusercontent.com"));
    if (hasOnlyGoogle || oinoUser.photos.length < 3) {
      await prisma.photo.deleteMany({ where: { userId: oinoUser.id } });
      for (let i = 0; i < SAMPLE_MAN_PHOTOS.length; i++) {
        await prisma.photo.create({
          data: {
            userId: oinoUser.id,
            url: SAMPLE_MAN_PHOTOS[i],
            isPrimary: i === 0,
            order: i,
          },
        });
      }
      console.log("Added 3 curated photos for Oino Oino.");
    }
  }

  console.log("Database cleanup complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
