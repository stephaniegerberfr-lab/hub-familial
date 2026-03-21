import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const membres = [
  { id: "camille", nom: "Camille", couleur: "#8EA48B", emoji: "👧" },
  { id: "chloe", nom: "Chloé", couleur: "#e9bcb5", emoji: "👧" },
  { id: "clement", nom: "Clément", couleur: "#e8a366", emoji: "👦" },
];

function Famille() {
  const [taches, setTaches] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "taches"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTaches(data);
      setChargement(false);
    });
    return () => unsub();
  }, []);

  // Calcule les points par membre
  const pointsParMembre = (membreId) => {
    return taches
      .filter((t) => t.membre === membreId && t.faite)
      .reduce((acc, t) => acc + (t.points || 0), 0);
  };

  // Points maximum pour la barre de progression
  const maxPoints = Math.max(...membres.map((m) => pointsParMembre(m.id)), 1);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">
          👨‍👩‍👧‍👦 Tableau des points
        </h2>
        <p className="text-gray-400 text-sm">
          Points gagnés en complétant les tâches
        </p>
      </div>

      {chargement && (
        <div className="text-center text-gray-400 py-8">Chargement...</div>
      )}

      {/* Carte par membre */}
      {membres.map((membre, index) => {
        const points = pointsParMembre(membre.id);
        const tachesFaites = taches.filter(
          (t) => t.membre === membre.id && t.faite,
        ).length;
        const tachesTotal = taches.filter((t) => t.membre === membre.id).length;
        const progression = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

        return (
          <div
            key={membre.id}
            className="bg-white rounded-2xl shadow-sm p-5 mb-3"
          >
            <div className="flex items-center gap-4">
              {/* Rang */}
              <div className="w-8 text-center font-bold text-gray-300 text-lg">
                {index + 1}
              </div>

              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: membre.couleur }}
              >
                {membre.emoji}
              </div>

              {/* Infos */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-gray-800">{membre.nom}</p>
                  <p className="font-bold text-indigo-600">⭐ {points} pts</p>
                </div>

                {/* Barre de progression */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${progression}%`,
                      backgroundColor: membre.couleur,
                    }}
                  />
                </div>

                <p className="text-gray-400 text-xs">
                  {tachesFaites}/{tachesTotal} tâches complétées
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Message si aucune tâche */}
      {!chargement && taches.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-4xl mb-2">🏆</p>
          <p className="font-semibold">Aucun point pour l'instant</p>
          <p className="text-sm">
            Complétez des tâches pour gagner des points !
          </p>
        </div>
      )}
    </div>
  );
}

export default Famille;
