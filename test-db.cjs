
require("dotenv").config();

const { Client } = require("pg");

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    connectionTimeoutMillis: 30000,
  });

  try {
    console.log("Tentando conectar ao Supabase...");

    await client.connect();

    const result = await client.query(
      "SELECT NOW() AS horario, current_user AS usuario"
    );

    console.log("CONEXÃO ESTABELECIDA!");
    console.log(result.rows[0]);
  } catch (error) {
    console.log("FALHA:", error.code);
    console.log("MENSAGEM:", error.message);
  } finally {
    await client.end().catch(() => {});
  }
}

testConnection();
