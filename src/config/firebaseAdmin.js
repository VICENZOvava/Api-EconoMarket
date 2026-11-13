 const { initializeApp, applicationDefault, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

function obterFirebaseAuth() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const error = new Error("Firebase Admin não configurado. Configure GOOGLE_APPLICATION_CREDENTIALS no .env da API.");
        error.code = "FIREBASE_ADMIN_NOT_CONFIGURED";
        throw error;
    }

    const nomeApp = "economarket-auth";
    let app = getApps().find((item) => item.name === nomeApp);

    if (!app) {
        const opcoes = {
            credential: applicationDefault()
        };

        if (process.env.FIREBASE_PROJECT_ID) {
            opcoes.projectId = process.env.FIREBASE_PROJECT_ID;
        }

        app = initializeApp(opcoes, nomeApp);
    }

    return getAuth(app);
}

module.exports = {
    obterFirebaseAuth
};
