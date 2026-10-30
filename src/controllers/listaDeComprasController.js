const listaDeComprasService = require("../services/listaDeComprasService");

const TIPOS_LISTA = ["FIXA", "TEMPORARIA"];
const TAMANHO_MAXIMO_NOME = 100;
const QUANTIDADE_MAXIMA = 999;
const MAXIMO_DE_ITENS = 100;

function validarId(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

function validarNome(nome) {
  if (typeof nome !== "string") {
    return { erro: "Informe um nome válido para a lista." };
  }

  const nomeLimpo = nome.trim();

  if (!nomeLimpo) {
    return { erro: "O nome da lista é obrigatório." };
  }

  if (nomeLimpo.length > TAMANHO_MAXIMO_NOME) {
    return {
      erro: `O nome da lista deve ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres.`
    };
  }

  return { valor: nomeLimpo };
}

function validarTipo(tipo) {
  const tipoNormalizado = typeof tipo === "string"
    ? tipo.trim().toUpperCase()
    : "";

  if (!TIPOS_LISTA.includes(tipoNormalizado)) {
    return { erro: "O tipo da lista deve ser FIXA ou TEMPORARIA." };
  }

  return { valor: tipoNormalizado };
}

// Valida os itens vindos do frontend. Produtos repetidos são somados,
// para que uma lista nunca grave o mesmo produto duas vezes.
function validarItens(itens) {
  if (!Array.isArray(itens)) {
    return { erro: "Os itens da lista devem ser enviados em formato de lista." };
  }

  if (itens.length === 0) {
    return { erro: "Não é possível salvar uma lista sem produtos." };
  }

  if (itens.length > MAXIMO_DE_ITENS) {
    return { erro: `Uma lista pode ter no máximo ${MAXIMO_DE_ITENS} produtos.` };
  }

  const agrupados = new Map();

  for (const item of itens) {
    if (!item || typeof item !== "object") {
      return { erro: "Um dos itens da lista é inválido." };
    }

    const produtoId = Number(item.produtoId);
    const quantidade = Number(item.quantidade);

    if (!validarId(produtoId)) {
      return { erro: "Um dos produtos da lista é inválido." };
    }

    if (!Number.isInteger(quantidade) || quantidade < 1) {
      return { erro: "A quantidade de cada produto deve ser um número inteiro maior que zero." };
    }

    agrupados.set(produtoId, (agrupados.get(produtoId) || 0) + quantidade);
  }

  const resultado = [];

  for (const [produtoId, quantidade] of agrupados) {
    if (quantidade > QUANTIDADE_MAXIMA) {
      return { erro: `A quantidade máxima por produto é ${QUANTIDADE_MAXIMA}.` };
    }

    resultado.push({ produtoId, quantidade });
  }

  return { valor: resultado };
}

function responderErroConhecido(error, res) {
  if (error.statusCode) {
    res.status(error.statusCode).json({ error: error.message });
    return true;
  }

  if (error.message === "Lista de compras não encontrada.") {
    res.status(404).json({ error: "Lista de compras não encontrada" });
    return true;
  }

  return false;
}

async function listarListasDeCompras(req, res) {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        error: "Usuário não autenticado"
      });
    }

    const listas = req.query.resumo === "true"
      ? await listaDeComprasService.listarResumoListasDeCompras(req.usuario.id)
      : await listaDeComprasService.listarListasDeCompras(req.usuario.id);

    return res.status(200).json(listas);
  } catch (error) {
    console.error("Erro ao listar listas de compras:", error);

    return res.status(500).json({
      error: "Erro ao buscar listas de compras"
    });
  }
}

async function buscarListaDeComprasPorId(req, res) {
  try {
    const { id } = req.params;

    if (!validarId(id)) {
      return res.status(400).json({
        error: "Identificador de lista inválido"
      });
    }

    const lista =
      await listaDeComprasService.buscarListaDeComprasPorId(
        id,
        req.usuario.id
      );

    return res.status(200).json(lista);
  } catch (error) {
    console.error("Erro ao buscar lista de compras:", error);

    if (responderErroConhecido(error, res)) return;

    return res.status(500).json({
      error: "Erro ao buscar lista de compras"
    });
  }
}

async function criarListaDeCompras(req, res) {
  try {
    const corpo = req.body || {};

    const nome = validarNome(corpo.nome);

    if (nome.erro) {
      return res.status(400).json({ error: nome.erro });
    }

    // Sem "tipo", a lista usa o padrão do banco (FIXA).
    let tipo = { valor: undefined };

    if (corpo.tipo !== undefined) {
      tipo = validarTipo(corpo.tipo);

      if (tipo.erro) {
        return res.status(400).json({ error: tipo.erro });
      }
    }

    // "itens" é opcional (a página de listas cria listas vazias),
    // mas, quando enviado, não pode estar vazio.
    let itens = { valor: undefined };

    if (corpo.itens !== undefined) {
      itens = validarItens(corpo.itens);

      if (itens.erro) {
        return res.status(400).json({ error: itens.erro });
      }
    }

    // O dono da lista vem sempre do token, nunca do corpo da requisição.
    const lista =
      await listaDeComprasService.criarListaDeCompras({
        usuarioId: req.usuario.id,
        nome: nome.valor,
        tipo: tipo.valor,
        itens: itens.valor
      });

    return res.status(201).json(lista);
  } catch (error) {
    console.error("Erro ao criar lista de compras:", error);

    if (responderErroConhecido(error, res)) return;

    return res.status(500).json({
      error: "Erro ao criar lista de compras"
    });
  }
}

async function atualizarListaDeCompras(req, res) {
  try {
    const { id } = req.params;

    if (!validarId(id)) {
      return res.status(400).json({
        error: "Identificador de lista inválido"
      });
    }

    const corpo = req.body || {};
    const dados = {};

    if (
      corpo.nome === undefined &&
      corpo.tipo === undefined &&
      corpo.itens === undefined
    ) {
      return res.status(400).json({
        error: "Informe o nome, o tipo ou os itens da lista para atualizar."
      });
    }

    if (corpo.nome !== undefined) {
      const nome = validarNome(corpo.nome);

      if (nome.erro) {
        return res.status(400).json({ error: nome.erro });
      }

      dados.nome = nome.valor;
    }

    if (corpo.tipo !== undefined) {
      const tipo = validarTipo(corpo.tipo);

      if (tipo.erro) {
        return res.status(400).json({ error: tipo.erro });
      }

      dados.tipo = tipo.valor;
    }

    if (corpo.itens !== undefined) {
      const itens = validarItens(corpo.itens);

      if (itens.erro) {
        return res.status(400).json({ error: itens.erro });
      }

      dados.itens = itens.valor;
    }

    const lista =
      await listaDeComprasService.atualizarListaDeCompras(
        id,
        dados,
        req.usuario.id
      );

    return res.status(200).json(lista);
  } catch (error) {
    console.error("Erro ao atualizar lista de compras:", error);

    if (responderErroConhecido(error, res)) return;

    return res.status(500).json({
      error: "Erro ao atualizar lista de compras"
    });
  }
}

async function deletarListaDeCompras(req, res) {
  try {
    const { id } = req.params;

    if (!validarId(id)) {
      return res.status(400).json({
        error: "Identificador de lista inválido"
      });
    }

    await listaDeComprasService.deletarListaDeCompras(
      id,
      req.usuario.id
    );

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar lista de compras:", error);

    if (responderErroConhecido(error, res)) return;

    return res.status(500).json({
      error: "Erro ao deletar lista de compras"
    });
  }
}

module.exports = {
  listarListasDeCompras,
  buscarListaDeComprasPorId,
  criarListaDeCompras,
  atualizarListaDeCompras,
  deletarListaDeCompras
};
