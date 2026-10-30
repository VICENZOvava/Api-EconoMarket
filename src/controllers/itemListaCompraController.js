const itemListaCompraService = require("../services/itemListaCompraService");

const QUANTIDADE_MAXIMA = 999;

function validarId(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

function validarDadosItem(dados) {
  if (!dados || typeof dados !== "object") {
    return "Envie os dados do item em formato válido.";
  }

  if (!validarId(dados.listaDeComprasId)) {
    return "Lista de compras inválida.";
  }

  if (!validarId(dados.produtoId)) {
    return "Produto inválido.";
  }

  const quantidade = Number(dados.quantidade);

  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > QUANTIDADE_MAXIMA) {
    return `A quantidade deve ser um número inteiro entre 1 e ${QUANTIDADE_MAXIMA}.`;
  }

  return null;
}

function responderErroPrisma(error, res) {
  if (error.code === "P2002") {
    res.status(409).json({ error: "Este produto já está na lista" });
    return true;
  }

  if (error.code === "P2003" || error.code === "P2025") {
    res.status(404).json({ error: "Produto não encontrado" });
    return true;
  }

  return false;
}

async function listarItensListaCompra(req, res) {
  try {
    const itens =
      await itemListaCompraService.listarItensListaCompra(
        req.usuario.id
      );

    return res.status(200).json(itens);
  } catch (error) {
    console.error("Erro ao listar itens da lista:", error);

    return res.status(500).json({
      error: "Erro ao buscar itens da lista"
    });
  }
}

async function buscarItemListaCompraPorId(req, res) {
  try {
    const { id } = req.params;

    const item =
      await itemListaCompraService.buscarItemListaCompraPorId(
        id,
        req.usuario.id
      );

    if (!item) {
      return res.status(404).json({
        error: "Item da lista não encontrado"
      });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error("Erro ao buscar item da lista:", error);

    return res.status(500).json({
      error: "Erro ao buscar item da lista"
    });
  }
}

async function criarItemListaCompra(req, res) {
  try {
    const erroValidacao = validarDadosItem(req.body);

    if (erroValidacao) {
      return res.status(400).json({ error: erroValidacao });
    }

    const item =
      await itemListaCompraService.criarItemListaCompra(
        req.body,
        req.usuario.id
      );

    return res.status(201).json(item);
  } catch (error) {
    console.error("Erro ao criar item da lista:", error);

    if (error.message === "Lista de compras não encontrada.") {
      return res.status(404).json({
        error: "Lista de compras não encontrada"
      });
    }

    if (responderErroPrisma(error, res)) return;

    return res.status(500).json({
      error: "Erro ao criar item da lista"
    });
  }
}

async function atualizarItemListaCompra(req, res) {
  try {
    const { id } = req.params;

    const erroValidacao = !validarId(id)
      ? "Identificador de item inválido."
      : validarDadosItem(req.body);

    if (erroValidacao) {
      return res.status(400).json({ error: erroValidacao });
    }

    const item =
      await itemListaCompraService.atualizarItemListaCompra(
        id,
        req.body,
        req.usuario.id
      );

    return res.status(200).json(item);
  } catch (error) {
    console.error("Erro ao atualizar item da lista:", error);

    if (error.message === "Item da lista não encontrado.") {
      return res.status(404).json({
        error: "Item da lista não encontrado"
      });
    }

    if (error.message === "Lista de compras não encontrada.") {
      return res.status(404).json({
        error: "Lista de compras não encontrada"
      });
    }

    if (responderErroPrisma(error, res)) return;

    return res.status(500).json({
      error: "Erro ao atualizar item da lista"
    });
  }
}

async function deletarItemListaCompra(req, res) {
  try {
    const { id } = req.params;

    await itemListaCompraService.deletarItemListaCompra(
      id,
      req.usuario.id
    );

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar item da lista:", error);

    if (error.message === "Item da lista não encontrado.") {
      return res.status(404).json({
        error: "Item da lista não encontrado"
      });
    }

    return res.status(500).json({
      error: "Erro ao deletar item da lista"
    });
  }
}

module.exports = {
  listarItensListaCompra,
  buscarItemListaCompraPorId,
  criarItemListaCompra,
  atualizarItemListaCompra,
  deletarItemListaCompra
};