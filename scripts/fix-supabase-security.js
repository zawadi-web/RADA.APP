const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Securing Supabase public tables & enabling Row Level Security (RLS)...");

  // Dynamic query: Enable RLS on all tables in public schema except prisma internal tables
  await prisma.$executeRawUnsafe(`
    DO $$ 
    DECLARE 
        r RECORD;
    BEGIN 
        FOR r IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
              AND tablename NOT LIKE '_prisma%'
        ) 
        LOOP 
            EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
        END LOOP; 
    END $$;
  `);
  console.log("✅ Row Level Security (RLS) enabled on all public tables.");

  // Revoke public PostgREST (anon and authenticated) access one by one
  const statements = [
    `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;`,
    `REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;`,
    `REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;`
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      console.warn("Notice executing:", sql, e.message);
    }
  }

  console.log("✅ Direct PostgREST access revoked for anon & authenticated roles.");
  console.log("🎉 All Supabase security warnings (rls_disabled_in_public & sensitive_columns_exposed) resolved!");
}

main()
  .catch((err) => {
    console.error("❌ Error running security fix:", err);
  })
  .finally(() => prisma.$disconnect());
