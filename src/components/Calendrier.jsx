import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const membres = [
  { id: "famille", nom: "Famille", couleur: "#f2e8df" },
  { id: "papa", nom: "Papa", couleur: "#78bae4" },
  { id: "maman", nom: "Maman", couleur: "#ab8fe3" },
  { id: "camille", nom: "Camille", couleur: "#8EA48B" },
  { id: "chloe", nom: "Chloé", couleur: "#e9bcb5" },
  { id: "clement", nom: "Clément", couleur: "#e8a366" },
];

function exporterIcal(evenement) {
  const dateDebut = evenement.date.replace(/-/g, "");
  const heureDebut = evenement.heure.replace(":", "");
  const heureFin = String(Number(heureDebut) + 100).padStart(4, "0");

  const contenu = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hub Familial//FR",
    "BEGIN:VEVENT",
    `DTSTART:${dateDebut}T${heureDebut}00`,
    `DTEND:${dateDebut}T${heureFin}00`,
    `SUMMARY:${evenement.titre}`,
    `DESCRIPTION:Événement partagé depuis Hub Familial`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([contenu], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `${evenement.titre}.ics`;
  lien.click();
  URL.revokeObjectURL(url);
}

function Calendrier({ membreActif }) {
  const [evenements, setEvenements] = useState([]);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [chargement, setChargement] = useState(true);

  const [titre, setTitre] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [membre, setMembre] = useState("famille");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "evenements"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      data.sort(
        (a, b) =>
          new Date(a.date + "T" + a.heure) - new Date(b.date + "T" + b.heure),
      );
      setEvenements(data);
      setChargement(false);
    });
    return () => unsub();
  }, []);

  const evenementsFiltres =
    membreActif === "famille"
      ? evenements
      : evenements.filter((e) => e.membre === membreActif);

  const ajouterEvenement = async () => {
    if (!titre.trim() || !date) return;
    await addDoc(collection(db, "evenements"), {
      titre: titre.trim(),
      date,
      heure: heure || "00:00",
      membre,
      createdAt: serverTimestamp(),
    });
    setTitre("");
    setDate("");
    setHeure("");
    setMembre("famille");
    setAfficherFormulaire(false);
  };

  const supprimerEvenement = async (evenementId) => {
    await deleteDoc(doc(db, "evenements", evenementId));
  };

  const couleurMembre = (membreId) =>
    membres.find((m) => m.id === membreId)?.couleur || "#f2e8df";

  const nomMembre = (membreId) =>
    membres.find((m) => m.id === membreId)?.nom || "Famille";

  const formatDate = (dateStr) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  const evenementsParDate = evenementsFiltres.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">📅 Calendrier</h2>
        <button
          onClick={() => setAfficherFormulaire(!afficherFormulaire)}
          className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm"
        >
          + Ajouter
        </button>
      </div>

      {afficherFormulaire && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">
            Nouvel événement
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre de l'événement..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
              <input
                type="time"
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <select
              value={membre}
              onChange={(e) => setMembre(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            >
              {membres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={ajouterEvenement}
                className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl hover:bg-indigo-700 text-sm"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setAfficherFormulaire(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {chargement && (
        <div className="text-center text-gray-400 py-8">Chargement...</div>
      )}

      {Object.keys(evenementsParDate)
        .sort()
        .map((dateStr) => (
          <div key={dateStr} className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2 capitalize">
              {formatDate(dateStr)}
            </p>
            <div className="flex flex-col gap-2">
              {evenementsParDate[dateStr].map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: couleurMembre(ev.membre) }}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">
                      {ev.titre}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {ev.heure} · {nomMembre(ev.membre)}
                    </p>
                  </div>
                  <button
                    onClick={() => exporterIcal(ev)}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-3 py-1 rounded-lg transition-all"
                  >
                    📤 .ics
                  </button>
                  <button
                    onClick={() => supprimerEvenement(ev.id)}
                    className="text-gray-300 hover:text-red-400 transition-all text-lg px-1"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

      {!chargement && evenementsFiltres.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-4xl mb-2">📅</p>
          <p className="font-semibold">Aucun événement</p>
          <p className="text-sm">Ajoute ton premier événement !</p>
        </div>
      )}
    </div>
  );
}

export default Calendrier;
