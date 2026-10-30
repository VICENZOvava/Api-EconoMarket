const express = require("express");

const produtoController = require("../controllers/produtoController");
const autenticar = require("../middlewares/authMiddleware");
const { exigirGerente } = require("../middlewares/papelMiddleware");

const router = express.Router();

router.get("/", produtoController.listarProdutos);
router.get("/admin", autenticar, exigirGerente, produtoController.listarProdutosAdmin);
router.get("/:id", produtoController.buscarProdutoPorId);

router.post("/", autenticar, exigirGerente, produtoController.criarProduto);
router.put("/:id", autenticar, exigirGerente, produtoController.atualizarProduto);
router.delete("/:id", autenticar, exigirGerente, produtoController.deletarProduto);

module.exports = router;
