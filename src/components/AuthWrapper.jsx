// src/components/AuthWrapper.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Chef d'orchestre de l'authentification HOMY.
//
// Affiche l'un des 4 états :
//  1. Chargement    → écran de chargement (pendant que Firebase vérifie)
//  2. DeviceSetup   → choix tablette/téléphone (1 seule fois par appareil)
//  3. Login         → page de connexion Google
//  4. App           → contenu principal (children)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  isDeviceConfigured,
  getDeviceType,
  configureAuthPersistence,
  onAuthStateChange,
} from "../services/session";
import DeviceSetup from "../pages/DeviceSetup";
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

  // État 3 : le type d'appareil (tablette/mobile) a-t-il été choisi ?
  // useState avec fonction lazy pour lire localStorage une seule fois au montage
  const [deviceConfigured, setDeviceConfigured] = useState(() =>
    isDeviceConfigured(),
  );

  useEffect(() => {
    // Si l'appareil n'est pas encore configuré → afficher DeviceSetup
    // Pas besoin d'initialiser Firebase Auth pour l'instant
    if (!deviceConfigured) {
      setLoading(false);
      return;
    }

    // L'appareil est configuré → configurer Firebase puis écouter l'état auth
    let unsubscribe;

    async function initAuth() {
      const deviceType = getDeviceType();

      // Configure la persistance AVANT d'écouter l'état (ordre important !)
      await configureAuthPersistence(deviceType);

      // Écoute les changements : connecté ↔ déconnecté
      unsubscribe = onAuthStateChange((firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    }

    initAuth().catch((err) => {
      console.error("[AuthWrapper] Erreur initialisation auth :", err);
      setLoading(false);
    });

    // Cleanup : se désabonner quand le composant est démonté
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [deviceConfigured]); // Se réexécute si deviceConfigured change (après DeviceSetup)

  // ── Callback appelé par DeviceSetup quand l'utilisateur a choisi ─────────────
  const handleDeviceSetupComplete = () => {
    // Le type d'appareil est maintenant dans localStorage
    // On passe deviceConfigured à true → useEffect se relance → Firebase s'initialise
    setDeviceConfigured(true);
    setLoading(true); // Remet le spinner pendant que Firebase s'initialise
  };

  // ── Rendu conditionnel ────────────────────────────────────────────────────────

  // 1. Chargement
  if (loading) {
    return <LoadingScreen />;
  }

  // 2. Premier lancement sur cet appareil → choisir le type
  if (!deviceConfigured) {
    return <DeviceSetup onComplete={handleDeviceSetupComplete} />;
  }

  // 3. Appareil configuré mais pas connecté → page de connexion
  if (!user) {
    return <Login />;
  }

  // 4. Connecté → afficher l'application
  return <>{children}</>;
}
