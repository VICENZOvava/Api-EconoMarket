const express = require("express");

const categoriaController = require("../controllers/categoriaController");
const autenticar = require("../middlewares/authMiddleware");
const { exigirGerente } = require("../middlewares/papelMiddleware");

const router = express.Router();

router.get("/", categoriaController.listarCategorias);
router.get("/:id", categoriaController.buscarCategoriaPorId);
router.post("/", autenticar, exigirGerente, categoriaController.criarCategoria);
router.put("/:id", autenticar, exigirGerente, categoriaController.atualizarCategoria);
router.delete("/:id", autenticar, exigirGerente, categoriaController.deletarCategoria);

module.exports = router;
