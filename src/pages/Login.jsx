// src/pages/Login.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Page de connexion HOMY.
// Affichée quand l'utilisateur n'est pas connecté à Firebase Auth.
//
//  - Sur tablette : apparaît seulement au tout premier usage ou après déconnexion.
//  - Sur mobile   : apparaît à chaque nouvelle session navigateur.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  signInWithGoogle,
  getDeviceType,
  DeviceType,
} from "../services/session";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Détecte le type d'appareil pour adapter le message
  const isTablet = getDeviceType() === DeviceType.TABLET;

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // Pas besoin de navigation manuelle :
      // onAuthStateChanged dans AuthWrapper détecte automatiquement la connexion
      // et affiche le contenu de l'app.
    } catch (err) {
      console.error("[Login] Erreur connexion Google :", err);

      // Traduction des codes d'erreur Firebase courants
      if (err.code === "auth/popup-closed-by-user") {
        setError("Fenêtre de connexion fermée. Veuillez réessayer.");
      } else if (err.code === "auth/popup-blocked") {
        setError(
          "Les popups sont bloquées par votre navigateur. Autorisez-les pour ce site.",
        );
      } else if (err.code === "auth/network-request-failed") {
        setError("Pas de connexion internet. Vérifiez votre réseau.");
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* ── En-tête HOMY ─────────────────────────────────────────────────── */}
      <div className="mb-10 text-center">
        <h1
          className="text-5xl font-bold tracking-tight"
          style={{ color: "#4A4E69" }}
        >
          HOMY
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Votre hub familial numérique
        </p>
      </div>

      {/* ── Carte de connexion ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden">
        {/* Bande colorée en haut */}
        <div className="h-1.5 w-full" style={{ background: "#4A4E69" }} />

        <div className="p-8">
          {/* Icône de bienvenue */}
          <div className="flex justify-center mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
              style={{ background: "#4A4E69" }}
            >
              🏠
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-700 text-center">
            {isTablet ? "Bienvenue sur HOMY" : "Connexion"}
          </h2>

          <p className="text-slate-400 text-sm text-center mt-2 mb-7">
            {isTablet
              ? "Connectez-vous pour accéder à votre espace familial."
              : "Identifiez-vous pour accéder à vos données."}
          </p>

          {/* ── Message d'erreur ─────────────────────────────────────────── */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* ── Bouton Google ────────────────────────────────────────────── */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border-2 font-medium text-sm transition-all duration-150
              ${
                loading
                  ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] shadow-sm"
              }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                <span>Connexion en cours…</span>
              </>
            ) : (
              <>
                {/* Logo Google officiel (SVG inline) */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Se connecter avec Google</span>
              </>
            )}
          </button>

          {/* Note de sécurité */}
          <p className="text-xs text-slate-400 text-center mt-5 leading-relaxed">
            Seuls les membres de la famille autorisés
            <br />
            peuvent accéder à cet espace.
          </p>
        </div>
      </div>

      {/* Indicateur du type d'appareil (discret) */}
      <p className="mt-6 text-xs text-slate-300 flex items-center gap-1.5">
        {isTablet ? "🖥️ Mode tablette" : "📱 Mode téléphone"}
      </p>
    </div>
  );
}
