const prisma = require("../config/prisma");

const filtroPublico = {
  disponivel: true,
  produto: { is: { ativo: true } },
  mercado: { is: { ativo: true } }
};

async function listarProdutosMercado() {
  return await prisma.produtomercado.findMany({
    where: filtroPublico,
    include: {
      produto: { include: { categoria: true } },
      mercado: true
    },
    orderBy: { preco: "asc" }
  });
}

async function listarProdutosMercadoAdmin() {
  return await prisma.produtomercado.findMany({
    include: {
      produto: { include: { categoria: true } },
      mercado: true
    },
    orderBy: [{ produtoId: "asc" }, { mercadoId: "asc" }]
  });
}

async function buscarProdutoMercadoPorId(id) {
  return await prisma.produtomercado.findFirst({
    where: {
      id: Number(id),
      ...filtroPublico
    },
    include: {
      produto: { include: { categoria: true } },
      mercado: true
    }
  });
}

async function buscarProdutoMercadoAdminPorId(id) {
  return await prisma.produtomercado.findUnique({
    where: { id: Number(id) },
    include: {
      produto: { include: { categoria: true } },
      mercado: true
    }
  });
}

async function buscarEntidadesPorIds(produtoId, mercadoId) {
  const [produto, mercado] = await Promise.all([
    prisma.produto.findUnique({
      where: { id: Number(produtoId) },
      select: { id: true, nome: true, ativo: true }
    }),
    prisma.mercado.findUnique({
      where: { id: Number(mercadoId) },
      select: { id: true, nome: true, ativo: true }
    })
  ]);

  return { produto, mercado };
}

async function criarProdutoMercado(dados) {
  return await prisma.produtomercado.create({
    data: {
      produtoId: Number(dados.produtoId),
      mercadoId: Number(dados.mercadoId),
      preco: Number(dados.preco),
      precoOriginal: dados.precoOriginal === undefined || dados.precoOriginal === null || dados.precoOriginal === ""
        ? null
        : Number(dados.precoOriginal),
      emPromocao: dados.emPromocao !== undefined ? dados.emPromocao : false,
      inicioPromocao: dados.inicioPromocao ? new Date(dados.inicioPromocao) : null,
      fimPromocao: dados.fimPromocao ? new Date(dados.fimPromocao) : null,
      disponivel: dados.disponivel !== undefined ? dados.disponivel : true,
      atualizadoEm: new Date()
    },
    include: {
      produto: { include: { categoria: true } },
      mercado: true
    }
  });
}

async function atualizarProdutoMercado(id, dados) {
  const data = { atualizadoEm: new Date() };

  if (dados.produtoId !== undefined) data.produtoId = Number(dados.produtoId);
  if (dados.mercadoId !== undefined) data.mercadoId = Number(dados.mercadoId);
  if (dados.preco !== undefined) data.preco = Number(dados.preco);
  if (dados.precoOriginal !== undefined) {
    data.precoOriginal = dados.precoOriginal === null || dados.precoOriginal === ""
      ? null
      : Number(dados.precoOriginal);
  }
  if (dados.emPromocao !== undefined) data.emPromocao = dados.emPromocao;
  if (dados.inicioPromocao !== undefined) {
    data.inicioPromocao = dados.inicioPromocao ? new Date(dados.inicioPromocao) : null;
  }
  if (dados.fimPromocao !== undefined) {
    data.fimPromocao = dados.fimPromocao ? new Date(dados.fimPromocao) : null;
  }
  if (dados.disponivel !== undefined) data.disponivel = dados.disponivel;

  return await prisma.produtomercado.update({
    where: { id: Number(id) },
    data,
    include: {
      produto: { include: { categoria: true } },
      mercado: true
    }
  });
}

// Mantém o nome usado pelo controller, mas a operação é lógica:
// o registro e seus dados permanecem no banco para preservar o histórico.
async function deletarProdutoMercado(id) {
  return await prisma.produtomercado.update({
    where: { id: Number(id) },
    data: {
      disponivel: false,
      atualizadoEm: new Date()
    }
  });
}

module.exports = {
  listarProdutosMercado,
  listarProdutosMercadoAdmin,
  buscarProdutoMercadoPorId,
  buscarProdutoMercadoAdminPorId,
  buscarEntidadesPorIds,
  criarProdutoMercado,
  atualizarProdutoMercado,
  deletarProdutoMercado
};
