import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const membres = [
  { id: "papa", nom: "Papa", couleur: "#78bae4" },
  { id: "maman", nom: "Maman", couleur: "#ab8fe3" },
  { id: "camille", nom: "Camille", couleur: "#8EA48B" },
  { id: "chloe", nom: "Chloé", couleur: "#e9bcb5" },
  { id: "clement", nom: "Clément", couleur: "#e8a366" },
];

const membresAffichage = [
  { id: "famille", nom: "Famille", couleur: "#f2e8df" },
  ...membres,
];

const recurrences = [
  { id: "aucune", nom: "Pas de récurrence" },
  { id: "quotidien", nom: "Quotidien" },
  { id: "hebdomadaire", nom: "Hebdomadaire" },
  { id: "mensuel", nom: "Mensuel" },
  { id: "annuel", nom: "Annuel" },
];

function exporterIcal(evenement) {
  const dateDebut = evenement.date.replace(/-/g, "");
  const heureDebut = (evenement.heureDebut || "00:00").replace(":", "");
  const heureFin = (
    evenement.heureFin ||
    evenement.heureDebut ||
    "01:00"
  ).replace(":", "");
  const contenu = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hub Familial//FR",
    "BEGIN:VEVENT",
    `DTSTART:${dateDebut}T${heureDebut}00`,
    `DTEND:${dateDebut}T${heureFin}00`,
    `SUMMARY:${evenement.titre}`,
    evenement.lieu ? `LOCATION:${evenement.lieu}` : "",
    evenement.description ? `DESCRIPTION:${evenement.description}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  const blob = new Blob([contenu], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `${evenement.titre}.ics`;
  lien.click();
  URL.revokeObjectURL(url);
}

function genererDatesRecurrence(dateDebut, recurrence, dateFin) {
  const debut = new Date(dateDebut + "T00:00:00");
  const fin = dateFin ? new Date(dateFin + "T00:00:00") : null;
  if (recurrence === "aucune") return [dateDebut];
  const dates = [];
  let current = new Date(debut);
  let count = 0;
  while (count < 365) {
    dates.push(current.toISOString().split("T")[0]);
    if (recurrence === "quotidien") current.setDate(current.getDate() + 1);
    else if (recurrence === "hebdomadaire")
      current.setDate(current.getDate() + 7);
    else if (recurrence === "mensuel") current.setMonth(current.getMonth() + 1);
    else if (recurrence === "annuel")
      current.setFullYear(current.getFullYear() + 1);
    if (fin && current > fin) break;
    if (!fin && count >= 11) break;
    count++;
  }
  return dates;
}

function urlMaps(adresse) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(adresse)
  );
}

function Calendrier({ membreActif }) {
  const [evenements, setEvenements] = useState([]);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [evenementDetail, setEvenementDetail] = useState(null);
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [recurrence, setRecurrence] = useState("aucune");
  const [dateFinRecurrence, setDateFinRecurrence] = useState("");
  const [membresChoisis, setMembresChoisis] = useState([]);
  const [lieu, setLieu] = useState("");
  const [lieuType, setLieuType] = useState("texte");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "evenements"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort(
        (a, b) =>
          new Date(a.date + "T" + (a.heureDebut || "00:00")) -
          new Date(b.date + "T" + (b.heureDebut || "00:00")),
      );
      setEvenements(data);
      setChargement(false);
    });
    return () => unsub();
  }, []);

  const reinitialiserFormulaire = () => {
    setTitre("");
    setDate("");
    setHeureDebut("");
    setHeureFin("");
    setRecurrence("aucune");
    setDateFinRecurrence("");
    setMembresChoisis([]);
    setLieu("");
    setLieuType("texte");
    setDescription("");
    setAfficherFormulaire(false);
  };

  const toggleMembre = (membreId) => {
    setMembresChoisis((prev) =>
      prev.includes(membreId)
        ? prev.filter((m) => m !== membreId)
        : [...prev, membreId],
    );
  };

  const ajouterEvenement = async () => {
    if (!titre.trim() || !date) return;
    const serieId = recurrence !== "aucune" ? `serie_${Date.now()}` : null;
    const dates = genererDatesRecurrence(date, recurrence, dateFinRecurrence);
    const membresFinaux =
      membresChoisis.length === 0 ? ["famille"] : membresChoisis;
    const batch = writeBatch(db);
    for (const d of dates) {
      for (const m of membresFinaux) {
        const ref = doc(collection(db, "evenements"));
        batch.set(ref, {
          titre: titre.trim(),
          date: d,
          heureDebut: heureDebut || "00:00",
          heureFin: heureFin || "",
          heure: heureDebut || "00:00",
          membre: m,
          lieu: lieu.trim(),
          lieuType,
          description: description.trim(),
          recurrence,
          serieId,
          createdAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
    reinitialiserFormulaire();
  };

  const supprimerEvenement = async (evenement) => {
    if (evenement.serieId) {
      const choix = window.confirm(
        "Supprimer toute la série ou seulement cet événement ?\n\nOK = toute la série\nAnnuler = cet événement uniquement",
      );
      if (choix) {
        const q = query(
          collection(db, "evenements"),
          where("serieId", "==", evenement.serieId),
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } else {
        await deleteDoc(doc(db, "evenements", evenement.id));
      }
    } else {
      await deleteDoc(doc(db, "evenements", evenement.id));
    }
    setEvenementDetail(null);
  };

  const couleurMembre = (id) =>
    membresAffichage.find((m) => m.id === id)?.couleur || "#f2e8df";
  const nomMembre = (id) =>
    membresAffichage.find((m) => m.id === id)?.nom || "Famille";
  const formatDate = (dateStr) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  const evenementsFiltres =
    membreActif === "famille"
      ? evenements
      : evenements.filter(
          (e) => e.membre === membreActif || e.membre === "famille",
        );

  const evenementsParDate = evenementsFiltres.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    const dejaDans = acc[ev.date].some(
      (e) =>
        e.titre === ev.titre &&
        e.heureDebut === ev.heureDebut &&
        e.serieId === ev.serieId,
    );
    if (!dejaDans) acc[ev.date].push(ev);
    return acc;
  }, {});

  // ---- RENDU ----
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">📅 Calendrier</h2>
        <button
          onClick={() => setAfficherFormulaire(!afficherFormulaire)}
          className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm"
        >
          + Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {afficherFormulaire && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-sm font-bold text-gray-600 mb-4">
            Nouvel événement
          </h3>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre de l'événement..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />

            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-400 mb-1 block">
                  Heure début
                </label>
                <input
                  type="time"
                  value={heureDebut}
                  onChange={(e) => setHeureDebut(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-400 mb-1 block">
                  Heure fin
                </label>
                <input
                  type="time"
                  value={heureFin}
                  onChange={(e) => setHeureFin(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">
                Récurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
              >
                {recurrences.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nom}
                  </option>
                ))}
              </select>
            </div>

            {recurrence !== "aucune" && (
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block">
                  Fin de récurrence{" "}
                  <span className="font-normal">
                    (optionnel — sinon 12 occurrences)
                  </span>
                </label>
                <input
                  type="date"
                  value={dateFinRecurrence}
                  onChange={(e) => setDateFinRecurrence(e.target.value)}
                  min={date}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block">
                Qui est concerné ?{" "}
                <span className="font-normal">(vide = toute la famille)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {membres.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMembre(m.id)}
                    className={`px-3 py-1 rounded-full text-sm font-bold border-2 transition-all ${
                      membresChoisis.includes(m.id)
                        ? "text-white"
                        : "border-gray-200 text-gray-500 bg-white"
                    }`}
                    style={
                      membresChoisis.includes(m.id)
                        ? { backgroundColor: m.couleur, borderColor: m.couleur }
                        : {}
                    }
                  >
                    {m.nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Lieu */}
            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block">
                Lieu
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setLieuType("texte");
                    setLieu("");
                  }}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                    lieuType === "texte"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  ✏️ Texte libre
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLieuType("maps");
                    setLieu("");
                  }}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                    lieuType === "maps"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  📍 Recherche Google Maps
                </button>
              </div>

              {lieuType === "texte" && (
                <input
                  type="text"
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                  placeholder="Ex: École, Médecin, Maison..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              )}

              {lieuType === "maps" && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lieu}
                    onChange={(e) => setLieu(e.target.value)}
                    placeholder="Ex: 12 rue de la Paix, Lyon..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  />
                  {lieu.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => window.open(urlMaps(lieu), "_blank")}
                      className="bg-indigo-50 text-indigo-600 font-bold px-3 py-2 rounded-xl hover:bg-indigo-100 text-sm whitespace-nowrap"
                    >
                      📍 Vérifier
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes, informations complémentaires..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={ajouterEvenement}
                className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl hover:bg-indigo-700 text-sm"
              >
                Enregistrer
              </button>
              <button
                onClick={reinitialiserFormulaire}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {evenementDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: couleurMembre(evenementDetail.membre),
                }}
              />
              <div>
                <h3 className="font-bold text-gray-800">
                  {evenementDetail.titre}
                </h3>
                <p className="text-gray-400 text-xs">
                  {nomMembre(evenementDetail.membre)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm text-gray-600 mb-4">
              <p>📅 {formatDate(evenementDetail.date)}</p>
              {evenementDetail.heureDebut && (
                <p>
                  🕐 {evenementDetail.heureDebut}
                  {evenementDetail.heureFin
                    ? ` → ${evenementDetail.heureFin}`
                    : ""}
                </p>
              )}

              {evenementDetail.lieu && evenementDetail.lieuType === "maps" && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(urlMaps(evenementDetail.lieu), "_blank")
                  }
                  className="text-left text-indigo-500 font-bold hover:underline"
                >
                  📍 {evenementDetail.lieu} — Voir sur Maps
                </button>
              )}
              {evenementDetail.lieu && evenementDetail.lieuType !== "maps" && (
                <p>📍 {evenementDetail.lieu}</p>
              )}

              {evenementDetail.description && (
                <p>📝 {evenementDetail.description}</p>
              )}
              {evenementDetail.recurrence &&
                evenementDetail.recurrence !== "aucune" && (
                  <p>
                    🔁{" "}
                    {
                      recurrences.find(
                        (r) => r.id === evenementDetail.recurrence,
                      )?.nom
                    }
                  </p>
                )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => exporterIcal(evenementDetail)}
                className="flex-1 text-xs font-bold text-indigo-500 border border-indigo-200 px-3 py-2 rounded-xl hover:bg-indigo-50"
              >
                📤 Export .ics
              </button>
              <button
                onClick={() => supprimerEvenement(evenementDetail)}
                className="flex-1 text-xs font-bold text-red-500 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50"
              >
                🗑️ Supprimer
              </button>
              <button
                onClick={() => setEvenementDetail(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {chargement && (
        <div className="text-center text-gray-400 py-8">Chargement...</div>
      )}

      {/* Liste événements */}
      {Object.keys(evenementsParDate)
        .sort()
        .map((dateStr) => (
          <div key={dateStr} className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2 capitalize">
              {formatDate(dateStr)}
            </p>
            <div className="flex flex-col gap-2">
              {evenementsParDate[dateStr].map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setEvenementDetail(ev)}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: couleurMembre(ev.membre) }}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">
                      {ev.titre}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {ev.heureDebut || ev.heure}
                      {ev.heureFin ? ` → ${ev.heureFin}` : ""}
                      {" · "}
                      {nomMembre(ev.membre)}
                      {ev.lieu ? ` · 📍 ${ev.lieu}` : ""}
                      {ev.recurrence && ev.recurrence !== "aucune"
                        ? " · 🔁"
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {!chargement && evenementsFiltres.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-4xl mb-2">📅</p>
          <p className="font-semibold">Aucun événement</p>
          <p className="text-sm">Ajoute ton premier événement !</p>
        </div>
      )}
    </div>
  );
}

export default Calendrier;
