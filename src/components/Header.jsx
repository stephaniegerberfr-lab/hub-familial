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
    <header className="bg-indigo-950 text-white px-4 sm:px-8 py-3 sm:py-4">
      {/* Mobile layout (only shown on < sm) */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold truncate">HOMY 🏠</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="notifications"
              className="w-10 h-10 bg-indigo-900/40 flex items-center justify-center rounded-full"
            >
              <span className="text-xl">🔔</span>
            </button>
            <button
              aria-label="menu"
              className="w-10 h-10 bg-indigo-900/40 flex items-center justify-center rounded-full"
            >
              <span className="text-xl">⋯</span>
            </button>
          </div>
        </div>

        {meteo && (
          <div className="mt-3 bg-indigo-900 rounded-2xl py-2 px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl">{iconeMeteo(meteo.icone)}</span>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight">
                  {meteo.temperature}°C
                </p>
                <p className="text-slate-300 text-xs leading-tight capitalize truncate">
                  {meteo.description}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-[1px] bg-white/25 h-12 rounded" />
              <div className="min-w-0 text-right ml-3">
                <div className="text-2xl font-bold">{heure}</div>
                <p className="text-slate-300 text-xs mt-1 capitalize truncate">
                  {date}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop / tablet layout — keep original behaviour for >= sm */}
      <div className="hidden sm:flex sm:items-center gap-4 justify-between">
        <div className="min-w-0">
          <p className="text-slate-300 text-sm font-semibold capitalize truncate">
            {date}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold truncate">HOMY 🏠</h1>
        </div>

        {meteo && (
          <div className="flex items-center gap-3 bg-indigo-900 px-4 py-2 rounded-2xl min-w-0">
            <span className="text-3xl">{iconeMeteo(meteo.icone)}</span>
            <div className="min-w-0">
              <p className="text-2xl font-bold truncate">
                {meteo.temperature}°C
              </p>
              <p className="text-slate-300 text-xs capitalize truncate">
                {meteo.description}
              </p>
            </div>
          </div>
        )}

        <div className="text-3xl sm:text-4xl font-bold whitespace-nowrap">
          {heure}
        </div>
      </div>
    </header>
  );
}

export default Header;
