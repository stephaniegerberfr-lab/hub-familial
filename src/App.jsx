import { useState } from "react";
import Header from "./components/Header";
import ProfilsMembres from "./components/ProfilsMembres";

function App() {
  const [membreActif, setMembreActif] = useState("famille");

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <ProfilsMembres
        membreActif={membreActif}
        onSelectMembre={setMembreActif}
      />
      <div className="p-6">
        <p className="text-gray-500 font-semibold">
          Vue sélectionnée :{" "}
          <span className="text-indigo-600">{membreActif}</span>
        </p>
      </div>
    </div>
  );
}

export default App;
