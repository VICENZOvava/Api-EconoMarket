const produtoMercadoService = require("../services/produtoMercadoService");

const camposPermitidos = [
  "produtoId",
  "mercadoId",
  "preco",
  "precoOriginal",
  "emPromocao",
  "inicioPromocao",
  "fimPromocao",
  "disponivel"
];

function validarId(id) {
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0;
}

function validarIdRelacionado(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

function validarValorMonetario(valor, opcional = false) {
  if (opcional && (valor === undefined || valor === null || valor === "")) {
    return true;
  }

  if (typeof valor !== "number" && typeof valor !== "string") {
    return false;
  }

  const texto = String(valor);
  const numero = Number(valor);

  return Number.isFinite(numero) &&
    numero > 0 &&
    numero <= 99999999.99 &&
    /^\d+(\.\d{1,2})?$/.test(texto);
}

function validarData(valor) {
  if (valor === undefined || valor === null || valor === "") return true;
  if (typeof valor !== "string") return false;
  return !Number.isNaN(Date.parse(valor));
}

function validarDados(dados, criar = false, existente = null) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    return "Envie os dados do preço em formato válido.";
  }

  const campoDesconhecido = Object.keys(dados).find(
    campo => !camposPermitidos.includes(campo)
  );

  if (campoDesconhecido) {
    return `O campo "${campoDesconhecido}" não é permitido.`;
  }

  if (criar && (!validarIdRelacionado(dados.produtoId) || !validarIdRelacionado(dados.mercadoId))) {
    return "Selecione um produto e um supermercado válidos.";
  }

  if (criar && !validarValorMonetario(dados.preco)) {
    return "Informe um preço válido e maior que zero, com até duas casas decimais.";
  }

  if (!criar && Object.keys(dados).length === 0) {
    return "Informe ao menos um campo para atualizar.";
  }

  for (const campo of ["produtoId", "mercadoId"]) {
    if (dados[campo] !== undefined && !validarIdRelacionado(dados[campo])) {
      return "Selecione um produto e um supermercado válidos.";
    }
  }

  if (dados.preco !== undefined && !validarValorMonetario(dados.preco)) {
    return "Informe um preço válido e maior que zero, com até duas casas decimais.";
  }

  if (dados.precoOriginal !== undefined && !validarValorMonetario(dados.precoOriginal, true)) {
    return "O preço original deve ser positivo e ter até duas casas decimais.";
  }

  for (const campo of ["emPromocao", "disponivel"]) {
    if (dados[campo] !== undefined && typeof dados[campo] !== "boolean") {
      return `O campo ${campo} deve ser verdadeiro ou falso.`;
    }
  }

  for (const campo of ["inicioPromocao", "fimPromocao"]) {
    if (dados[campo] !== undefined && !validarData(dados[campo])) {
      return `A data ${campo} é inválida.`;
    }
  }

  const dadosCompletos = {
    preco: existente ? Number(existente.preco) : undefined,
    precoOriginal: existente?.precoOriginal === null || existente?.precoOriginal === undefined
      ? null
      : Number(existente.precoOriginal),
    emPromocao: existente?.emPromocao ?? false,
    inicioPromocao: existente?.inicioPromocao ?? null,
    fimPromocao: existente?.fimPromocao ?? null,
    ...dados
  };

  if (dadosCompletos.emPromocao) {
    if (!validarValorMonetario(dadosCompletos.preco) ||
        !validarValorMonetario(dadosCompletos.precoOriginal) ||
        Number(dadosCompletos.precoOriginal) <= Number(dadosCompletos.preco)) {
      return "Em uma promoção, o preço original deve ser maior que o preço promocional.";
    }
  }

  const inicio = dadosCompletos.inicioPromocao ? Date.parse(dadosCompletos.inicioPromocao) : null;
  const fim = dadosCompletos.fimPromocao ? Date.parse(dadosCompletos.fimPromocao) : null;

  if (inicio !== null && fim !== null && inicio > fim) {
    return "O início da promoção não pode ser posterior ao fim.";
  }

  return null;
}

function responderErroBanco(error, res, operacao) {
  if (error.code === "P2002") {
    return res.status(409).json({
      error: "Já existe um preço cadastrado para este produto neste supermercado. Edite o preço existente."
    });
  }

  if (error.code === "P2003") {
    return res.status(409).json({ error: "O produto ou supermercado está vinculado a outros registros." });
  }

  if (error.code === "P2025") {
    return res.status(404).json({ error: "Preço do produto no supermercado não encontrado." });
  }

  console.error(`Erro ao ${operacao} preço por supermercado:`, error);
  return res.status(500).json({ error: `Não foi possível ${operacao} o preço por supermercado.` });
}

async function listarProdutosMercado(req, res) {
  try {
    const produtosMercado = await produtoMercadoService.listarProdutosMercado();
    return res.status(200).json(produtosMercado);
  } catch (error) {
    console.error("Erro ao listar produtos por mercado:", error);
    return res.status(500).json({ error: "Erro ao buscar produtos por mercado." });
  }
}

async function listarProdutosMercadoAdmin(req, res) {
  try {
    const produtosMercado = await produtoMercadoService.listarProdutosMercadoAdmin();
    return res.status(200).json(produtosMercado);
  } catch (error) {
    console.error("Erro ao listar preços no painel:", error);
    return res.status(500).json({ error: "Erro ao buscar preços para gerenciamento." });
  }
}

async function buscarProdutoMercadoPorId(req, res) {
  if (!validarId(req.params.id)) {
    return res.status(400).json({ error: "ID do preço inválido." });
  }

  try {
    const produtoMercado = await produtoMercadoService.buscarProdutoMercadoPorId(req.params.id);

    if (!produtoMercado) {
      return res.status(404).json({ error: "Produto no mercado não encontrado." });
    }

    return res.status(200).json(produtoMercado);
  } catch (error) {
    console.error("Erro ao buscar produto no mercado:", error);
    return res.status(500).json({ error: "Erro ao buscar produto no mercado." });
  }
}

async function validarEntidades(dados, existente, criar) {
  const produtoId = dados.produtoId !== undefined ? Number(dados.produtoId) : existente?.produtoId;
  const mercadoId = dados.mercadoId !== undefined ? Number(dados.mercadoId) : existente?.mercadoId;
  const { produto, mercado } = await produtoMercadoService.buscarEntidadesPorIds(produtoId, mercadoId);

  if (!produto || !mercado) {
    return "O produto ou supermercado selecionado não existe.";
  }

  const mudouProduto = criar || Number(produtoId) !== Number(existente?.produtoId);
  const mudouMercado = criar || Number(mercadoId) !== Number(existente?.mercadoId);

  if (mudouProduto && !produto.ativo) {
    return "Não é possível cadastrar um preço para um produto inativo.";
  }

  if (mudouMercado && !mercado.ativo) {
    return "Não é possível cadastrar um preço para um supermercado inativo.";
  }

  return null;
}

async function criarProdutoMercado(req, res) {
  const erroValidacao = validarDados(req.body, true);
  if (erroValidacao) {
    return res.status(400).json({ error: erroValidacao });
  }

  try {
    const erroEntidades = await validarEntidades(req.body, null, true);
    if (erroEntidades) return res.status(400).json({ error: erroEntidades });

    const produtoMercado = await produtoMercadoService.criarProdutoMercado(req.body);
    return res.status(201).json(produtoMercado);
  } catch (error) {
    return responderErroBanco(error, res, "cadastrar");
  }
}

async function atualizarProdutoMercado(req, res) {
  if (!validarId(req.params.id)) {
    return res.status(400).json({ error: "ID do preço inválido." });
  }

  try {
    const existente = await produtoMercadoService.buscarProdutoMercadoAdminPorId(req.params.id);

    if (!existente) {
      return res.status(404).json({ error: "Produto no mercado não encontrado." });
    }

    const erroValidacao = validarDados(req.body, false, existente);
    if (erroValidacao) return res.status(400).json({ error: erroValidacao });

    if (req.body.produtoId !== undefined || req.body.mercadoId !== undefined) {
      const erroEntidades = await validarEntidades(req.body, existente, false);
      if (erroEntidades) return res.status(400).json({ error: erroEntidades });
    }

    const produtoMercado = await produtoMercadoService.atualizarProdutoMercado(req.params.id, req.body);
    return res.status(200).json(produtoMercado);
  } catch (error) {
    return responderErroBanco(error, res, "atualizar");
  }
}

async function deletarProdutoMercado(req, res) {
  if (!validarId(req.params.id)) {
    return res.status(400).json({ error: "ID do preço inválido." });
  }

  try {
    const existente = await produtoMercadoService.buscarProdutoMercadoAdminPorId(req.params.id);

    if (!existente) {
      return res.status(404).json({ error: "Produto no mercado não encontrado." });
    }

    await produtoMercadoService.deletarProdutoMercado(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return responderErroBanco(error, res, "indisponibilizar");
  }
}

module.exports = {
  listarProdutosMercado,
  listarProdutosMercadoAdmin,
  buscarProdutoMercadoPorId,
  criarProdutoMercado,
  atualizarProdutoMercado,
  deletarProdutoMercado
};
