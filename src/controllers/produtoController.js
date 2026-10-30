const produtoService = require("../services/produtoService");

const camposPermitidos = [
  "nome",
  "marca",
  "descricao",
  "quantidade",
  "unidade",
  "imagemUrl",
  "categoriaId",
  "ativo"
];

function validarId(id) {
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0;
}

function validarProduto(dados, criar = false) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    return "Envie os dados do produto em formato válido.";
  }

  const camposRecebidos = Object.keys(dados);
  const campoDesconhecido = camposRecebidos.find(
    campo => !camposPermitidos.includes(campo)
  );

  if (campoDesconhecido) {
    return `O campo "${campoDesconhecido}" não é permitido.`;
  }

  if (criar && (typeof dados.nome !== "string" || !dados.nome.trim())) {
    return "O nome do produto é obrigatório.";
  }

  if (!criar && camposRecebidos.length === 0) {
    return "Informe ao menos um campo para atualizar.";
  }

  if (dados.nome !== undefined &&
      (typeof dados.nome !== "string" || !dados.nome.trim() || dados.nome.trim().length > 191)) {
    return "O nome deve ter entre 1 e 191 caracteres.";
  }

  for (const campo of ["marca", "descricao", "unidade", "imagemUrl"]) {
    if (dados[campo] !== undefined && dados[campo] !== null &&
        (typeof dados[campo] !== "string" || dados[campo].length > 191)) {
      return `O campo ${campo} deve ser um texto de até 191 caracteres.`;
    }
  }

  if (dados.quantidade !== undefined && dados.quantidade !== null && dados.quantidade !== "") {
    const quantidade = Number(dados.quantidade);
    const texto = String(dados.quantidade);

    if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > 9999999.999 ||
        !/^\d+(\.\d{1,3})?$/.test(texto)) {
      return "A quantidade deve ser um número positivo com até 3 casas decimais.";
    }
  }

  if (dados.categoriaId !== undefined && dados.categoriaId !== null &&
      dados.categoriaId !== "") {
    const categoriaId = Number(dados.categoriaId);
    if (!Number.isInteger(categoriaId) || categoriaId < 1) {
      return "Selecione uma categoria válida.";
    }
  }

  if (dados.ativo !== undefined && typeof dados.ativo !== "boolean") {
    return "O campo ativo deve ser verdadeiro ou falso.";
  }

  return null;
}

function responderErroBanco(error, res, operacao) {
  if (error.code === "P2002") {
    return res.status(409).json({ error: "Já existe um registro com esses dados únicos." });
  }

  if (error.code === "P2003") {
    return res.status(409).json({ error: "Não foi possível concluir a operação devido a um vínculo existente." });
  }

  if (error.code === "P2025") {
    return res.status(404).json({ error: "Produto não encontrado." });
  }

  console.error(`Erro ao ${operacao} produto:`, error);
  return res.status(500).json({ error: `Erro ao ${operacao} produto.` });
}

async function listarProdutos(req, res) {
  try {
    const produtos = await produtoService.listarProdutos();
    return res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({ error: "Erro ao buscar produtos." });
  }
}

async function listarProdutosAdmin(req, res) {
  try {
    const produtos = await produtoService.listarProdutosAdmin();
    return res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao listar produtos no painel:", error);
    return res.status(500).json({ error: "Erro ao buscar produtos para gerenciamento." });
  }
}

async function buscarProdutoPorId(req, res) {
  try {
    if (!validarId(req.params.id)) {
      return res.status(400).json({ error: "ID de produto inválido." });
    }

    const produto = await produtoService.buscarProdutoPorId(req.params.id);

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    return res.status(200).json(produto);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return res.status(500).json({ error: "Erro ao buscar produto." });
  }
}

async function criarProduto(req, res) {
  const erroValidacao = validarProduto(req.body, true);
  if (erroValidacao) {
    return res.status(400).json({ error: erroValidacao });
  }

  try {
    if (req.body.categoriaId !== undefined && req.body.categoriaId !== null &&
        req.body.categoriaId !== "" &&
        !(await produtoService.categoriaExiste(req.body.categoriaId))) {
      return res.status(400).json({ error: "A categoria informada não existe." });
    }

    const produto = await produtoService.criarProduto(req.body);
    return res.status(201).json(produto);
  } catch (error) {
    return responderErroBanco(error, res, "criar");
  }
}

async function atualizarProduto(req, res) {
  if (!validarId(req.params.id)) {
    return res.status(400).json({ error: "ID de produto inválido." });
  }

  const erroValidacao = validarProduto(req.body, false);
  if (erroValidacao) {
    return res.status(400).json({ error: erroValidacao });
  }

  try {
    const produtoExistente = await produtoService.buscarProdutoAdminPorId(req.params.id);

    if (!produtoExistente) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    if (req.body.categoriaId !== undefined && req.body.categoriaId !== null &&
        req.body.categoriaId !== "" &&
        !(await produtoService.categoriaExiste(req.body.categoriaId))) {
      return res.status(400).json({ error: "A categoria informada não existe." });
    }

    const produto = await produtoService.atualizarProduto(req.params.id, req.body);
    return res.status(200).json(produto);
  } catch (error) {
    return responderErroBanco(error, res, "atualizar");
  }
}

async function deletarProduto(req, res) {
  if (!validarId(req.params.id)) {
    return res.status(400).json({ error: "ID de produto inválido." });
  }

  try {
    const produtoExistente = await produtoService.buscarProdutoAdminPorId(req.params.id);

    if (!produtoExistente) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    await produtoService.desativarProduto(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return responderErroBanco(error, res, "desativar");
  }
}

module.exports = {
  listarProdutos,
  listarProdutosAdmin,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  deletarProduto
};
