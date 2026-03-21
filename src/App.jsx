import { useState } from "react";
import Header from "./components/Header";
import ProfilsMembres from "./components/ProfilsMembres";
import Dashboard from "./components/Dashboard";
import ListeCourses from "./components/ListeCourses";
import Calendrier from "./components/Calendrier";

function App() {
  const [membreActif, setMembreActif] = useState("famille");
  const [ongletActif, setOngletActif] = useState("accueil");

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
          { id: "famille", label: "👨‍👩‍👧‍👦 Famille" },
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
      {ongletActif === "famille" && (
        <div className="p-6 text-gray-400 font-semibold">
          👨‍👩‍👧‍👦 Famille — bientôt disponible
        </div>
      )}
    </div>
  );
}

export default App;
