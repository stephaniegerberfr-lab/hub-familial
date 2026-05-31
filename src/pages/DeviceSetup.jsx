// src/pages/DeviceSetup.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Page de configuration initiale — s'affiche UNE SEULE FOIS par appareil.
// L'utilisateur choisit si c'est une tablette murale ou un téléphone.
// Ce choix est mémorisé dans localStorage et détermine la politique de session.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { setupDevice, DeviceType } from "../services/session";

/**
 * @param {{ onComplete: function }} props
 *   onComplete : appelé après confirmation, signale à AuthWrapper que c'est fait.
 */
export default function DeviceSetup({ onComplete }) {
  const [selected, setSelected] = useState(null); // DeviceType.TABLET | DeviceType.MOBILE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    if (!selected || loading) return;
    setLoading(true);
    setError(null);

    try {
      // Enregistre le choix ET configure la persistance Firebase
      await setupDevice(selected);
      onComplete(selected);
    } catch (err) {
      console.error("[DeviceSetup] Erreur :", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
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

      {/* ── Carte principale ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Bande colorée en haut */}
        <div className="h-1.5 w-full" style={{ background: "#4A4E69" }} />

        <div className="p-8">
          <h2 className="text-xl font-semibold text-slate-700 text-center">
            Configuration de l'appareil
          </h2>
          <p className="text-slate-400 text-sm text-center mt-2 mb-7">
            Ce choix détermine la politique de connexion.
            <br />
            Il ne vous sera demandé qu'<strong>une seule fois</strong>.
          </p>

          {/* ── Option Tablette ─────────────────────────────────────────── */}
          <button
            onClick={() => setSelected(DeviceType.TABLET)}
            className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150 mb-4
              ${
                selected === DeviceType.TABLET
                  ? "border-[#4A4E69] bg-[#4A4E69]/5 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            <div className="flex items-start gap-4">
              {/* Icône */}
              <div
                className={`text-3xl p-2 rounded-xl transition-colors ${
                  selected === DeviceType.TABLET
                    ? "bg-[#4A4E69]/10"
                    : "bg-slate-100"
                }`}
              >
                🖥️
              </div>

              {/* Texte */}
              <div className="flex-1">
                <p className="font-semibold text-slate-700">Tablette murale</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Session{" "}
                  <span className="font-medium text-green-600">permanente</span>{" "}
                  — reste connectée en permanence, même après un redémarrage.
                </p>
              </div>

              {/* Coche de sélection */}
              {selected === DeviceType.TABLET && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#4A4E69" }}
                >
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* ── Option Téléphone ────────────────────────────────────────── */}
          <button
            onClick={() => setSelected(DeviceType.MOBILE)}
            className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-150
              ${
                selected === DeviceType.MOBILE
                  ? "border-[#4A4E69] bg-[#4A4E69]/5 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            <div className="flex items-start gap-4">
              {/* Icône */}
              <div
                className={`text-3xl p-2 rounded-xl transition-colors ${
                  selected === DeviceType.MOBILE
                    ? "bg-[#4A4E69]/10"
                    : "bg-slate-100"
                }`}
              >
                📱
              </div>

              {/* Texte */}
              <div className="flex-1">
                <p className="font-semibold text-slate-700">Téléphone</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Connexion{" "}
                  <span className="font-medium text-amber-600">requise</span> à
                  chaque nouvelle session — protège l'accès personnel.
                </p>
              </div>

              {/* Coche de sélection */}
              {selected === DeviceType.MOBILE && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#4A4E69" }}
                >
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* ── Message d'erreur ─────────────────────────────────────────── */}
          {error && (
            <p className="mt-4 text-sm text-red-600 text-center bg-red-50 rounded-lg p-3 border border-red-200">
              {error}
            </p>
          )}

          {/* ── Bouton Confirmer ─────────────────────────────────────────── */}
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className={`mt-6 w-full py-3.5 rounded-xl font-semibold text-white text-sm tracking-wide transition-all duration-150
              ${
                selected && !loading
                  ? "bg-[#4A4E69] hover:bg-[#3d4060] active:scale-[0.98] shadow-sm"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Configuration...
              </span>
            ) : (
              "Confirmer mon choix"
            )}
          </button>

          {/* Note explicative */}
          <p className="text-xs text-slate-400 text-center mt-4">
            Vous pourrez modifier ce choix dans les Paramètres de l'application.
          </p>
        </div>
      </div>
    </div>
  );
}
