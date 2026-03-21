import { useState } from "react";

const PIN_SECRET = "261108"; // Change ce code comme tu veux

function PinParent({ onValide, onAnnuler }) {
  const [pin, setPin] = useState("");
  const [erreur, setErreur] = useState(false);

  const verifier = () => {
    if (pin === PIN_SECRET) {
      setErreur(false);
      onValide();
    } else {
      setErreur(true);
      setPin("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-1 text-center">
          🔐 Validation parentale
        </h3>
        <p className="text-sm text-gray-400 text-center mb-4">
          Entre le code parent pour valider
        </p>

        {/* Affichage du PIN masqué */}
        <div className="flex justify-center gap-3 mb-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl ${
                pin.length > i
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200"
              }`}
            >
              {pin.length > i ? "●" : ""}
            </div>
          ))}
        </div>

        {erreur && (
          <p className="text-red-500 text-sm text-center mb-3">
            Code incorrect, réessaie
          </p>
        )}

        {/* Pavé numérique */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => pin.length < 6 && setPin(pin + n)}
              className="bg-gray-100 hover:bg-gray-200 font-bold text-lg py-3 rounded-xl transition-all"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPin("")}
            className="bg-red-50 hover:bg-red-100 text-red-500 font-bold py-3 rounded-xl transition-all"
          >
            ✕
          </button>
          <button
            onClick={() => pin.length < 6 && setPin(pin + "0")}
            className="bg-gray-100 hover:bg-gray-200 font-bold text-lg py-3 rounded-xl transition-all"
          >
            0
          </button>
          <button
            onClick={() => setPin(pin.slice(0, -1))}
            className="bg-gray-100 hover:bg-gray-200 font-bold py-3 rounded-xl transition-all"
          >
            ⌫
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onAnnuler}
            className="flex-1 border border-gray-200 text-gray-500 font-bold py-2 rounded-xl hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={verifier}
            disabled={pin.length < 6}
            className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

export default PinParent;
