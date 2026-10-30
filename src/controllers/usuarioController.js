const bcrypt = require("bcryptjs");
const usuarioService = require("../services/usuarioService");

async function listarUsuarios(req, res) {
  try {
    const usuarios = await usuarioService.listarUsuarios();

    return res.status(200).json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return res.status(500).json({
      error: "Erro ao buscar usuários"
    });
  }
}

async function buscarUsuarioPorId(req, res) {
  try {
    const { id } = req.params;

    if (Number(id) !== Number(req.usuario.id)) {
      return res.status(403).json({
        error: "Você só pode acessar a sua própria conta"
      });
    }


    const usuario = await usuarioService.buscarUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({
        error: "Usuário não encontrado"
      });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      error: "Erro ao buscar usuário"
    });
  }
}

async function criarUsuario(req, res) {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                error: "Nome, email e senha são obrigatórios"
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const usuario = await usuarioService.criarUsuario({
            nome,
            email,
            senhaHash
        });

        return res.status(201).json(usuario);

    } catch (error) {
        console.error("Erro ao criar usuário:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                error: "Este email já está cadastrado"
            });
        }

        return res.status(500).json({
            error: "Erro ao criar usuário"
        });
    }
}

async function atualizarUsuario(req, res) {

  try {

    const { id } = req.params;


    if (Number(id) !== Number(req.usuario.id)) {

      return res.status(403).json({
        error: "Você só pode atualizar o seu próprio perfil"
      });

    }


    const usuarioExistente =
      await usuarioService.buscarUsuarioPorId(id);


    if (!usuarioExistente) {

      return res.status(404).json({
        error: "Usuário não encontrado"
      });

    }


    if (!req.body.nome || !req.body.email) {

      return res.status(400).json({
        error: "Nome e email são obrigatórios"
      });

    }


    const usuario =
      await usuarioService.atualizarUsuario(
        id,
        {
          nome: req.body.nome,
          email: req.body.email
        }
      );


    return res.status(200).json(usuario);


  } catch (error) {

    console.error(
      "Erro ao atualizar usuário:",
      error
    );


    if (error.code === "P2002") {

      return res.status(409).json({
        error: "Este email já está cadastrado"
      });

    }


    return res.status(500).json({
      error: "Erro ao atualizar usuário"
    });

  }

}

async function deletarUsuario(req, res) {
  try {
    const { id } = req.params;

    if (Number(id) !== Number(req.usuario.id)) {
      return res.status(403).json({
        error: "Você só pode acessar a sua própria conta"
      });
    }


    const usuarioExistente =
      await usuarioService.buscarUsuarioPorId(id);

    if (!usuarioExistente) {
      return res.status(404).json({
        error: "Usuário não encontrado"
      });
    }

    await usuarioService.deletarUsuario(id);

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);

    return res.status(500).json({
      error: "Erro ao deletar usuário"
    });
  }
}

const TIPOS_FOTO = {
  "image/jpeg": bytes => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": bytes => bytes.length > 8 && bytes.subarray(0, 8).equals(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ),
  "image/webp": bytes => bytes.length > 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
};

async function buscarMinhaFoto(req, res) {
  try {
    const foto = await usuarioService.buscarFotoPerfil(req.usuario.id);

    if (!foto) {
      return res.status(404).json({ error: "Foto de perfil não encontrada" });
    }

    res.set("Content-Type", foto.tipo);
    res.set("Cache-Control", "private, no-cache");
    res.set("X-Content-Type-Options", "nosniff");

    return res.status(200).send(Buffer.from(foto.dados));
  } catch (error) {
    console.error("Erro ao buscar foto de perfil:", error);
    return res.status(500).json({ error: "Erro ao buscar foto de perfil" });
  }
}

// O corpo é a imagem em binário (Content-Type image/jpeg, image/png ou image/webp).
// O dono é sempre o usuário do token; não existe ID de usuário na rota.
async function salvarMinhaFoto(req, res) {
  try {
    const tipo = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();

    if (!TIPOS_FOTO[tipo]) {
      return res.status(415).json({
        error: "Formato de imagem não suportado. Use JPEG, PNG ou WebP."
      });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "Nenhuma imagem foi enviada." });
    }

    // Confere o conteúdo real do arquivo, não apenas o cabeçalho informado.
    if (!TIPOS_FOTO[tipo](req.body)) {
      return res.status(400).json({
        error: "O arquivo enviado não é uma imagem válida."
      });
    }

    await usuarioService.salvarFotoPerfil(req.usuario.id, tipo, req.body);

    return res.status(200).json({ message: "Foto de perfil salva" });
  } catch (error) {
    console.error("Erro ao salvar foto de perfil:", error);
    return res.status(500).json({ error: "Erro ao salvar foto de perfil" });
  }
}

async function removerMinhaFoto(req, res) {
  try {
    await usuarioService.removerFotoPerfil(req.usuario.id);
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover foto de perfil:", error);
    return res.status(500).json({ error: "Erro ao remover foto de perfil" });
  }
}

module.exports = {
  buscarMinhaFoto,
  salvarMinhaFoto,
  removerMinhaFoto,
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario
};