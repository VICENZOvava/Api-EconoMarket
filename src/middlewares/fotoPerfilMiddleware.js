const express = require("express");

const LIMITE_FOTO = "2mb";

const lerImagem = express.raw({
  type: ["image/jpeg", "image/png", "image/webp"],
  limit: LIMITE_FOTO
});

// Lê o corpo binário da foto e devolve erros em JSON (sem página HTML do Express).
function receberFotoPerfil(req, res, next) {
  lerImagem(req, res, error => {
    if (!error) return next();

    if (error.type === "entity.too.large") {
      return res.status(413).json({ error: "A imagem deve ter no máximo 2 MB." });
    }

    console.error("Erro ao ler a imagem enviada:", error);
    return res.status(400).json({ error: "Não foi possível ler a imagem enviada." });
  });
}

module.exports = { receberFotoPerfil };
