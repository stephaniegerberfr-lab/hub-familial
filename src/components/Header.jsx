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
    <header className="bg-indigo-950 text-white px-8 py-4 flex justify-between items-center">
      {/* Gauche — date et titre */}
      <div>
        <p className="text-slate-300 text-sm font-semibold capitalize">
          {date}
        </p>
        <h1 className="text-2xl font-bold">Hub Familial 🏠</h1>
      </div>

      {/* Centre — météo */}
      {meteo && (
        <div className="flex items-center gap-3 bg-indigo-900 px-5 py-2 rounded-2xl">
          <span className="text-3xl">{iconeMeteo(meteo.icone)}</span>
          <div>
            <p className="text-2xl font-bold">{meteo.temperature}°C</p>
            <p className="text-slate-300 text-xs capitalize">
              {meteo.description}
            </p>
          </div>
        </div>
      )}

      {/* Droite — heure */}
      <div className="text-4xl font-bold">{heure}</div>
    </header>
  );
}

export default Header;
