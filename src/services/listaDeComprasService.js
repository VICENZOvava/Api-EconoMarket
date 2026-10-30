const prisma = require("../config/prisma");

function criarErro(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const incluirDadosLista = {
  usuario: {
    select: {
      id: true,
      nome: true,
      email: true
    }
  },

  itemlistacompra: {
    include: {
      produto: true
    },
    orderBy: {
      id: "asc"
    }
  }
};

async function listarListasDeCompras(usuarioId) {
  return await prisma.listadecompras.findMany({
    where: {
      usuarioId: Number(usuarioId)
    },

    include: incluirDadosLista,

    orderBy: {
      criadoEm: "desc"
    }
  });
}

// Versão leve para a seção "Minhas listas": sem produtos completos.
async function listarResumoListasDeCompras(usuarioId) {
  const listas = await prisma.listadecompras.findMany({
    where: {
      usuarioId: Number(usuarioId)
    },

    select: {
      id: true,
      nome: true,
      tipo: true,
      criadoEm: true,
      atualizadoEm: true,
      itemlistacompra: {
        select: {
          quantidade: true
        }
      }
    },

    orderBy: {
      atualizadoEm: "desc"
    }
  });

  return listas.map(lista => ({
    id: lista.id,
    nome: lista.nome,
    tipo: lista.tipo,
    criadoEm: lista.criadoEm,
    atualizadoEm: lista.atualizadoEm,
    totalProdutos: lista.itemlistacompra.length,
    totalUnidades: lista.itemlistacompra.reduce(
      (total, item) => total + item.quantidade,
      0
    )
  }));
}

async function buscarListaDeComprasPorId(id, usuarioId) {
  const lista = await prisma.listadecompras.findFirst({
    where: {
      id: Number(id),
      usuarioId: Number(usuarioId)
    },

    include: incluirDadosLista
  });

  if (!lista) {
    throw new Error("Lista de compras não encontrada.");
  }

  return lista;
}

// Confere, dentro da transação, se os produtos existem e podem entrar na lista.
// Produtos inativos só são aceitos quando já faziam parte da própria lista
// (permite salvar uma lista antiga sem perder um item que foi desativado).
async function validarProdutos(tx, produtoIds, produtosJaNaLista = []) {
  const encontrados = await tx.produto.findMany({
    where: {
      id: { in: produtoIds }
    },
    select: {
      id: true,
      ativo: true
    }
  });

  const mapa = new Map(encontrados.map(produto => [produto.id, produto]));

  for (const produtoId of produtoIds) {
    const produto = mapa.get(produtoId);

    if (!produto) {
      throw criarErro(400, "A lista contém um produto que não existe.");
    }

    if (!produto.ativo && !produtosJaNaLista.includes(produtoId)) {
      throw criarErro(400, "A lista contém um produto indisponível no catálogo.");
    }
  }
}

async function criarListaDeCompras(dados) {
  const usuarioId = Number(dados.usuarioId);

  return await prisma.$transaction(async tx => {
    if (dados.itens) {
      await validarProdutos(
        tx,
        dados.itens.map(item => item.produtoId)
      );
    }

    // A lista e todos os itens são criados na mesma transação:
    // se um item falhar, nada é gravado.
    return await tx.listadecompras.create({
      data: {
        usuarioId,
        nome: dados.nome,
        ...(dados.tipo ? { tipo: dados.tipo } : {}),
        atualizadoEm: new Date(),

        ...(dados.itens
          ? {
              itemlistacompra: {
                create: dados.itens.map(item => ({
                  produtoId: item.produtoId,
                  quantidade: item.quantidade
                }))
              }
            }
          : {})
      },

      include: incluirDadosLista
    });
  });
}

async function atualizarListaDeCompras(id, dados, usuarioId) {
  return await prisma.$transaction(async tx => {
    // A propriedade da lista é conferida dentro da transação, com o ID do token.
    const lista = await tx.listadecompras.findFirst({
      where: {
        id: Number(id),
        usuarioId: Number(usuarioId)
      },
      include: {
        itemlistacompra: true
      }
    });

    if (!lista) {
      throw new Error("Lista de compras não encontrada.");
    }

    if (dados.itens) {
      const existentes = new Map(
        lista.itemlistacompra.map(item => [item.produtoId, item])
      );

      const novosIds = new Set(dados.itens.map(item => item.produtoId));

      await validarProdutos(
        tx,
        dados.itens.map(item => item.produtoId),
        Array.from(existentes.keys())
      );

      // Atualiza por diferença para preservar os IDs dos itens que continuam
      // na lista e nunca duplicar um produto.
      const idsParaRemover = lista.itemlistacompra
        .filter(item => !novosIds.has(item.produtoId))
        .map(item => item.id);

      if (idsParaRemover.length) {
        await tx.itemlistacompra.deleteMany({
          where: {
            id: { in: idsParaRemover },
            listaDeComprasId: lista.id
          }
        });
      }

      for (const item of dados.itens) {
        const existente = existentes.get(item.produtoId);

        if (!existente) {
          await tx.itemlistacompra.create({
            data: {
              listaDeComprasId: lista.id,
              produtoId: item.produtoId,
              quantidade: item.quantidade
            }
          });
        } else if (existente.quantidade !== item.quantidade) {
          await tx.itemlistacompra.update({
            where: { id: existente.id },
            data: { quantidade: item.quantidade }
          });
        }
      }
    }

    return await tx.listadecompras.update({
      where: {
        id: lista.id
      },

      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
        ...(dados.tipo !== undefined ? { tipo: dados.tipo } : {}),
        atualizadoEm: new Date()
      },

      include: incluirDadosLista
    });
  });
}

async function deletarListaDeCompras(id, usuarioId) {
  const lista = await prisma.listadecompras.findFirst({
    where: {
      id: Number(id),
      usuarioId: Number(usuarioId)
    }
  });

  if (!lista) {
    throw new Error("Lista de compras não encontrada.");
  }

  // Os itens saem em cascata; os produtos do catálogo não são afetados.
  return await prisma.listadecompras.delete({
    where: {
      id: Number(id)
    }
  });
}

module.exports = {
  listarListasDeCompras,
  listarResumoListasDeCompras,
  buscarListaDeComprasPorId,
  criarListaDeCompras,
  atualizarListaDeCompras,
  deletarListaDeCompras
};
