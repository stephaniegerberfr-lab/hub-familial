import { useState } from "react";
import Header from "./components/Header";
import ProfilsMembres from "./components/ProfilsMembres";
import Dashboard from "./components/Dashboard";

function App() {
  const [membreActif, setMembreActif] = useState("famille");

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <ProfilsMembres
        membreActif={membreActif}
        onSelectMembre={setMembreActif}
      />
      <Dashboard membreActif={membreActif} />
    </div>
  );
}

export default App;
