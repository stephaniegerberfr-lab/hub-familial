import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

let currentUser = null;
let authInitialized = false;
let authPromise = null;

// Initialiser l'authentification une seule fois
export function initializeAuth() {
  if (authPromise) return authPromise;

  authPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      authInitialized = true;
      console.log("🔐 Auth State Changed:", user ? user.email : "Pas de user");
      unsubscribe(); // On unsubscribe après la première vérification
      resolve(user);
    });
  });

  return authPromise;
}

export function getCurrentUser() {
  return currentUser;
}

export function isAuthInitialized() {
  return authInitialized;
}

export function getAuthPromise() {
  return authPromise;
}
