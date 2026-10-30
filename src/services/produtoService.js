const prisma = require("../config/prisma");

const incluirPrecosPublicos = {
  where: {
    disponivel: true,
    mercado: {
      is: { ativo: true }
    }
  },
  include: {
    mercado: true
  }
};

async function listarProdutos() {
  return await prisma.produto.findMany({
    where: { ativo: true },
    include: {
      categoria: true,
      produtomercado: incluirPrecosPublicos
    },
    orderBy: { nome: "asc" }
  });
}

async function listarProdutosAdmin() {
  return await prisma.produto.findMany({
    include: {
      categoria: true,
      _count: {
        select: {
          produtomercado: true,
          itemlistacompra: true
        }
      }
    },
    orderBy: { nome: "asc" }
  });
}

async function buscarProdutoPorId(id) {
  return await prisma.produto.findFirst({
    where: {
      id: Number(id),
      ativo: true
    },
    include: {
      categoria: true,
      produtomercado: incluirPrecosPublicos
    }
  });
}

async function buscarProdutoAdminPorId(id) {
  return await prisma.produto.findUnique({
    where: { id: Number(id) },
    include: {
      categoria: true,
      _count: {
        select: {
          produtomercado: true,
          itemlistacompra: true
        }
      }
    }
  });
}

async function categoriaExiste(id) {
  if (id === null || id === undefined) return true;

  const categoria = await prisma.categoria.findUnique({
    where: { id: Number(id) },
    select: { id: true }
  });

  return Boolean(categoria);
}

function montarDadosProduto(dados, criar = false) {
  const data = { atualizadoEm: new Date() };
  const campos = [
    "nome",
    "marca",
    "descricao",
    "quantidade",
    "unidade",
    "imagemUrl",
    "categoriaId",
    "ativo"
  ];

  for (const campo of campos) {
    if (dados[campo] !== undefined) {
      if (["marca", "descricao", "unidade", "imagemUrl"].includes(campo)) {
        data[campo] = dados[campo] === "" ? null : dados[campo];
      } else if (campo === "categoriaId") {
        data[campo] = dados[campo] === null || dados[campo] === "" ? null : Number(dados[campo]);
      } else if (campo === "quantidade") {
        data[campo] = dados[campo] === null || dados[campo] === "" ? null : String(dados[campo]);
      } else if (campo === "nome") {
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

async function criarProduto(dados) {
  return await prisma.produto.create({
    data: {
      ...montarDadosProduto(dados, true),
      nome: dados.nome.trim()
    },
    include: { categoria: true }
  });
}

async function atualizarProduto(id, dados) {
  return await prisma.produto.update({
    where: { id: Number(id) },
    data: montarDadosProduto(dados),
    include: { categoria: true }
  });
}

// O DELETE da API é uma desativação lógica. Os relacionamentos são preservados.
async function desativarProduto(id) {
  return await prisma.produto.update({
    where: { id: Number(id) },
    data: {
      ativo: false,
      atualizadoEm: new Date()
    }
  });
}

module.exports = {
  listarProdutos,
  listarProdutosAdmin,
  buscarProdutoPorId,
  buscarProdutoAdminPorId,
  categoriaExiste,
  criarProduto,
  atualizarProduto,
  desativarProduto
};
