// src/services/session.js
// ─────────────────────────────────────────────────────────────────────────────
// Gestion de la session HOMY
//
// LOGIQUE :
//  - Tablette murale  → browserLocalPersistence  → session permanente
//  - PC               → browserLocalPersistence  → session permanente
//  - Téléphone        → browserSessionPersistence → session temporaire
//
// La clé 'homy_device_type' dans localStorage mémorise le type d'appareil.
// Elle est détectée automatiquement au premier lancement.
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
import { auth } from "./firebase"; // ⚠️ Vérifie que ce chemin correspond bien à ton fichier firebase.js

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Clé utilisée dans localStorage pour mémoriser le type d'appareil */
const DEVICE_KEY = "homy_device_type";
const SESSION_EXPIRY_KEY = "homy_session_expiry";

/** Valeurs possibles pour le type d'appareil */
export const DeviceType = {
  TABLET: "tablet",
  MOBILE: "mobile",
  DESKTOP: "desktop",
};

// ─── Gestion du type d'appareil ───────────────────────────────────────────────

/**
 * Récupère le type d'appareil configuré sur cet appareil.
 * @returns {'tablet' | 'mobile' | null}
 */
export function getDeviceType() {
  return localStorage.getItem(DEVICE_KEY) || detectDeviceType();
}

/**
 * Réinitialise le type d'appareil (utile depuis les Paramètres).
 * L'utilisateur devra être redétecté au prochain démarrage.
 */
export function resetDeviceType() {
  localStorage.removeItem(DEVICE_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
}

/**
 * Détecte automatiquement le type d'appareil en fonction du navigateur.
 * Retourne 'mobile', 'tablet' ou 'desktop'.
 */
export function detectDeviceType() {
  if (typeof navigator === "undefined") return DeviceType.DESKTOP;

  const ua = navigator.userAgent || navigator.vendor || "";
  const isAndroid = /Android/i.test(ua);
  const isTabletUa =
    /Tablet|iPad|PlayBook|Silk/i.test(ua) ||
    (isAndroid && !/Mobile/i.test(ua)) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMobileUa = /Mobi|Android|iPhone|iPod|Windows Phone|BlackBerry/i.test(
    ua,
  );

  if (isTabletUa) return DeviceType.TABLET;
  if (isMobileUa) return DeviceType.MOBILE;

  const hasTouch =
    navigator.maxTouchPoints > 1 || navigator.msMaxTouchPoints > 1;
  const width = window.screen?.width || 0;
  if (hasTouch && width >= 768 && width < 1440) return DeviceType.TABLET;

  return DeviceType.DESKTOP;
}

function getExpiryDays(deviceType) {
  return deviceType === DeviceType.MOBILE ? 30 : 365;
}

export function getSessionExpiry() {
  return localStorage.getItem(SESSION_EXPIRY_KEY);
}

export function setSessionExpiry(deviceType) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + getExpiryDays(deviceType));
  localStorage.setItem(SESSION_EXPIRY_KEY, expiryDate.toISOString());
}

export function isSessionValid() {
  const expiry = getSessionExpiry();
  if (!expiry) return false;
  return new Date(expiry) > new Date();
}

export function ensureDeviceConfigured() {
  let deviceType = localStorage.getItem(DEVICE_KEY);
  if (!deviceType) {
    deviceType = detectDeviceType();
    localStorage.setItem(DEVICE_KEY, deviceType);
  }
  return deviceType;
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
      deviceType === DeviceType.MOBILE
        ? browserSessionPersistence
        : browserLocalPersistence;

    await setPersistence(auth, persistence);
  } catch (error) {
    console.error(
      "[Session] Erreur configuration persistance Firebase :",
      error,
    );
  }
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
  const deviceType = getDeviceType();
  setSessionExpiry(deviceType);
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
  localStorage.removeItem(SESSION_EXPIRY_KEY);
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
export async function ensureSessionValidity() {
  if (!isSessionValid()) {
    await signOut(auth);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  }
}

export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}
