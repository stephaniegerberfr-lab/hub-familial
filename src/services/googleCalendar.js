import { googleProvider, auth } from "./firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

// Connexion Google d'un membre et sauvegarde du token
export async function connecterGoogleCalendar(membreId) {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    // Récupère le token d'accès Google (méthode corrigée pour Firebase v9+)
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    const user = result.user;

    if (!accessToken) {
      throw new Error("Token d'accès Google non reçu");
    }

    // Récupère la liste des agendas disponibles pour ce compte
    const agendas = await recupererAgendas(accessToken);

    // Sauvegarde dans Firestore
    await setDoc(doc(db, "googleCalendarTokens", membreId), {
      membreId,
      accessToken,
      email: user.email,
      displayName: user.displayName,
      agendas, // liste des agendas disponibles
      agendasActifs: agendas.map((a) => a.id), // tous actifs par défaut
      connectedAt: new Date().toISOString(),
    });

    return { success: true, agendas, email: user.email };
  } catch (error) {
    console.error("Erreur connexion Google Calendar:", error);
    throw error;
  }
}

// Récupère la liste des agendas Google du compte connecté
export async function recupererAgendas(accessToken) {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Impossible de récupérer les agendas");
  }

  const data = await response.json();

  // Filtre pour garder seulement les agendas pertinents
  return data.items
    .filter((a) => !a.id.includes("holiday") && !a.id.includes("contacts"))
    .map((agenda) => ({
      id: agenda.id,
      nom: agenda.summary,
      couleur: agenda.backgroundColor || "#4A4E69",
      principal: agenda.primary || false,
    }));
}

// Récupère le token sauvegardé d'un membre
export async function getTokenMembre(membreId) {
  const snap = await getDoc(doc(db, "googleCalendarTokens", membreId));
  return snap.exists() ? snap.data() : null;
}

// Déconnecte un membre
export async function deconnecterGoogleCalendar(membreId) {
  await deleteDoc(doc(db, "googleCalendarTokens", membreId));
}

// Met à jour les agendas actifs d'un membre (pour Maman qui a 3 agendas)
export async function updateAgendasActifs(membreId, agendasActifs) {
  const ref = doc(db, "googleCalendarTokens", membreId);
  await setDoc(ref, { agendasActifs }, { merge: true });
}

// Importe les événements Google Calendar vers Firestore
export async function importerEvenements(membreId, accessToken, agendasActifs) {
  // Si le token n'est pas fourni, on le récupère depuis Firestore
  if (!accessToken || !agendasActifs) {
    const tokenData = await getTokenMembre(membreId);
    if (!tokenData) {
      throw new Error("Utilisateur non connecté");
    }
    accessToken = tokenData.accessToken;
    agendasActifs = tokenData.agendasActifs;
  }

  const maintenant = new Date();
  const dans3Mois = new Date();
  dans3Mois.setMonth(dans3Mois.getMonth() + 3);

  const evenements = [];

  for (const agendaId of agendasActifs) {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(agendaId)}/events`,
    );
    url.searchParams.set("timeMin", maintenant.toISOString());
    url.searchParams.set("timeMax", dans3Mois.toISOString());
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // ⚠️ NOUVEAU : Si erreur 401 (token expiré), on force une reconnexion
    if (response.status === 401) {
      console.error("❌ Token expiré - reconnexion nécessaire");
      throw new Error("RECONNEXION_REQUISE");
    }

    if (!response.ok) {
      console.error(`Erreur agenda ${agendaId}:`, response.status);
      continue;
    }

    const data = await response.json();
    console.log(
      `📅 ${data.items?.length || 0} événements trouvés dans ${agendaId}`,
    );

    for (const event of data.items || []) {
      const dateDebut = event.start?.dateTime
        ? event.start.dateTime.split("T")[0]
        : event.start?.date;

      evenements.push({
        id: `google_${event.id}`,
        titre: event.summary || "Sans titre",
        date: dateDebut, // ⚠️ AJOUT : propriété date pour compatibilité avec Calendrier.jsx
        debut: dateDebut,
        fin: event.end?.dateTime
          ? event.end.dateTime.split("T")[0]
          : event.end?.date,
        heureDebut: event.start?.dateTime
          ? new Date(event.start.dateTime).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        heureFin: event.end?.dateTime
          ? new Date(event.end.dateTime).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        lieu: event.location || "",
        description: event.description || "",
        membreId,
        membre: membreId, // ⚠️ AJOUT : alias pour compatibilité
        source: "google",
        googleEventId: event.id,
        agendaId,
        couleur: null,
      });
    }
  }

  // Sauvegarde dans Firestore
  for (const event of evenements) {
    await setDoc(doc(db, "evenements", event.id), event, { merge: true });
  }

  return evenements.length;
}
