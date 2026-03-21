import { useState, useEffect } from "react";

function Header() {
  const [heure, setHeure] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const mettreAJour = () => {
      const maintenant = new Date();

      // Heure format 14:35
      setHeure(
        maintenant.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );

      // Date format Lundi 21 mars 2026
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
    return () => clearInterval(intervalle);
  }, []);

  return (
    <header className="bg-indigo-950 text-white px-8 py-4 flex justify-between items-center">
      <div>
        <p className="text-slate-300 text-sm font-semibold capitalize">
          {date}
        </p>
        <h1 className="text-2xl font-bold">Hub Familial 🏠</h1>
      </div>
      <div className="text-4xl font-bold">{heure}</div>
    </header>
  );
}

export default Header;
