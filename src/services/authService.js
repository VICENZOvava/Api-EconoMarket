const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/auth");

function gerarToken(usuario) {
    return jwt.sign(
        {
            id: usuario.id,
            email: usuario.email,
            provedor: usuario.provedor
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN
        }
    );
}

function criarErro(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function selecionarDadosPublicos(usuario) {
    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        provedor: usuario.provedor,
        papel: usuario.papel
    };
}

async function buscarUsuarioPorEmail(email) {
    return await prisma.usuario.findUnique({
        where: { email }
    });
}

async function buscarUsuarioPorId(id) {
    return await prisma.usuario.findUnique({
        where: { id: Number(id) }
    });
}

async function registrarUsuario(dados) {
    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const usuario = await prisma.usuario.create({
        data: {
            nome: dados.nome,
            email: dados.email,
            senhaHash,
            provedor: "LOCAL",
            atualizadoEm: new Date()
        },
        select: {
            id: true,
            nome: true,
            email: true,
            provedor: true,
            papel: true,
            criadoEm: true,
            atualizadoEm: true
        }
    });

    const token = gerarToken(usuario);

    return {
        usuario,
        token
    };
}

async function loginUsuario(email, senha) {
    const usuario = await buscarUsuarioPorEmail(email);

    if (!usuario || !usuario.senhaHash) {
        return null;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

    if (!senhaValida) {
        return null;
    }

    return {
        usuario: selecionarDadosPublicos(usuario),
        token: gerarToken(usuario)
    };
}

async function loginUsuarioFirebase(tokenFirebase, nomeInformado) {
    if (!tokenFirebase || !tokenFirebase.uid) {
        throw criarErro(401, "Token do Firebase inválido.");
    }

    if (!tokenFirebase.email) {
        throw criarErro(400, "A conta Firebase precisa ter um e-mail.");
    }

    if (tokenFirebase.email_verified !== true) {
        throw criarErro(403, "Verifique seu e-mail no Firebase antes de entrar no EconoMarket.");
    }

    const email = String(tokenFirebase.email).trim().toLowerCase();
    const firebaseUid = String(tokenFirebase.uid);
    const provedorFirebase = tokenFirebase.firebase?.sign_in_provider;
    const provedor = provedorFirebase === "google.com" ? "GOOGLE" : "LOCAL";

    let usuario = await prisma.usuario.findUnique({
        where: { firebaseUid }
    });

    if (!usuario) {
        const usuarioPorEmail = await buscarUsuarioPorEmail(email);

        if (usuarioPorEmail && usuarioPorEmail.firebaseUid && usuarioPorEmail.firebaseUid !== firebaseUid) {
            throw criarErro(409, "Este e-mail já está associado a outra conta do Firebase.");
        }

        if (usuarioPorEmail) {
            // Vincula uma conta antiga somente após o Firebase confirmar o e-mail.
            usuario = await prisma.usuario.update({
                where: { id: usuarioPorEmail.id },
                data: {
                    firebaseUid,
                    provedor,
                    atualizadoEm: new Date()
                }
            });
        } else {
            const nome = String(
                tokenFirebase.name || nomeInformado || email.split("@")[0]
            ).trim().slice(0, 120) || email.split("@")[0];

            usuario = await prisma.usuario.create({
                data: {
                    nome,
                    email,
                    firebaseUid,
                    provedor,
                    atualizadoEm: new Date()
                }
            });
        }
    } else if (usuario.email.toLowerCase() !== email) {
        const usuarioComEmail = await buscarUsuarioPorEmail(email);

        if (usuarioComEmail && usuarioComEmail.id !== usuario.id) {
            throw criarErro(409, "Não foi possível atualizar o e-mail porque ele já pertence a outra conta.");
        }

        usuario = await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
                email,
                atualizadoEm: new Date()
            }
        });
    }

    return {
        usuario: selecionarDadosPublicos(usuario),
        token: gerarToken(usuario)
    };
}

module.exports = {
    buscarUsuarioPorEmail,
    buscarUsuarioPorId,
    registrarUsuario,
    loginUsuario,
    loginUsuarioFirebase
};
