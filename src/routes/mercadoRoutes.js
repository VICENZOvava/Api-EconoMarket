const express = require("express");

const mercadoController = require("../controllers/mercadoController");
const autenticar = require("../middlewares/authMiddleware");
const { exigirGerente } = require("../middlewares/papelMiddleware");

const router = express.Router();

router.get("/", mercadoController.listarMercados);
router.get("/admin", autenticar, exigirGerente, mercadoController.listarMercadosAdmin);
router.get("/:id", mercadoController.buscarMercadoPorId);

router.post("/", autenticar, exigirGerente, mercadoController.criarMercado);
router.put("/:id", autenticar, exigirGerente, mercadoController.atualizarMercado);
router.delete("/:id", autenticar, exigirGerente, mercadoController.deletarMercado);

module.exports = router;
