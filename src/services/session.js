// src/services/session.js
// ─────────────────────────────────────────────────────────────────────────────
// Gestion de la session HOMY
//
// LOGIQUE :
//  - Tablette murale  → browserLocalPersistence  → session PERMANENTE
//  - Téléphone        → browserSessionPersistence → session par onglet navigateur
//
// La clé 'homy_device_type' dans localStorage mémorise le choix de l'appareil.
// Elle est définie UNE SEULE FOIS au premier lancement, via DeviceSetup.jsx.
// ─────────────────────────────────────────────────────────────────────────────

import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase"; // ⚠️ Vérifie que ce chemin correspond bien à ton fichier firebase.js

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Clé utilisée dans localStorage pour mémoriser le type d'appareil */
const DEVICE_KEY = "homy_device_type";

/** Valeurs possibles pour le type d'appareil */
export const DeviceType = {
  TABLET: "tablet",
  MOBILE: "mobile",
};

// ─── Gestion du type d'appareil ───────────────────────────────────────────────

/**
 * Récupère le type d'appareil configuré sur cet appareil.
 * @returns {'tablet' | 'mobile' | null}
 */
export function getDeviceType() {
  return localStorage.getItem(DEVICE_KEY);
}

/**
 * Vérifie si le type d'appareil a déjà été configuré.
 * @returns {boolean}
 */
export function isDeviceConfigured() {
  return !!localStorage.getItem(DEVICE_KEY);
}

/**
 * Réinitialise le type d'appareil (utile depuis les Paramètres).
 * L'utilisateur devra rechoisir au prochain démarrage.
 */
export function resetDeviceType() {
  localStorage.removeItem(DEVICE_KEY);
}

// ─── Configuration Firebase Auth ──────────────────────────────────────────────

/**
 * Configure la persistance Firebase selon le type d'appareil.
 *
 * Tablette → browserLocalPersistence  : stocké dans localStorage,
 *            survit aux rechargements, fermetures de navigateur, redémarrages.
 *
 * Mobile   → browserSessionPersistence : stocké dans sessionStorage,
 *            effacé à la fermeture de l'onglet/navigateur.
 *            Chaque nouvelle session nécessite une reconnexion.
 *
 * ⚠️ IMPORTANT : doit être appelée AVANT signInWithPopup / signInWithRedirect.
 *
 * @param {'tablet' | 'mobile'} deviceType
 */
export async function configureAuthPersistence(deviceType) {
  try {
    const persistence =
      deviceType === DeviceType.TABLET
        ? browserLocalPersistence
        : browserSessionPersistence;

    await setPersistence(auth, persistence);
  } catch (error) {
    console.error(
      "[Session] Erreur configuration persistance Firebase :",
      error,
    );
  }
}

/**
 * Enregistre le type d'appareil ET configure immédiatement la persistance Firebase.
 * Appelé depuis DeviceSetup.jsx (une seule fois au premier lancement).
 *
 * @param {'tablet' | 'mobile'} deviceType
 */
export async function setupDevice(deviceType) {
  localStorage.setItem(DEVICE_KEY, deviceType);
  await configureAuthPersistence(deviceType);
}

// ─── Authentification Google ──────────────────────────────────────────────────

/**
 * Déclenche la connexion Google via une popup.
 * Retourne l'utilisateur Firebase connecté.
 *
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  // Scopes minimum requis pour identifier l'utilisateur
  provider.addScope("profile");
  provider.addScope("email");

  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Déconnecte l'utilisateur de Firebase Auth.
 * Sur tablette : la persistance reste configurée, la prochaine connexion sera automatique
 *                si l'utilisateur se reconnecte.
 * Sur mobile   : sessionStorage est vidé → reconnexion requise.
 */
export async function signOutUser() {
  await signOut(auth);
}

// ─── Écoute de l'état d'authentification ──────────────────────────────────────

/**
 * S'abonne aux changements d'état de connexion Firebase.
 * Retourne la fonction de désabonnement (à appeler dans useEffect cleanup).
 *
 * Usage :
 *   const unsubscribe = onAuthStateChange((user) => { ... });
 *   return () => unsubscribe(); // dans useEffect
 *
 * @param {function(import('firebase/auth').User | null): void} callback
 * @returns {function} unsubscribe
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}
