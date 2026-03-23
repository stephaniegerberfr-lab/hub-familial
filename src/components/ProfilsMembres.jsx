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
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-3">
      {membres.map((membre) => (
        <button
          key={membre.id}
          onClick={() => onSelectMembre(membre.id)}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
            membreActif === membre.id
              ? "bg-gray-100 scale-105 shadow-sm"
              : "hover:bg-gray-50"
          }`}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: membre.couleur }}
          >
            {membre.emoji}
          </div>
          <span className="text-xs font-bold text-gray-600">{membre.nom}</span>
        </button>
      ))}
    </div>
  );
}

export default ProfilsMembres;
export { membres };
