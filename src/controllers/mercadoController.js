const mercadoService = require("../services/mercadoService");

const camposPermitidos = ["nome", "slug", "logoUrl", "ativo"];

function validarId(id) {
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0;
}

function validarMercado(dados, criar = false) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    return "Envie os dados do supermercado em formato válido.";
  }

  const camposRecebidos = Object.keys(dados);
  const campoDesconhecido = camposRecebidos.find(
    campo => !camposPermitidos.includes(campo)
  );

  if (campoDesconhecido) {
    return `O campo "${campoDesconhecido}" não é permitido.`;
  }

  if (criar && (typeof dados.nome !== "string" || !dados.nome.trim())) {
    return "O nome do supermercado é obrigatório.";
  }

  if (criar && (typeof dados.slug !== "string" || !dados.slug.trim())) {
    return "O slug do supermercado é obrigatório.";
  }

  if (!criar && camposRecebidos.length === 0) {
    return "Informe ao menos um campo para atualizar.";
  }

  for (const campo of ["nome", "slug"]) {
    if (dados[campo] !== undefined &&
        (typeof dados[campo] !== "string" || !dados[campo].trim() || dados[campo].trim().length > 191)) {
      return `O campo ${campo} deve ter entre 1 e 191 caracteres.`;
    }
  }

  if (dados.logoUrl !== undefined && dados.logoUrl !== null &&
      (typeof dados.logoUrl !== "string" || dados.logoUrl.length > 191)) {
    return "O endereço do logo deve ser um texto de até 191 caracteres.";
  }

  if (dados.ativo !== undefined && typeof dados.ativo !== "boolean") {
    return "O campo ativo deve ser verdadeiro ou falso.";
  }

  return null;
}

function responderErroBanco(error, res, operacao) {
  if (error.code === "P2002") {
    return res.status(409).json({ error: "Já existe um supermercado com esse slug." });
  }

  if (error.code === "P2003") {
    return res.status(409).json({ error: "Não foi possível concluir a operação devido a um vínculo existente." });
  }

  if (error.code === "P2025") {
    return res.status(404).json({ error: "Supermercado não encontrado." });
  }

  console.error(`Erro ao ${operacao} supermercado:`, error);
  return res.status(500).json({ error: `Erro ao ${operacao} supermercado.` });
}

async function listarMercados(req, res) {
  try {
    const mercados = await mercadoService.listarMercados();
    return res.status(200).json(mercados);
  } catch (error) {
    console.error("Erro ao listar supermercados:", error);
    return res.status(500).json({ error: "Erro ao buscar supermercados." });
  }
}

async function listarMercadosAdmin(req, res) {
  try {
    const mercados = await mercadoService.listarMercadosAdmin();
    return res.status(200).json(mercados);
  } catch (error) {
    console.error("Erro ao listar supermercados no painel:", error);
    return res.status(500).json({ error: "Erro ao buscar supermercados para gerenciamento." });
  }
}

async function buscarMercadoPorId(req, res) {
  if (!validarId(req.params.id)) {
    return res.status(400).json({ error: "ID de supermercado inválido." });
  }

  try {
    const mercado = await mercadoService.buscarMercadoPorId(req.params.id);

    if (!mercado) {
      return res.status(404).json({ error: "Supermercado não encontrado." });
    }

    return res.status(200).json(mercado);
  } catch (error) {
    console.error("Erro ao buscar supermercado:", error);
    return res.status(500).json({ error: "Erro ao buscar supermercado." });
  }
}

async function criarMercado(req, res) {
  const erroValidacao = validarMercado(req.body, true);
  if (erroValidacao) {
    return res.status(400).json({ error: erroValidacao });
  }

  try {
    const mercado = await mercadoService.criarMercado(req.body);
    return res.status(201).json(mercado);
  } catch (error) {
    return responderErroBanco(error, res, "criar");
  }
}

async function atualizarMercado(req, res) {
  if (!validarId(req.params.id)) {
    return res.status(400).json({ error: "ID de supermercado inválido." });
  }

  const erroValidacao = validarMercado(req.body, false);
  if (erroValidacao) {
    return res.status(400).json({ error: erroValidacao });
  }

  try {
    const mercadoExistente = await mercadoService.buscarMercadoAdminPorId(req.params.id);

    if (!mercadoExistente) {
      return res.status(404).json({ error: "Supermercado não encontrado." });
    }

    const mercado = await mercadoService.atualizarMercado(req.params.id, req.body);
    return res.status(200).json(mercado);
  } catch (error) {
    return responderErroBanco(error, res, "atualizar");
  }
}

async function deletarMercado(req, res) {
  if (!validarId(req.params.id)) {
    return res.status(400).json({ error: "ID de supermercado inválido." });
  }

  try {
    const mercadoExistente = await mercadoService.buscarMercadoAdminPorId(req.params.id);

    if (!mercadoExistente) {
      return res.status(404).json({ error: "Supermercado não encontrado." });
    }

    await mercadoService.desativarMercado(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return responderErroBanco(error, res, "desativar");
  }
}

module.exports = {
  listarMercados,
  listarMercadosAdmin,
  buscarMercadoPorId,
  criarMercado,
  atualizarMercado,
  deletarMercado
};
