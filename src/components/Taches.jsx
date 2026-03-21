import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
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

function Taches({ membreActif }) {
  const [taches, setTaches] = useState([]);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [chargement, setChargement] = useState(true);

  // Formulaire
  const [titre, setTitre] = useState("");
  const [membre, setMembre] = useState("famille");
  const [points, setPoints] = useState(10);

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

  const tachesFiltrees =
    membreActif === "famille"
      ? taches
      : taches.filter((t) => t.membre === membreActif);

  const couleurMembre = (membreId) =>
    membres.find((m) => m.id === membreId)?.couleur || "#f2e8df";

  const nomMembre = (membreId) =>
    membres.find((m) => m.id === membreId)?.nom || "Famille";

  const ajouterTache = async () => {
    if (!titre.trim()) return;
    await addDoc(collection(db, "taches"), {
      titre: titre.trim(),
      membre,
      points: Number(points),
      faite: false,
      createdAt: serverTimestamp(),
    });
    setTitre("");
    setMembre("famille");
    setPoints(10);
    setAfficherFormulaire(false);
  };

  const cocherTache = async (tacheId, faiteActuelle) => {
    await updateDoc(doc(db, "taches", tacheId), {
      faite: !faiteActuelle,
    });
  };

  const tachesAFaire = tachesFiltrees.filter((t) => !t.faite);
  const tachesFaites = tachesFiltrees.filter((t) => t.faite);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">✅ Tâches</h2>
        <button
          onClick={() => setAfficherFormulaire(!afficherFormulaire)}
          className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm"
        >
          + Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {afficherFormulaire && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">
            Nouvelle tâche
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Description de la tâche..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
            <div className="flex gap-2">
              <select
                value={membre}
                onChange={(e) => setMembre(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
              >
                {membres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
              <select
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value={5}>⭐ 5 pts</option>
                <option value={10}>⭐ 10 pts</option>
                <option value={15}>⭐ 15 pts</option>
                <option value={20}>⭐ 20 pts</option>
                <option value={25}>⭐ 25 pts</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={ajouterTache}
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

      {/* Tâches à faire */}
      {tachesAFaire.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-500 mb-3">
            À faire ({tachesAFaire.length})
          </h3>
          <div className="flex flex-col gap-2">
            {tachesAFaire.map((tache) => (
              <div
                key={tache.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: couleurMembre(tache.membre) }}
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">
                    {tache.titre}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {nomMembre(tache.membre)} · ⭐ {tache.points} pts
                  </p>
                </div>
                <button
                  onClick={() => cocherTache(tache.id, tache.faite)}
                  className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-emerald-600"
                >
                  ✓ Fait
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tâches faites */}
      {tachesFaites.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 opacity-60">
          <h3 className="text-sm font-bold text-gray-500 mb-3">
            Terminées ({tachesFaites.length})
          </h3>
          <div className="flex flex-col gap-2">
            {tachesFaites.map((tache) => (
              <div
                key={tache.id}
                onClick={() => cocherTache(tache.id, tache.faite)}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">✓</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-400 text-sm line-through">
                    {tache.titre}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {nomMembre(tache.membre)} · ⭐ {tache.points} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vide */}
      {!chargement && tachesFiltrees.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-4xl mb-2">✨</p>
          <p className="font-semibold">Aucune tâche</p>
          <p className="text-sm">Ajoute la première tâche !</p>
        </div>
      )}
    </div>
  );
}

export default Taches;
