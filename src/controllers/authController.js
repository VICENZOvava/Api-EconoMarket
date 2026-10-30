const usuarioService = require("../services/usuarioService");
const authService = require("../services/authService");
const { obterFirebaseAuth } = require("../config/firebaseAdmin");

async function registrar(req, res) {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                error: "Nome, email e senha são obrigatórios"
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                error: "A senha deve ter pelo menos 6 caracteres"
            });
        }

        const usuarioExistente =
            await authService.buscarUsuarioPorEmail(email);

        if (usuarioExistente) {
            return res.status(409).json({
                error: "Email já cadastrado"
            });
        }

        const resultado = await authService.registrarUsuario({
            nome,
            email,
            senha
        });

        return res.status(201).json(resultado);

    } catch (error) {
        console.error("Erro ao registrar usuário:", error);

        return res.status(500).json({
            error: "Erro ao registrar usuário"
        });
    }
}

async function login(req, res) {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                error: "Email e senha são obrigatórios"
            });
        }

        const resultado = await authService.loginUsuario(
            email,
            senha
        );

        if (!resultado) {
            return res.status(401).json({
                error: "Email ou senha inválidos"
            });
        }

        return res.status(200).json(resultado);

    } catch (error) {
        console.error("Erro ao realizar login:", error);

        return res.status(500).json({
            error: "Erro ao realizar login"
        });
    }
}

async function loginFirebase(req, res) {
    try {
        const { idToken, nome } = req.body || {};

        if (!idToken || typeof idToken !== "string") {
            return res.status(400).json({
                error: "Token de autenticação do Firebase é obrigatório."
            });
        }

        const firebaseAuth = obterFirebaseAuth();
        const tokenVerificado = await firebaseAuth.verifyIdToken(idToken);
        const resultado = await authService.loginUsuarioFirebase(tokenVerificado, nome);

        return res.status(200).json(resultado);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.message
            });
        }

        if (error.code === "FIREBASE_ADMIN_NOT_CONFIGURED") {
            return res.status(500).json({
                error: "O Firebase ainda não foi configurado no backend. Confira as credenciais administrativas no .env da API."
            });
        }

        if (typeof error.code === "string" && error.code.startsWith("auth/")) {
            return res.status(401).json({
                error: "Token do Firebase inválido ou expirado. Entre novamente."
            });
        }

        console.error("Erro no login Firebase:", error.code || error.message);

        return res.status(500).json({
            error: "Não foi possível concluir o login com Firebase."
        });
    }
}

async function me(req, res) {
    try {
        const usuario = await authService.buscarUsuarioPorId(
            req.usuario.id
        );

        if (!usuario) {
            return res.status(404).json({
                error: "Usuário não encontrado"
            });
        }

        return res.status(200).json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            provedor: usuario.provedor,
            papel: usuario.papel,
            temFoto: await usuarioService.usuarioTemFoto(usuario.id)
        });

    } catch (error) {
        console.error(
            "Erro ao buscar usuário autenticado:",
            error
        );

        return res.status(500).json({
            error: "Erro ao buscar usuário autenticado"
        });
    }
}

module.exports = {
    registrar,
    login,
    loginFirebase,
    me
};