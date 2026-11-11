const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslmode");
url.searchParams.delete("pgbouncer");

const adapter = new PrismaPg({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
  max: 3,
});

module.exports = new PrismaClient({ adapter });