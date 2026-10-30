const express = require("express");

const router = express.Router();

const usuarioController = require("../controllers/usuarioController");
const autenticar = require("../middlewares/authMiddleware");
const { exigirGerente } = require("../middlewares/papelMiddleware");
const { receberFotoPerfil } = require("../middlewares/fotoPerfilMiddleware");

// Foto do usuário autenticado. Precisa vir antes de "/:id".
router.get("/me/foto", autenticar, usuarioController.buscarMinhaFoto);
router.put("/me/foto", autenticar, receberFotoPerfil, usuarioController.salvarMinhaFoto);
router.delete("/me/foto", autenticar, usuarioController.removerMinhaFoto);

// Antes estas rotas eram públicas (listar usuários e excluir qualquer conta).
// Agora exigem login; excluir/consultar por ID só vale para a própria conta.
router.get("/", autenticar, exigirGerente, usuarioController.listarUsuarios);
router.get("/:id", autenticar, usuarioController.buscarUsuarioPorId);
router.post("/", usuarioController.criarUsuario);

router.put("/:id", autenticar, usuarioController.atualizarUsuario);

router.delete("/:id", autenticar, usuarioController.deletarUsuario);

module.exports = router;
