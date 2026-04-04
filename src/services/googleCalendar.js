import { googleProvider, auth } from "./firebase";
import { signInWithPopup } from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

// Connexion Google d'un membre et sauvegarde du token
export async function connecterGoogleCalendar(membreId) {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    // Récupère le token d'accès Google (clé temporaire pour l'API Calendar)
    const credential = result.credential;
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

    if (!response.ok) continue;

    const data = await response.json();

    for (const event of data.items || []) {
      evenements.push({
        id: `google_${event.id}`,
        titre: event.summary || "Sans titre",
        debut: event.start?.dateTime || event.start?.date,
        fin: event.end?.dateTime || event.end?.date,
        lieu: event.location || "",
        description: event.description || "",
        membreId,
        source: "google",
        googleEventId: event.id,
        agendaId,
        couleur: null, // sera définie par la couleur du membre
      });
    }
  }

  // Sauvegarde dans Firestore
  for (const event of evenements) {
    await setDoc(doc(db, "evenements", event.id), event, { merge: true });
  }

  return evenements.length;
}
