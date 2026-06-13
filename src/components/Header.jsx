import { useState, useEffect } from "react";
import { getMeteo, iconeMeteo } from "../services/meteo";

function Header() {
  const [heure, setHeure] = useState("");
  const [date, setDate] = useState("");
  const [meteo, setMeteo] = useState(null);

  useEffect(() => {
    // Heure en temps réel
    const mettreAJour = () => {
      const maintenant = new Date();
      setHeure(
        maintenant.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      setDate(
        maintenant.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
    };
    mettreAJour();
    const intervalle = setInterval(mettreAJour, 1000);

    // Météo
    getMeteo().then((data) => setMeteo(data));

    return () => clearInterval(intervalle);
  }, []);

  return (
    <header className="bg-indigo-950 text-white px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 justify-between">
      {/* Gauche — date et titre */}
      <div className="min-w-0">
        <p className="text-slate-300 text-sm font-semibold capitalize truncate">
          {date}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold truncate">HOMY 🏠</h1>
      </div>

      {/* Centre — météo */}
      {meteo && (
        <div className="flex items-center gap-3 bg-indigo-900 px-4 py-2 rounded-2xl min-w-0">
          <span className="text-3xl">{iconeMeteo(meteo.icone)}</span>
          <div className="min-w-0">
            <p className="text-2xl font-bold truncate">{meteo.temperature}°C</p>
            <p className="text-slate-300 text-xs capitalize truncate">
              {meteo.description}
            </p>
          </div>
        </div>
      )}

      {/* Droite — heure */}
      <div className="text-3xl sm:text-4xl font-bold whitespace-nowrap">
        {heure}
      </div>
    </header>
  );
}

export default Header;
