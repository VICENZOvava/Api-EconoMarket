const express = require("express");

const authController = require("../controllers/authController");
const autenticar = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/registrar", authController.registrar);

router.post("/login", authController.login);

router.post("/firebase", authController.loginFirebase);

router.get("/me", autenticar, authController.me);

module.exports = router;