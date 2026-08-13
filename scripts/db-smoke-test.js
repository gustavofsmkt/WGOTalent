import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const maskedUrl = url.replace(/:([^:@]+)@/, ':***@');
  console.log(`🔌 Connecting to database: ${maskedUrl}`);

  const sql = postgres(url, { max: 1 });

  try {
    console.log("⏳ Validating Postgres connection (SELECT 1)...");
    const result1 = await sql`SELECT 1 as val`;
    if (result1[0].val !== 1) {
      throw new Error("SELECT 1 returned unexpected result.");
    }
    console.log("✅ SELECT 1 passed.");

    console.log("⏳ Validating 'unaccent' extension (SELECT unaccent('João'))...");
    const result2 = await sql`SELECT unaccent('João') as val`;
    if (result2[0].val !== 'Joao') {
      throw new Error(`unaccent returned unexpected result: ${result2[0].val}`);
    }
    console.log("✅ unaccent('João') passed.");

    console.log("🎉 Smoke test completed successfully.");
  } catch (error) {
    console.error("❌ Smoke test failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
