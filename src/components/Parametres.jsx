import { useState, useEffect } from "react";
import { membres } from "./ProfilsMembres";
import {
  connecterGoogleCalendar,
  deconnecterGoogleCalendar,
  getTokenMembre,
  updateAgendasActifs,
  importerEvenements,
} from "../services/googleCalendar";

function Parametres() {
  const [connexions, setConnexions] = useState({});
  const [chargement, setChargement] = useState({});
  const [message, setMessage] = useState("");

  // Membres qui peuvent connecter Google Calendar (pas "famille")
  const membresConnectables = membres.filter((m) => m.id !== "famille");

  // Charge l'état de connexion de chaque membre au démarrage
  useEffect(() => {
    async function chargerConnexions() {
      const etat = {};
      for (const membre of membresConnectables) {
        etat[membre.id] = await getTokenMembre(membre.id);
      }
      setConnexions(etat);
    }
    chargerConnexions();
  }, []);

  // Connecte un membre à Google Calendar
  async function handleConnecter(membreId) {
    setChargement((c) => ({ ...c, [membreId]: true }));
    setMessage("");
    try {
      const result = await connecterGoogleCalendar(membreId);
      setConnexions((c) => ({
        ...c,
        [membreId]: {
          email: result.email,
          agendas: result.agendas,
          agendasActifs: result.agendas.map((a) => a.id),
        },
      }));
      setMessage(`✅ ${membreId} connecté avec succès !`);
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    } finally {
      setChargement((c) => ({ ...c, [membreId]: false }));
    }
  }

  // Déconnecte un membre
  async function handleDeconnecter(membreId) {
    await deconnecterGoogleCalendar(membreId);
    setConnexions((c) => ({ ...c, [membreId]: null }));
    setMessage(`🔌 ${membreId} déconnecté.`);
  }

  // Synchronise manuellement les événements d'un membre
  async function handleSync(membreId) {
    setChargement((c) => ({ ...c, [membreId]: true }));
    setMessage("");
    try {
      const token = connexions[membreId];
      const nb = await importerEvenements(
        membreId,
        token.accessToken,
        token.agendasActifs,
      );
      setMessage(`✅ ${nb} événements importés pour ${membreId} !`);
    } catch (error) {
      setMessage(`❌ Erreur sync : ${error.message}`);
    } finally {
      setChargement((c) => ({ ...c, [membreId]: false }));
    }
  }

  // Active/désactive un agenda pour Maman (ou autre membre multi-agendas)
  async function handleToggleAgenda(membreId, agendaId) {
    const token = connexions[membreId];
    const actifs = token.agendasActifs || [];
    const nouveauxActifs = actifs.includes(agendaId)
      ? actifs.filter((id) => id !== agendaId)
      : [...actifs, agendaId];

    await updateAgendasActifs(membreId, nouveauxActifs);
    setConnexions((c) => ({
      ...c,
      [membreId]: { ...c[membreId], agendasActifs: nouveauxActifs },
    }));
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">⚙️ Paramètres</h1>
      <p className="text-gray-500 mb-6">
        Connecte le Google Calendar de chaque membre pour synchroniser
        automatiquement les événements.
      </p>

      {message && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {membresConnectables.map((membre) => {
          const connexion = connexions[membre.id];
          const enChargement = chargement[membre.id];

          return (
            <div
              key={membre.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            >
              {/* En-tête membre */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: membre.couleur }}
                  >
                    {membre.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{membre.nom}</p>
                    {connexion && (
                      <p className="text-xs text-gray-400">{connexion.email}</p>
                    )}
                  </div>
                </div>

                {/* Bouton connecter/déconnecter */}
                {connexion ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(membre.id)}
                      disabled={enChargement}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                    >
                      {enChargement ? "⏳" : "🔄 Sync"}
                    </button>
                    <button
                      onClick={() => handleDeconnecter(membre.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                    >
                      Déconnecter
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnecter(membre.id)}
                    disabled={enChargement}
                    className="px-4 py-2 text-sm font-bold bg-[#4A4E69] text-white rounded-xl hover:opacity-90 transition"
                  >
                    {enChargement
                      ? "⏳ Connexion..."
                      : "Connecter Google Calendar"}
                  </button>
                )}
              </div>

              {/* Liste des agendas (si connecté et plusieurs agendas) */}
              {connexion &&
                connexion.agendas &&
                connexion.agendas.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-500 mb-2">
                      Agendas à synchroniser :
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {connexion.agendas.map((agenda) => (
                        <label
                          key={agenda.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={
                              connexion.agendasActifs?.includes(agenda.id) ??
                              true
                            }
                            onChange={() =>
                              handleToggleAgenda(membre.id, agenda.id)
                            }
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600">
                            {agenda.principal ? "⭐ " : ""}
                            {agenda.nom}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

              {/* Badge connecté */}
              {connexion && (
                <div className="mt-2">
                  <span className="text-xs text-green-600 font-bold">
                    ✅ Google Calendar connecté
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Parametres;
