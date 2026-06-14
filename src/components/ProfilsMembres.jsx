const membres = [
  { id: "famille", nom: "Famille", couleur: "#4A4E69", emoji: "👨‍👩‍👧‍👦" },
  { id: "papa", nom: "Papa", couleur: "#78bae4", emoji: "👨" },
  { id: "maman", nom: "Maman", couleur: "#ab8fe3", emoji: "👩" },
  { id: "camille", nom: "Camille", couleur: "#8EA48B", emoji: "👧" },
  { id: "chloe", nom: "Chloé", couleur: "#e9bcb5", emoji: "👧" },
  { id: "clement", nom: "Clément", couleur: "#e8a366", emoji: "👦" },
];

function ProfilsMembres({ membreActif, onSelectMembre }) {
  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 overflow-hidden sm:overflow-x-auto">
      <div className="flex gap-1 sm:gap-3 items-center justify-between sm:justify-start w-full sm:min-w-max">
        {membres.map((membre) => (
          <button
            key={membre.id}
            onClick={() => onSelectMembre(membre.id)}
            className={`flex flex-col items-center gap-1 px-1 sm:px-3 py-1 rounded-xl transition-all flex-1 sm:flex-none min-w-0 sm:min-w-[4.5rem] ${
              membreActif === membre.id
                ? "bg-gray-100 scale-105 shadow-sm"
                : "hover:bg-gray-50"
            }`}
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl"
              style={{ backgroundColor: membre.couleur }}
            >
              {membre.emoji}
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-gray-600 truncate">
              {membre.nom}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProfilsMembres;
export { membres };
