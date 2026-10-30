const prisma = require("../config/prisma");

const incluirProdutosPublicos = {
  where: {
    disponivel: true,
    produto: {
      is: { ativo: true }
    }
  },
  include: {
    produto: true
  }
};

async function listarMercados() {
  return await prisma.mercado.findMany({
    where: { ativo: true },
    include: {
      produtomercado: incluirProdutosPublicos
    },
    orderBy: { nome: "asc" }
  });
}

async function listarMercadosAdmin() {
  return await prisma.mercado.findMany({
    include: {
      _count: {
        select: { produtomercado: true }
      }
    },
    orderBy: { nome: "asc" }
  });
}

async function buscarMercadoPorId(id) {
  return await prisma.mercado.findFirst({
    where: {
      id: Number(id),
      ativo: true
    },
    include: {
      produtomercado: incluirProdutosPublicos
    }
  });
}

async function buscarMercadoAdminPorId(id) {
  return await prisma.mercado.findUnique({
    where: { id: Number(id) },
    include: {
      _count: {
        select: { produtomercado: true }
      }
    }
  });
}

function montarDadosMercado(dados, criar = false) {
  const data = { atualizadoEm: new Date() };
  const campos = ["nome", "slug", "logoUrl", "ativo"];

  for (const campo of campos) {
    if (dados[campo] !== undefined) {
      if (campo === "logoUrl") {
        data[campo] = dados[campo] === "" ? null : dados[campo];
      } else if (campo === "nome" || campo === "slug") {
        data[campo] = dados[campo].trim();
      } else {
        data[campo] = dados[campo];
      }
    }
  }

  if (criar && data.ativo === undefined) {
    data.ativo = true;
  }

  return data;
}

async function criarMercado(dados) {
  return await prisma.mercado.create({
    data: {
      ...montarDadosMercado(dados, true),
      nome: dados.nome.trim(),
      slug: dados.slug.trim()
    }
  });
}

async function atualizarMercado(id, dados) {
  return await prisma.mercado.update({
    where: { id: Number(id) },
    data: montarDadosMercado(dados)
  });
}

// O DELETE da API desativa o mercado e preserva preços e referências históricas.
async function desativarMercado(id) {
  return await prisma.mercado.update({
    where: { id: Number(id) },
    data: {
      ativo: false,
      atualizadoEm: new Date()
    }
  });
}

module.exports = {
  listarMercados,
  listarMercadosAdmin,
  buscarMercadoPorId,
  buscarMercadoAdminPorId,
  criarMercado,
  atualizarMercado,
  desativarMercado
};
