const prisma = require("../config/prisma");

async function listarUsuarios() {
  return await prisma.usuario.findMany({
    orderBy: {
      nome: "asc"
    },
    select: {
      id: true,
      nome: true,
      email: true,
      provedor: true,
      criadoEm: true,
      atualizadoEm: true
    }
  });
}

async function buscarUsuarioPorId(id) {
  return await prisma.usuario.findUnique({
    where: {
      id: Number(id)
    },
    select: {
      id: true,
      nome: true,
      email: true,
      provedor: true,
      criadoEm: true,
      atualizadoEm: true
    }
  });
}

async function criarUsuario(dados) {
  return await prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      senhaHash: dados.senhaHash || null,
      firebaseUid: dados.firebaseUid || null,
      provedor: dados.provedor || "LOCAL",
      atualizadoEm: new Date()
    },
    select: {
      id: true,
      nome: true,
      email: true,
      provedor: true,
      criadoEm: true,
      atualizadoEm: true
    }
  });
}

async function atualizarUsuario(id, dados) {

  return await prisma.usuario.update({

    where: {
      id: Number(id)
    },

    data: {

      nome: dados.nome,

      email: dados.email,

      ...(dados.senhaHash !== undefined
        ? {
            senhaHash: dados.senhaHash
          }
        : {}),

      ...(dados.firebaseUid !== undefined
        ? {
            firebaseUid: dados.firebaseUid
          }
        : {}),

      ...(dados.provedor !== undefined
        ? {
            provedor: dados.provedor
          }
        : {}),

      atualizadoEm: new Date()

    },

    select: {

      id: true,
      nome: true,
      email: true,
      provedor: true,
      criadoEm: true,
      atualizadoEm: true

    }

  });

}

async function deletarUsuario(id) {
  return await prisma.usuario.delete({
    where: {
      id: Number(id)
    }
  });
}

async function buscarFotoPerfil(usuarioId) {
  return await prisma.fotoperfil.findUnique({
    where: { usuarioId: Number(usuarioId) },
    select: { tipo: true, dados: true, atualizadoEm: true }
  });
}

async function usuarioTemFoto(usuarioId) {
  const foto = await prisma.fotoperfil.findUnique({
    where: { usuarioId: Number(usuarioId) },
    select: { id: true }
  });

  return Boolean(foto);
}

// "upsert" garante um único registro por usuário (usuarioId é único):
// trocar a foto atualiza a existente em vez de criar outra.
async function salvarFotoPerfil(usuarioId, tipo, dados) {
  await prisma.fotoperfil.upsert({
    where: { usuarioId: Number(usuarioId) },
    create: {
      usuarioId: Number(usuarioId),
      tipo,
      dados,
      tamanho: dados.length,
      atualizadoEm: new Date()
    },
    update: {
      tipo,
      dados,
      tamanho: dados.length,
      atualizadoEm: new Date()
    }
  });
}

async function removerFotoPerfil(usuarioId) {
  await prisma.fotoperfil.deleteMany({
    where: { usuarioId: Number(usuarioId) }
  });
}

module.exports = {
  buscarFotoPerfil,
  usuarioTemFoto,
  salvarFotoPerfil,
  removerFotoPerfil,
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario
};