const prisma = require("../config/prisma");

async function exigirGerente(req, res, next) {
  try {
    const usuarioId = Number(req.usuario?.id);

    if (!Number.isInteger(usuarioId) || usuarioId < 1) {
      return res.status(403).json({
        error: "Acesso permitido somente para gerentes"
      });
    }

    // O papel é consultado no banco em cada requisição. O JWT não concede
    // privilégios administrativos e continua válido após uma alteração de papel.
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { papel: true }
    });

    if (!usuario || usuario.papel !== "GERENTE") {
      return res.status(403).json({
        error: "Acesso permitido somente para gerentes"
      });
    }

    return next();
  } catch (error) {
    console.error("Erro ao verificar papel do usuário:", error);

    return res.status(500).json({
      error: "Não foi possível verificar as permissões do usuário"
    });
  }
}

module.exports = { exigirGerente };
