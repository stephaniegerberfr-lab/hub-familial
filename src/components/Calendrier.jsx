import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
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

function Calendrier({ membreActif }) {
  const [evenements, setEvenements] = useState([]);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [chargement, setChargement] = useState(true);

  // Nouvel événement
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [membre, setMembre] = useState("famille");

  // Écoute Firebase en temps réel
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "evenements"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Trie par date
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

  const couleurMembre = (membreId) => {
    return membres.find((m) => m.id === membreId)?.couleur || "#f2e8df";
  };

  const nomMembre = (membreId) => {
    return membres.find((m) => m.id === membreId)?.nom || "Famille";
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Regroupe par date
  const evenementsParDate = evenementsFiltres.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">📅 Calendrier</h2>
        <button
          onClick={() => setAfficherFormulaire(!afficherFormulaire)}
          className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm"
        >
          + Ajouter
        </button>
      </div>

      {/* Formulaire ajout */}
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

      {/* Chargement */}
      {chargement && (
        <div className="text-center text-gray-400 py-8">Chargement...</div>
      )}

      {/* Événements par date */}
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
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      {ev.titre}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {ev.heure} · {nomMembre(ev.membre)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* Calendrier vide */}
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
