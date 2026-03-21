const evenementsTest = [
  {
    id: 1,
    titre: "École Camille",
    heure: "08:00",
    membre: "camille",
    couleur: "#8EA48B",
    emoji: "🏫",
  },
  {
    id: 2,
    titre: "Réunion Papa",
    heure: "10:30",
    membre: "papa",
    couleur: "#78bae4",
    emoji: "💼",
  },
  {
    id: 3,
    titre: "Cours de danse Chloé",
    heure: "17:00",
    membre: "chloe",
    couleur: "#e9bcb5",
    emoji: "💃",
  },
  {
    id: 4,
    titre: "Dîner en famille",
    heure: "19:00",
    membre: "famille",
    couleur: "#f2e8df",
    emoji: "🍽️",
  },
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
  const evenements =
    membreActif === "famille"
      ? evenementsTest
      : evenementsTest.filter((e) => e.membre === membreActif);

  const taches =
    membreActif === "famille"
      ? tachesTest
      : tachesTest.filter((t) => t.membre === membreActif);

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      {/* Colonne gauche — Événements du jour */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📅 Aujourd'hui</h2>
        {evenements.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun événement aujourd'hui</p>
        ) : (
          <div className="flex flex-col gap-3">
            {evenements.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: ev.couleur }}
                >
                  {ev.emoji}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{ev.titre}</p>
                  <p className="text-gray-400 text-xs">{ev.heure}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Colonne droite — Tâches */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          ✅ Tâches du jour
        </h2>
        {taches.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune tâche pour aujourd'hui</p>
        ) : (
          <div className="flex flex-col gap-3">
            {taches.map((tache) => (
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
