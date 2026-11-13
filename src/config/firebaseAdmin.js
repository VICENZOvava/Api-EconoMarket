function obterFirebaseAuth() {
    const contaJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!contaJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const error = new Error("Firebase Admin não configurado.");
        error.code = "FIREBASE_ADMIN_NOT_CONFIGURED";
        throw error;
    }

    // require dentro da função: só carrega o Firebase quando o login Firebase é usado
    const { initializeApp, applicationDefault, cert, getApps } = require("firebase-admin/app");
    const { getAuth } = require("firebase-admin/auth");

    const nomeApp = "economarket-auth";
    let app = getApps().find((item) => item.name === nomeApp);

    if (!app) {
        let credential;

        if (contaJson) {
            const conta = JSON.parse(contaJson);
            conta.private_key = conta.private_key.replace(/\\n/g, "\n");
            credential = cert(conta);
        } else {
            credential = applicationDefault();
        }

        const opcoes = { credential };

        if (process.env.FIREBASE_PROJECT_ID) {
            opcoes.projectId = process.env.FIREBASE_PROJECT_ID;
        }

        app = initializeApp(opcoes, nomeApp);
    }

    return getAuth(app);
}

module.exports = { obterFirebaseAuth };