import { useState, useEffect } from "react";
import Header from "./components/Header";
import ProfilsMembres from "./components/ProfilsMembres";
import Dashboard from "./components/Dashboard";
import ListeCourses from "./components/ListeCourses";
import Calendrier from "./components/Calendrier";
import Taches from "./components/Taches";
import Parametres from "./components/Parametres";
import { initializeAuth } from "./services/session";

function App() {
  const [membreActif, setMembreActif] = useState("famille");
  const [ongletActif, setOngletActif] = useState("accueil");
  const [authReady, setAuthReady] = useState(false);
  const [loadingError, setLoadingError] = useState(null);

  // Initialiser l'authentification au démarrage
  useEffect(() => {
    console.log("⏳ Initialisation de l'authentification...");

    initializeAuth()
      .then((user) => {
        console.log("✅ Authentification prête. User:", user);
        setAuthReady(true);
      })
      .catch((err) => {
        console.error("❌ Erreur auth:", err);
        setLoadingError("Erreur d'authentification: " + err.message);
        setAuthReady(true); // On continue même sans auth (mode lecture seule)
      });
  }, []);

  // Pendant le chargement de l'authentification
  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Initialisation de HOMY...</p>
        </div>
      </div>
    );
  }

  // En cas d'erreur critique
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-lg mb-2">
            ⚠️ Erreur de connexion
          </h2>
          <p className="text-red-700">{loadingError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <ProfilsMembres
        membreActif={membreActif}
        onSelectMembre={setMembreActif}
      />

      {/* Barre de navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 flex gap-1">
        {[
          { id: "accueil", label: "🏠 Accueil" },
          { id: "calendrier", label: "📅 Calendrier" },
          { id: "courses", label: "🛒 Courses" },
          { id: "taches", label: "✅ Tâches" },
          { id: "parametres", label: "⚙️ Paramètres" },
        ].map((onglet) => (
          <button
            key={onglet.id}
            onClick={() => setOngletActif(onglet.id)}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
              ongletActif === onglet.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {onglet.label}
          </button>
        ))}
      </nav>

      {/* Contenu selon l'onglet actif */}
      {ongletActif === "accueil" && <Dashboard membreActif={membreActif} />}
      {ongletActif === "calendrier" && <Calendrier membreActif={membreActif} />}
      {ongletActif === "courses" && <ListeCourses />}
      {ongletActif === "taches" && <Taches membreActif={membreActif} />}
      {ongletActif === "parametres" && <Parametres />}
    </div>
  );
}

export default App;
