const express = require("express");

const produtoMercadoController = require("../controllers/produtoMercadoController");
const autenticar = require("../middlewares/authMiddleware");
const { exigirGerente } = require("../middlewares/papelMiddleware");

const router = express.Router();

// A rota administrativa precisa vir antes de "/:id" para não ser lida como um ID.
router.get("/admin", autenticar, exigirGerente, produtoMercadoController.listarProdutosMercadoAdmin);

// Consulta pública: retorna somente preços disponíveis de produtos e mercados ativos.
router.get("/", produtoMercadoController.listarProdutosMercado);
router.get("/:id", produtoMercadoController.buscarProdutoMercadoPorId);

// Toda alteração de preços exige autenticação e autorização de gerente.
router.post("/", autenticar, exigirGerente, produtoMercadoController.criarProdutoMercado);
router.put("/:id", autenticar, exigirGerente, produtoMercadoController.atualizarProdutoMercado);
router.delete("/:id", autenticar, exigirGerente, produtoMercadoController.deletarProdutoMercado);

module.exports = router;
