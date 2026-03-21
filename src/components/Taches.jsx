import { useState, useEffect, useRef } from "react";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import PinParent from "./PinParent";

const membres = [
  { id: "famille", nom: "Famille", couleur: "#f2e8df" },
  { id: "papa", nom: "Papa", couleur: "#78bae4" },
  { id: "maman", nom: "Maman", couleur: "#ab8fe3" },
  { id: "camille", nom: "Camille", couleur: "#8EA48B" },
  { id: "chloe", nom: "Chloé", couleur: "#e9bcb5" },
  { id: "clement", nom: "Clément", couleur: "#e8a366" },
];

const enfants = ["camille", "chloe", "clement"];

function Taches({ membreActif }) {
  const [taches, setTaches] = useState([]);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [titre, setTitre] = useState("");
  const [membre, setMembre] = useState("famille");
  const [points, setPoints] = useState(10);

  // PIN parental
  const [pinOuvert, setPinOuvert] = useState(false);
  const [actionEnAttente, setActionEnAttente] = useState(null);

  // Photo de preuve
  const [photoEnCours, setPhotoEnCours] = useState(null); // { tacheId, dataUrl }
  const photoRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "taches"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTaches(data);
      setChargement(false);
    });
    return () => unsub();
  }, []);

  const tachesFiltrees =
    membreActif === "famille"
      ? taches
      : taches.filter((t) => t.membre === membreActif);

  const couleurMembre = (id) =>
    membres.find((m) => m.id === id)?.couleur || "#f2e8df";

  const nomMembre = (id) => membres.find((m) => m.id === id)?.nom || "Famille";

  const ajouterTache = async () => {
    if (!titre.trim()) return;
    await addDoc(collection(db, "taches"), {
      titre: titre.trim(),
      membre,
      points: enfants.includes(membre) ? Number(points) : 0,
      statut: enfants.includes(membre) ? "a_faire" : "aucun",
      faite: false,
      createdAt: serverTimestamp(),
    });
    setTitre("");
    setMembre("famille");
    setPoints(10);
    setAfficherFormulaire(false);
  };

  const supprimerTache = async (tacheId) => {
    await deleteDoc(doc(db, "taches", tacheId));
  };

  // Enfant marque "c'est fait" → passe en attente de validation
  const marquerEnAttente = async (tacheId) => {
    await updateDoc(doc(db, "taches", tacheId), {
      statut: "en_attente",
      faite: false,
    });
  };

  // Ouvre le PIN puis exécute l'action
  const demanderPin = (action) => {
    setActionEnAttente(() => action);
    setPinOuvert(true);
  };

  const onPinValide = async () => {
    setPinOuvert(false);
    if (actionEnAttente) {
      await actionEnAttente();
      setActionEnAttente(null);
    }
  };

  // Parent valide → points crédités
  const validerTache = (tacheId) => {
    demanderPin(async () => {
      await updateDoc(doc(db, "taches", tacheId), {
        statut: "validee",
        faite: true,
      });
    });
  };

  // Parent refuse → retour à "à faire"
  const refuserTache = (tacheId) => {
    demanderPin(async () => {
      await updateDoc(doc(db, "taches", tacheId), {
        statut: "a_faire",
        faite: false,
        photoPreuve: null,
      });
    });
  };

  // Tâches adultes (pas de statut)
  const cocherTacheAdulte = async (tacheId, faiteActuelle) => {
    await updateDoc(doc(db, "taches", tacheId), { faite: !faiteActuelle });
  };

  // Photo de preuve
  const ouvrirPhoto = (tacheId) => {
    setPhotoEnCours({ tacheId, dataUrl: null });
    setTimeout(() => photoRef.current?.click(), 100);
  };

  const onPhotoChoisie = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoEnCours((prev) => ({ ...prev, dataUrl: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const confirmerPhoto = async () => {
    if (!photoEnCours?.tacheId) return;
    await updateDoc(doc(db, "taches", photoEnCours.tacheId), {
      statut: "en_attente",
      faite: false,
    });
    setPhotoEnCours(null);
  };

  // Triage
  const tachesEnfantsAFaire = tachesFiltrees.filter(
    (t) => enfants.includes(t.membre) && t.statut === "a_faire",
  );
  const tachesEnfantsEnAttente = tachesFiltrees.filter(
    (t) => enfants.includes(t.membre) && t.statut === "en_attente",
  );
  const tachesEnfantsValidees = tachesFiltrees.filter(
    (t) => enfants.includes(t.membre) && t.statut === "validee",
  );
  const tachesAdultes = tachesFiltrees.filter(
    (t) => !enfants.includes(t.membre),
  );
  const tachesAdultesAFaire = tachesAdultes.filter((t) => !t.faite);
  const tachesAdultesFaites = tachesAdultes.filter((t) => t.faite);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* PIN modal */}
      {pinOuvert && (
        <PinParent
          onValide={onPinValide}
          onAnnuler={() => {
            setPinOuvert(false);
            setActionEnAttente(null);
          }}
        />
      )}

      {/* Modal photo */}
      {photoEnCours && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
              📸 Photo de preuve
            </h3>
            {photoEnCours.dataUrl ? (
              <>
                <img
                  src={photoEnCours.dataUrl}
                  alt="preuve"
                  className="w-full rounded-xl mb-4 max-h-48 object-cover"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPhotoEnCours((p) => ({ ...p, dataUrl: null }))
                    }
                    className="flex-1 border border-gray-200 text-gray-500 font-bold py-2 rounded-xl hover:bg-gray-50 text-sm"
                  >
                    Reprendre
                  </button>
                  <button
                    onClick={confirmerPhoto}
                    className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-xl hover:bg-emerald-600 text-sm"
                  >
                    ✓ Envoyer
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-sm text-center mb-4">
                  Prends une photo pour montrer que c'est fait !
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPhotoEnCours(null)}
                    className="flex-1 border border-gray-200 text-gray-500 font-bold py-2 rounded-xl text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => photoRef.current?.click()}
                    className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl text-sm"
                  >
                    📷 Choisir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Input photo caché */}
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPhotoChoisie}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">✅ Tâches</h2>
        <button
          onClick={() => setAfficherFormulaire(!afficherFormulaire)}
          className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm"
        >
          + Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {afficherFormulaire && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">
            Nouvelle tâche
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Description de la tâche..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
            <div className="flex gap-2">
              <select
                value={membre}
                onChange={(e) => setMembre(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
              >
                {membres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
              {enfants.includes(membre) && (
                <select
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                >
                  <option value={5}>⭐ 5 pts</option>
                  <option value={10}>⭐ 10 pts</option>
                  <option value={15}>⭐ 15 pts</option>
                  <option value={20}>⭐ 20 pts</option>
                  <option value={25}>⭐ 25 pts</option>
                </select>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={ajouterTache}
                className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl hover:bg-indigo-700 text-sm"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setAfficherFormulaire(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {chargement && (
        <div className="text-center text-gray-400 py-8">Chargement...</div>
      )}

      {/* ── TÂCHES ENFANTS ── */}
      {(tachesEnfantsAFaire.length > 0 ||
        tachesEnfantsEnAttente.length > 0 ||
        tachesEnfantsValidees.length > 0) && (
        <div className="mb-2">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2 px-1">
            ⭐ Tâches des enfants
          </p>

          {/* À faire */}
          {tachesEnfantsAFaire.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-3">
              <h3 className="text-sm font-bold text-gray-500 mb-3">
                À faire ({tachesEnfantsAFaire.length})
              </h3>
              <div className="flex flex-col gap-2">
                {tachesEnfantsAFaire.map((tache) => (
                  <div
                    key={tache.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: couleurMembre(tache.membre) }}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {tache.titre}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {nomMembre(tache.membre)} · ⭐ {tache.points} pts
                      </p>
                    </div>
                    <button
                      onClick={() => ouvrirPhoto(tache.id)}
                      className="bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1 rounded-lg hover:bg-indigo-200"
                    >
                      📸
                    </button>
                    <button
                      onClick={() => marquerEnAttente(tache.id)}
                      className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-amber-500"
                    >
                      C'est fait !
                    </button>
                    <button
                      onClick={() => supprimerTache(tache.id)}
                      className="text-gray-300 hover:text-red-400 transition-all text-lg px-1"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* En attente de validation */}
          {tachesEnfantsEnAttente.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-3">
              <h3 className="text-sm font-bold text-amber-600 mb-3">
                ⏳ En attente de validation ({tachesEnfantsEnAttente.length})
              </h3>
              <div className="flex flex-col gap-2">
                {tachesEnfantsEnAttente.map((tache) => (
                  <div
                    key={tache.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: couleurMembre(tache.membre) }}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {tache.titre}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {nomMembre(tache.membre)} · ⭐ {tache.points} pts
                      </p>
                    </div>
                    <button
                      onClick={() => refuserTache(tache.id)}
                      className="bg-red-100 text-red-500 text-xs font-bold px-3 py-1 rounded-lg hover:bg-red-200"
                    >
                      ✕ Refuser
                    </button>
                    <button
                      onClick={() => validerTache(tache.id)}
                      className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-emerald-600"
                    >
                      ✓ Valider
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validées */}
          {tachesEnfantsValidees.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-3 opacity-60">
              <h3 className="text-sm font-bold text-gray-500 mb-3">
                ✅ Validées ({tachesEnfantsValidees.length})
              </h3>
              <div className="flex flex-col gap-2">
                {tachesEnfantsValidees.map((tache) => (
                  <div
                    key={tache.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-400 text-sm line-through">
                        {tache.titre}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {nomMembre(tache.membre)} · ⭐ {tache.points} pts
                      </p>
                    </div>
                    <button
                      onClick={() => supprimerTache(tache.id)}
                      className="text-gray-300 hover:text-red-400 transition-all text-lg px-1"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TÂCHES ADULTES ── */}
      {(tachesAdultesAFaire.length > 0 || tachesAdultesFaites.length > 0) && (
        <div className="mb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Tâches adultes
          </p>

          {tachesAdultesAFaire.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-3">
              <h3 className="text-sm font-bold text-gray-500 mb-3">
                À faire ({tachesAdultesAFaire.length})
              </h3>
              <div className="flex flex-col gap-2">
                {tachesAdultesAFaire.map((tache) => (
                  <div
                    key={tache.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: couleurMembre(tache.membre) }}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {tache.titre}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {nomMembre(tache.membre)}
                      </p>
                    </div>
                    <button
                      onClick={() => cocherTacheAdulte(tache.id, tache.faite)}
                      className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-emerald-600"
                    >
                      ✓ Fait
                    </button>
                    <button
                      onClick={() => supprimerTache(tache.id)}
                      className="text-gray-300 hover:text-red-400 transition-all text-lg px-1"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tachesAdultesFaites.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-3 opacity-60">
              <h3 className="text-sm font-bold text-gray-500 mb-3">
                Terminées ({tachesAdultesFaites.length})
              </h3>
              <div className="flex flex-col gap-2">
                {tachesAdultesFaites.map((tache) => (
                  <div
                    key={tache.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-400 text-sm line-through">
                        {tache.titre}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {nomMembre(tache.membre)}
                      </p>
                    </div>
                    <button
                      onClick={() => cocherTacheAdulte(tache.id, tache.faite)}
                      className="text-xs font-bold text-gray-400 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-100"
                    >
                      ↩️ Annuler
                    </button>
                    <button
                      onClick={() => supprimerTache(tache.id)}
                      className="text-gray-300 hover:text-red-400 transition-all text-lg px-1"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vide */}
      {!chargement && tachesFiltrees.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-4xl mb-2">✨</p>
          <p className="font-semibold">Aucune tâche</p>
          <p className="text-sm">Ajoute la première tâche !</p>
        </div>
      )}
    </div>
  );
}

export default Taches;
