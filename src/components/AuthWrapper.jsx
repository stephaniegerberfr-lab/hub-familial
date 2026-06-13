// src/components/AuthWrapper.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Chef d'orchestre de l'authentification HOMY.
//
// Affiche l'un des 3 états :
//  1. Chargement    → écran de chargement (pendant que Firebase vérifie)
//  2. Login         → page de connexion Google
//  3. App           → contenu principal (children)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  ensureDeviceConfigured,
  configureAuthPersistence,
  ensureSessionValidity,
  onAuthStateChange,
} from "../services/session";
import Login from "../pages/Login";

// ─── Écran de chargement ──────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      {/* Logo HOMY */}
      <div className="text-center">
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ color: "#4A4E69" }}
        >
          HOMY
        </h1>
        <p className="text-slate-400 text-sm mt-1">Votre hub familial</p>
      </div>

      {/* Spinner */}
      <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#4A4E69] animate-spin mt-2" />
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

/**
 * AuthWrapper enveloppe toute l'application.
 * Il suffit de le placer dans App.jsx autour du contenu existant.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function AuthWrapper({ children }) {
  // État 1 : chargement en cours (Firebase initialise)
  const [loading, setLoading] = useState(true);

  // État 2 : utilisateur Firebase connecté (ou null)
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsubscribe;

    async function initAuth() {
      try {
        const deviceType = ensureDeviceConfigured();
        await configureAuthPersistence(deviceType);
        await ensureSessionValidity();

        unsubscribe = onAuthStateChange((firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        });
      } catch (err) {
        console.error("[AuthWrapper] Erreur initialisation auth :", err);
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ── Rendu conditionnel ────────────────────────────────────────────────────────

  // 1. Chargement
  if (loading) {
    return <LoadingScreen />;
  }

  // 2. Appareil configuré / détecté, mais pas connecté → page de connexion
  if (!user) {
    return <Login />;
  }

  // 4. Connecté → afficher l'application
  return <>{children}</>;
}
