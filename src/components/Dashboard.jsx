import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";

const membres = [
  { id: "famille", nom: "Famille", couleur: "#f2e8df" },
  { id: "papa", nom: "Papa", couleur: "#78bae4" },
  { id: "maman", nom: "Maman", couleur: "#ab8fe3" },
  { id: "camille", nom: "Camille", couleur: "#8EA48B" },
  { id: "chloe", nom: "Chloé", couleur: "#e9bcb5" },
  { id: "clement", nom: "Clément", couleur: "#e8a366" },
];

const enfants = [
  { id: "camille", nom: "Camille", couleur: "#8EA48B", emoji: "🌿" },
  { id: "chloe", nom: "Chloé", couleur: "#e9bcb5", emoji: "🌸" },
  { id: "clement", nom: "Clément", couleur: "#e8a366", emoji: "🍊" },
];

function Dashboard({ membreActif }) {
  const [evenements, setEvenements] = useState([]);
  const [taches, setTaches] = useState([]);
  const [chargement, setChargement] = useState(true);

  const aujourdhui = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const unsubEv = onSnapshot(collection(db, "evenements"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const aujourdhuiEv = data.filter((ev) => ev.date === aujourdhui);
      aujourdhuiEv.sort((a, b) => a.heure.localeCompare(b.heure));
      setEvenements(aujourdhuiEv);
    });

    const unsubTaches = onSnapshot(collection(db, "taches"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTaches(data);
      setChargement(false);
    });

    return () => {
      unsubEv();
      unsubTaches();
    };
  }, []);

  const couleurMembre = (membreId) =>
    membres.find((m) => m.id === membreId)?.couleur || "#f2e8df";

  const nomMembre = (membreId) =>
    membres.find((m) => m.id === membreId)?.nom || "Famille";

  const evenementsFiltres =
    membreActif === "famille"
      ? evenements
      : evenements.filter((e) => e.membre === membreActif);

  const tachesFiltrees = (
    membreActif === "famille"
      ? taches
      : taches.filter((t) => t.membre === membreActif)
  ).filter((t) => !t.faite);

  const cocherTache = async (tacheId, faiteActuelle) => {
    await updateDoc(doc(db, "taches", tacheId), {
      faite: !faiteActuelle,
    });
  };

  const pointsEnfant = (enfantId) =>
    taches
      .filter((t) => t.membre === enfantId && t.statut === "validee")
      .reduce((total, t) => total + (t.points || 0), 0);

  // Quels enfants afficher selon le membre actif :
  // - famille → les 3 enfants
  // - un enfant → seulement lui
  // - papa/maman → aucun
  const enfantsAfficher = enfants.filter((e) =>
    membreActif === "famille" ? true : membreActif === e.id,
  );
  const afficherPoints = enfantsAfficher.length > 0;

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
                <p className="text-gray-400 text-xs">
                  {ev.heure} · {nomMembre(ev.membre)}
                </p>
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
            <p className="text-sm font-semibold">
              Toutes les tâches sont faites !
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tachesFiltrees.map((tache) => (
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
                    {nomMembre(tache.membre)}
                    {tache.points > 0 && ` · ⭐ ${tache.points} pts`}
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
        )}
      </div>

      {/* Points des enfants — pleine largeur, visible uniquement si pertinent */}
      {afficherPoints && (
        <div className="col-span-2 bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            ⭐{" "}
            {enfantsAfficher.length === 1 ? "Mes points" : "Points des enfants"}
          </h2>
          <div
            className={`grid gap-4 ${enfantsAfficher.length === 1 ? "grid-cols-1 max-w-xs" : "grid-cols-3"}`}
          >
            {enfantsAfficher.map((enfant) => {
              const pts = pointsEnfant(enfant.id);
              const objectif = 100;
              const progression = Math.min((pts / objectif) * 100, 100);
              return (
                <div
                  key={enfant.id}
                  className="rounded-2xl p-4 flex flex-col items-center gap-2"
                  style={{ backgroundColor: enfant.couleur + "40" }}
                >
                  <span className="text-3xl">{enfant.emoji}</span>
                  <p className="font-bold text-gray-800 text-sm">
                    {enfant.nom}
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: enfant.couleur }}
                  >
                    {pts} pts
                  </p>
                  <div className="w-full bg-white bg-opacity-60 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${progression}%`,
                        backgroundColor: enfant.couleur,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    objectif : {objectif} pts
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
