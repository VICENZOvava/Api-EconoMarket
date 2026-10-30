const prisma = require("../src/config/prisma");

async function executar() {
  const email = process.argv[2];

  if (!email) {
    console.error("Uso: node prisma/promover-gerente.js email@exemplo.com");
    process.exitCode = 1;
    return;
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { email: email.trim().toLowerCase() },
      data: { papel: "GERENTE" },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true
      }
    });

    console.log(`Usuário ${usuario.email} (ID ${usuario.id}) promovido para GERENTE.`);
  } catch (error) {
    if (error.code === "P2025") {
      console.error("Não existe usuário cadastrado com esse e-mail. Cadastre a conta primeiro.");
    } else {
      console.error("Não foi possível promover o usuário.");
      console.error(error.message);
    }

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

executar();
