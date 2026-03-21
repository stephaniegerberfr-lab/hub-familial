import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const membres = [
  { id: "famille", nom: "Famille", couleur: "#f2e8df" },
  { id: "papa", nom: "Papa", couleur: "#78bae4" },
  { id: "maman", nom: "Maman", couleur: "#ab8fe3" },
  { id: "camille", nom: "Camille", couleur: "#8EA48B" },
  { id: "chloe", nom: "Chloé", couleur: "#e9bcb5" },
  { id: "clement", nom: "Clément", couleur: "#e8a366" },
];

const tachesTest = [
  {
    id: 1,
    titre: "Sortir les poubelles",
    membre: "clement",
    couleur: "#e8a366",
    emoji: "🗑️",
    points: 10,
  },
  {
    id: 2,
    titre: "Faire les courses",
    membre: "maman",
    couleur: "#ab8fe3",
    emoji: "🛒",
    points: 15,
  },
  {
    id: 3,
    titre: "Ranger le salon",
    membre: "camille",
    couleur: "#8EA48B",
    emoji: "🧹",
    points: 10,
  },
];

function Dashboard({ membreActif }) {
  const [evenements, setEvenements] = useState([]);
  const [chargement, setChargement] = useState(true);

  // Date d'aujourd'hui au format YYYY-MM-DD
  const aujourdhui = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "evenements"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Garde uniquement les événements d'aujourd'hui
      const aujourdhuiEv = data.filter((ev) => ev.date === aujourdhui);
      // Trie par heure
      aujourdhuiEv.sort((a, b) => a.heure.localeCompare(b.heure));
      setEvenements(aujourdhuiEv);
      setChargement(false);
    });
    return () => unsub();
  }, []);

  const couleurMembre = (membreId) =>
    membres.find((m) => m.id === membreId)?.couleur || "#f2e8df";

  const evenementsFiltres =
    membreActif === "famille"
      ? evenements
      : evenements.filter((e) => e.membre === membreActif);

  const tachesFiltrees =
    membreActif === "famille"
      ? tachesTest
      : tachesTest.filter((t) => t.membre === membreActif);

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      {/* Colonne gauche — Événements du jour */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📅 Aujourd'hui</h2>

        {chargement && <p className="text-gray-400 text-sm">Chargement...</p>}

        {!chargement && evenementsFiltres.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-sm font-semibold">Rien de prévu aujourd'hui !</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {evenementsFiltres.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
            >
              <div
                className="w-10 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: couleurMembre(ev.membre) }}
              />
              <div>
                <p className="font-bold text-gray-800 text-sm">{ev.titre}</p>
                <p className="text-gray-400 text-xs">{ev.heure}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Colonne droite — Tâches */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          ✅ Tâches du jour
        </h2>

        {tachesFiltrees.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            <p className="text-3xl mb-2">✨</p>
            <p className="text-sm font-semibold">Aucune tâche !</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tachesFiltrees.map((tache) => (
              <div
                key={tache.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: tache.couleur }}
                >
                  {tache.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">
                    {tache.titre}
                  </p>
                  <p className="text-gray-400 text-xs">
                    ⭐ {tache.points} points
                  </p>
                </div>
                <button className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-emerald-600">
                  ✓ Fait
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
