import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  doc,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// ─────────────────────────────────────────────
// DONNÉES DE BASE (inchangées)
// ─────────────────────────────────────────────
const membres = [
  { id: "papa", nom: "Papa", couleur: "#78bae4" },
  { id: "maman", nom: "Maman", couleur: "#ab8fe3" },
  { id: "camille", nom: "Camille", couleur: "#8EA48B" },
  { id: "chloe", nom: "Chloé", couleur: "#e9bcb5" },
  { id: "clement", nom: "Clément", couleur: "#e8a366" },
];

const membresAffichage = [
  { id: "famille", nom: "Famille", couleur: "#4A4E69" },
  ...membres,
];

const recurrences = [
  { id: "aucune", nom: "Pas de récurrence" },
  { id: "quotidien", nom: "Quotidien" },
  { id: "hebdomadaire", nom: "Hebdomadaire" },
  { id: "mensuel", nom: "Mensuel" },
  { id: "annuel", nom: "Annuel" },
  { id: "personnalise", nom: "Personnalisée..." },
];

const MOIS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ─────────────────────────────────────────────
// ★ MODAL DE RÉCURRENCE PERSONNALISÉE
// ─────────────────────────────────────────────
function ModalRecurrencePersonnalisee({ config, onSave, onClose }) {
  // config contient : { type, intervalle, joursSelectiones, finType, dateFin, occurrences }
  const [type, setType] = useState(config?.type || "semaine");
  const [intervalle, setIntervalle] = useState(config?.intervalle || 1);
  const [joursSelectiones, setJoursSelectiones] = useState(
    config?.joursSelectiones || [1], // Lundi par défaut
  );
  const [finType, setFinType] = useState(config?.finType || "jamais");
  const [dateFin, setDateFin] = useState(config?.dateFin || "");
  const [occurrences, setOccurrences] = useState(config?.occurrences || 12);

  const joursOptions = [
    { id: 1, label: "L" },
    { id: 2, label: "M" },
    { id: 3, label: "M" },
    { id: 4, label: "J" },
    { id: 5, label: "V" },
    { id: 6, label: "S" },
    { id: 0, label: "D" },
  ];

  const toggleJour = (jour) => {
    if (joursSelectiones.includes(jour)) {
      // Empêcher de tout déselectionner
      if (joursSelectiones.length > 1) {
        setJoursSelectiones(joursSelectiones.filter((j) => j !== jour));
      }
    } else {
      setJoursSelectiones([...joursSelectiones, jour].sort());
    }
  };

  const handleSauvegarder = () => {
    onSave({
      type,
      intervalle: parseInt(intervalle),
      joursSelectiones: type === "semaine" ? joursSelectiones : [],
      finType,
      dateFin: finType === "le" ? dateFin : null,
      occurrences: finType === "apres" ? parseInt(occurrences) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          🔁 Récurrence personnalisée
        </h3>

        {/* Type de récurrence */}
        <div className="mb-4">
          <label className="text-xs font-bold text-gray-600 mb-2 block">
            Répéter tout(e) les
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max="999"
              value={intervalle}
              onChange={(e) => setIntervalle(e.target.value)}
              className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            >
              <option value="jour">jour(s)</option>
              <option value="semaine">semaine(s)</option>
              <option value="mois">mois</option>
              <option value="annee">année(s)</option>
            </select>
          </div>
        </div>

        {/* Sélection des jours (si hebdomadaire) */}
        {type === "semaine" && (
          <div className="mb-4">
            <label className="text-xs font-bold text-gray-600 mb-2 block">
              Répéter le
            </label>
            <div className="flex gap-2">
              {joursOptions.map((jour) => (
                <button
                  key={jour.id}
                  type="button"
                  onClick={() => toggleJour(jour.id)}
                  className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                    joursSelectiones.includes(jour.id)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {jour.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Condition de fin */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-600 mb-2 block">
            Se termine
          </label>

          {/* Option : Jamais */}
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="radio"
              name="finType"
              checked={finType === "jamais"}
              onChange={() => setFinType("jamais")}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Jamais</span>
          </label>

          {/* Option : Le (date) */}
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="radio"
              name="finType"
              checked={finType === "le"}
              onChange={() => setFinType("le")}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Le</span>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => {
                setDateFin(e.target.value);
                setFinType("le");
              }}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </label>

          {/* Option : Après X occurrences */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="finType"
              checked={finType === "apres"}
              onChange={() => setFinType("apres")}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Après</span>
            <input
              type="number"
              min="1"
              max="999"
              value={occurrences}
              onChange={(e) => {
                setOccurrences(e.target.value);
                setFinType("apres");
              }}
              className="w-20 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
            />
            <span className="text-sm text-gray-700">occurrence(s)</span>
          </label>
        </div>

        {/* Boutons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSauvegarder}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-indigo-700"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ★ NOUVELLE FONCTION : genererDatesRecurrencePersonnalisee
// ─────────────────────────────────────────────
function genererDatesRecurrencePersonnalisee(
  dateDebut,
  configRecurrence,
  dateFin,
) {
  const dates = [];
  const debut = new Date(dateDebut + "T00:00:00");
  let current = new Date(debut);
  const { type, intervalle, joursSelectiones, finType, occurrences } =
    configRecurrence;

  // Date de fin finale (si définie)
  const finDate = dateFin ? new Date(dateFin + "T00:00:00") : null;

  // Limite de sécurité
  const maxOccurrences =
    finType === "apres" ? occurrences : finType === "jamais" ? 365 : 999;
  let count = 0;

  // Toujours ajouter la date de début
  dates.push(dateDebut);
  count++;

  while (count < maxOccurrences) {
    // Incrémenter selon le type
    if (type === "jour") {
      current.setDate(current.getDate() + intervalle);
    } else if (type === "semaine") {
      // Pour les semaines, on doit gérer les jours de la semaine sélectionnés
      if (joursSelectiones && joursSelectiones.length > 0) {
        // Chercher le prochain jour correspondant
        let joursTrouve = false;

        for (let i = 1; i <= 7; i++) {
          const testDate = new Date(current);
          testDate.setDate(current.getDate() + i);
          const testJour = testDate.getDay();

          if (joursSelectiones.includes(testJour)) {
            current = testDate;
            joursTrouve = true;
            break;
          }
        }

        // Si on n'a pas trouvé de jour cette semaine, passer à la semaine suivante
        if (!joursTrouve) {
          current.setDate(current.getDate() + 7 * intervalle);
        }
      } else {
        current.setDate(current.getDate() + 7 * intervalle);
      }
    } else if (type === "mois") {
      current.setMonth(current.getMonth() + intervalle);
    } else if (type === "annee") {
      current.setFullYear(current.getFullYear() + intervalle);
    }

    // Vérifier la date de fin
    if (finDate && current > finDate) break;

    // Ajouter la date
    const dateStr = current.toISOString().split("T")[0];
    dates.push(dateStr);
    count++;

    // Sécurité : empêcher boucle infinie
    if (count > 1000) break;
  }

  return dates;
}

// ─────────────────────────────────────────────
// ★ FONCTION CENTRALE : regrouperEvenements
// ─────────────────────────────────────────────
function regrouperEvenements(liste) {
  const map = new Map();

  for (const ev of liste) {
    const cle = `${ev.titre}__${ev.date}__${ev.heureDebut || ""}__${ev.serieId || ""}`;

    if (map.has(cle)) {
      const existant = map.get(cle);
      if (!existant.membres.includes(ev.membre)) {
        existant.membres.push(ev.membre);
        existant.ids.push(ev.id);
      }
    } else {
      map.set(cle, {
        ...ev,
        membres: [ev.membre],
        ids: [ev.id],
      });
    }
  }

  return Array.from(map.values());
}

// ─────────────────────────────────────────────
// FONCTIONS UTILITAIRES (inchangées)
// ─────────────────────────────────────────────
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
    "PRODID:-//HOMY//FR",
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

function parseDateLocale(dateStr) {
  return new Date(dateStr + "T00:00:00");
}

// ─────────────────────────────────────────────
// ★ FONCTION UTILITAIRE : Déterminer la couleur de l'étiquette
// ─────────────────────────────────────────────
/**
 * Détermine la couleur d'arrière-plan d'une étiquette d'événement
 * Règle :
 * - 1 seul membre → couleur du membre
 * - Plusieurs membres → couleur famille (#4A4E69)
 */
function getCouleurEtiquette(ev) {
  const membresIds = ev.membres || [ev.membre];

  // Si 1 seul membre : retourner sa couleur
  if (membresIds.length === 1) {
    const membre = membresAffichage.find((m) => m.id === membresIds[0]);
    return membre?.couleur || "#4A4E69";
  }

  // Si plusieurs membres : retourner la couleur famille
  return "#4A4E69";
}

// ─────────────────────────────────────────────
// ★ COMPOSANT : AvatarsMembres
// ─────────────────────────────────────────────
function AvatarsMembres({ membresIds = [], size = "md", showNames = false }) {
  if (!membresIds || membresIds.length === 0) return null;

  const taille =
    size === "sm" ? "w-2 h-2" : size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5";

  return (
    <div className="flex items-center gap-1.5">
      {membresIds.map((membreId) => {
        const membre = membresAffichage.find((m) => m.id === membreId);
        if (!membre) return null;
        return (
          <div
            key={membreId}
            className={`${taille} rounded-full flex-shrink-0`}
            style={{ backgroundColor: membre.couleur }}
            title={membre.nom}
          />
        );
      })}
      {showNames && (
        <span className="text-xs text-gray-600 ml-1">
          {membresIds
            .map((id) => membresAffichage.find((m) => m.id === id)?.nom || id)
            .join(", ")}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ★ COMPOSANT : VueMensuelle (avec barres multi-jours)
// ─────────────────────────────────────────────
function VueMensuelle({ evenementsFiltres, onOuvrirDetail }) {
  const aujourdhui = new Date();
  const [moisAffiche, setMoisAffiche] = useState(aujourdhui.getMonth());
  const [anneeAffichee, setAnneeAffichee] = useState(aujourdhui.getFullYear());

  const estMoisActuel =
    moisAffiche === aujourdhui.getMonth() &&
    anneeAffichee === aujourdhui.getFullYear();

  const retourMoisActuel = () => {
    setMoisAffiche(aujourdhui.getMonth());
    setAnneeAffichee(aujourdhui.getFullYear());
  };

  const premiersJours = new Date(anneeAffichee, moisAffiche, 1);
  const dernierJourMois = new Date(anneeAffichee, moisAffiche + 1, 0).getDate();
  const premierJourSemaine = premiersJours.getDay();
  const decalage = premierJourSemaine === 0 ? 6 : premierJourSemaine - 1;

  const joursCalendrier = [];
  for (let i = 0; i < decalage; i++) {
    joursCalendrier.push(null);
  }
  for (let j = 1; j <= dernierJourMois; j++) {
    joursCalendrier.push(j);
  }

  const grilleJoursRef = useRef(null);
  const [positionsLignes, setPositionsLignes] = useState([]);

  const calculerPositionsLignes = () => {
    const grille = grilleJoursRef.current;
    if (!grille) return;

    const enfants = Array.from(grille.children);
    const nbLignes = Math.ceil(enfants.length / 7);
    const nouvellesPositions = [];

    for (let ligne = 0; ligne < nbLignes; ligne++) {
      const cellule = enfants[ligne * 7];
      if (cellule) {
        nouvellesPositions.push(cellule.offsetTop);
      }
    }

    setPositionsLignes(nouvellesPositions);
  };

  useLayoutEffect(() => {
    const rafId = window.requestAnimationFrame(calculerPositionsLignes);
    window.addEventListener("resize", calculerPositionsLignes);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", calculerPositionsLignes);
    };
  }, [
    joursCalendrier.length,
    moisAffiche,
    anneeAffichee,
    evenementsFiltres.length,
  ]);

  // ★ NOUVEAU : Conversion jour -> index de cellule dans la grille
  const getIndexCellule = (jour) => {
    if (!jour) return -1;
    return decalage + jour - 1;
  };

  // ★ NOUVEAU : Séparation événements multi-jours vs mono-jour
  const evenementsMultiJours = [];
  const evenementsMonoJourParJour = {};

  const nbCellules = joursCalendrier.length;
  const nbSemaines = Math.ceil(nbCellules / 7);
  const lanesParSemaine = Array.from({ length: nbSemaines }, () => []);

  const hauteurBarre = 22;
  const margeEntreBarres = 4;

  const evenementsMultiJoursMap = new Map();

  evenementsFiltres.forEach((ev) => {
    const dateDebut = new Date(ev.date);
    const dateFin = ev.dateFin ? new Date(ev.dateFin) : dateDebut;

    const estMultiJour =
      dateFin.toISOString().split("T")[0] !==
      dateDebut.toISOString().split("T")[0];

    if (estMultiJour) {
      const cle = `${ev.titre}__${ev.date}__${ev.dateFin || ev.date}__${ev.heureDebut || ""}__${ev.serieId || ""}`;
      const membresIds = ev.membres || [ev.membre];
      const ids = ev.ids || [ev.id];

      if (evenementsMultiJoursMap.has(cle)) {
        const existant = evenementsMultiJoursMap.get(cle);
        membresIds.forEach((membreId) => {
          if (membreId && !existant.membres.includes(membreId)) {
            existant.membres.push(membreId);
          }
        });
        ids.forEach((id) => {
          if (!existant.ids.includes(id)) {
            existant.ids.push(id);
          }
        });
      } else {
        evenementsMultiJoursMap.set(cle, {
          ...ev,
          membres: Array.from(new Set(membresIds)),
          ids: Array.from(new Set(ids)),
        });
      }
    } else if (
      dateDebut.getMonth() === moisAffiche &&
      dateDebut.getFullYear() === anneeAffichee
    ) {
      const jour = dateDebut.getDate();
      if (!evenementsMonoJourParJour[jour]) {
        evenementsMonoJourParJour[jour] = [];
      }
      evenementsMonoJourParJour[jour].push(ev);
    }
  });

  Array.from(evenementsMultiJoursMap.values()).forEach((ev) => {
    const dateDebut = new Date(ev.date);
    const dateFin = ev.dateFin ? new Date(ev.dateFin) : dateDebut;

    const jourDebut = dateDebut.getDate();
    const jourFin = dateFin.getDate();

    const dansLeMoisActuel =
      (dateDebut.getMonth() === moisAffiche &&
        dateDebut.getFullYear() === anneeAffichee) ||
      (dateFin.getMonth() === moisAffiche &&
        dateFin.getFullYear() === anneeAffichee) ||
      (dateDebut < premiersJours &&
        dateFin > new Date(anneeAffichee, moisAffiche + 1, 0));

    if (!dansLeMoisActuel) return;

    const indexDebut = getIndexCellule(
      dateDebut.getMonth() === moisAffiche &&
        dateDebut.getFullYear() === anneeAffichee
        ? jourDebut
        : 1,
    );
    const indexFin = getIndexCellule(
      dateFin.getMonth() === moisAffiche &&
        dateFin.getFullYear() === anneeAffichee
        ? jourFin
        : dernierJourMois,
    );

    const semaineDebut = Math.floor(indexDebut / 7);
    const jourDebutIndex = indexDebut % 7;
    const semaineFin = Math.floor(indexFin / 7);
    const jourFinIndex = indexFin % 7;

    for (let sem = semaineDebut; sem <= semaineFin; sem++) {
      const premierJourBarre = sem === semaineDebut ? jourDebutIndex : 0;
      const dernierJourBarre = sem === semaineFin ? jourFinIndex : 6;
      const largeurBarre = dernierJourBarre - premierJourBarre + 1;

      let laneIdx = lanesParSemaine[sem].findIndex((lane) => {
        return Array.from({ length: largeurBarre }).every(
          (_, colonne) => !lane[premierJourBarre + colonne],
        );
      });

      if (laneIdx === -1) {
        laneIdx = lanesParSemaine[sem].length;
        lanesParSemaine[sem][laneIdx] = Array(7).fill(false);
      }

      for (let col = premierJourBarre; col <= dernierJourBarre; col++) {
        lanesParSemaine[sem][laneIdx][col] = true;
      }

      evenementsMultiJours.push({
        ...ev,
        semaine: sem,
        colDebut: premierJourBarre,
        largeur: largeurBarre,
        lane: laneIdx,
      });
    }
  });

  const hauteurZoneBarresSemaine = (semaine) => {
    const nbLignes = lanesParSemaine[semaine]?.length || 0;
    if (nbLignes === 0) return 0;
    return (
      nbLignes * hauteurBarre + Math.max(0, nbLignes - 1) * margeEntreBarres + 4
    );
  };

  const moisPrecedent = () => {
    if (moisAffiche === 0) {
      setMoisAffiche(11);
      setAnneeAffichee(anneeAffichee - 1);
    } else {
      setMoisAffiche(moisAffiche - 1);
    }
  };

  const moisSuivant = () => {
    if (moisAffiche === 11) {
      setMoisAffiche(0);
      setAnneeAffichee(anneeAffichee + 1);
    } else {
      setMoisAffiche(moisAffiche + 1);
    }
  };

  const estAujourdhui = (jour) => {
    return (
      jour === aujourdhui.getDate() &&
      moisAffiche === aujourdhui.getMonth() &&
      anneeAffichee === aujourdhui.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={moisPrecedent}
          className="text-gray-400 hover:text-gray-600 font-bold text-xl"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-gray-800 sm:text-lg">
            {MOIS_FR[moisAffiche]} {anneeAffichee}
          </h3>
          {!estMoisActuel && (
            <button
              onClick={retourMoisActuel}
              className="rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-[10px] font-bold hover:bg-gray-200"
            >
              Aujourd'hui
            </button>
          )}
        </div>
        <button
          onClick={moisSuivant}
          className="text-gray-400 hover:text-gray-600 font-bold text-xl"
        >
          ›
        </button>
      </div>

      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {JOURS_SEMAINE.map((jour) => (
          <div
            key={jour}
            className="text-center text-[10px] font-semibold text-gray-400 p-1 sm:text-xs"
          >
            {jour}
          </div>
        ))}
      </div>

      {/* Conteneur principal avec position relative pour les barres absolues */}
      <div className="relative overflow-hidden">
        {/* ★ NOUVEAU : Barres multi-jours en position absolue */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {evenementsMultiJours.map((ev, idx) => {
            const couleurMembre = getCouleurEtiquette(ev);
            const positionY = positionsLignes[ev.semaine];
            const topOffset =
              positionY != null
                ? positionY + 24 + ev.lane * (hauteurBarre + margeEntreBarres)
                : `calc(${ev.semaine * (80 + 4)}px + 8px + 20px + ${ev.lane * (hauteurBarre + margeEntreBarres)}px)`;

            return (
              <div
                key={`${idx}-${ev.semaine}-${ev.colDebut}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOuvrirDetail(ev);
                }}
                className="absolute pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  top:
                    typeof topOffset === "number"
                      ? `${topOffset}px`
                      : topOffset,
                  left: `calc((100% - 24px) * ${ev.colDebut} / 7 + ${ev.colDebut * 4}px)`,
                  width: `calc((100% - 24px) * ${ev.largeur} / 7 + ${Math.max(0, ev.largeur - 1) * 4}px - 4px)`,
                  height: `${hauteurBarre}px`,
                  backgroundColor: couleurMembre,
                  borderRadius: "4px",
                  padding: "2px 6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "white",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
                title={ev.titre}
              >
                {ev.titre}
              </div>
            );
          })}
        </div>

        {/* Grille des jours (avec espace pour les barres) */}
        <div ref={grilleJoursRef} className="grid grid-cols-7 gap-1">
          {joursCalendrier.map((jour, index) => {
            const evsJour = jour ? evenementsMonoJourParJour[jour] || [] : [];
            const evsAffiches = regrouperEvenements(evsJour);

            return (
              <div
                key={index}
                className={`min-h-[90px] md:min-h-[80px] border border-gray-100 rounded-lg p-1 ${
                  jour
                    ? estAujourdhui(jour)
                      ? "bg-indigo-50 border-indigo-300"
                      : "bg-white hover:bg-gray-50"
                    : "bg-gray-50"
                }`}
              >
                {jour && (
                  <>
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        estAujourdhui(jour)
                          ? "text-indigo-600"
                          : "text-gray-600"
                      }`}
                    >
                      {jour}
                    </div>
                    {/* ★ Espace réservé pour les barres multi-jours */}
                    <div
                      style={{
                        height: `${hauteurZoneBarresSemaine(
                          Math.floor(index / 7),
                        )}px`,
                      }}
                    ></div>
                    {/* Événements mono-jour */}
                    <div className="space-y-0.5">
                      {evsAffiches.slice(0, 2).map((ev, i) => {
                        const membresIds = ev.membres || [ev.membre];
                        const couleurEtiquette = getCouleurEtiquette(ev);
                        const estMultiMembres = membresIds.length > 1;

                        return (
                          <button
                            key={i}
                            onClick={() => onOuvrirDetail(ev)}
                            className="w-full text-left px-2 py-1 rounded text-[11px] font-semibold"
                            style={{
                              backgroundColor: couleurEtiquette,
                              color: "white",
                            }}
                          >
                            <div className="truncate leading-tight text-[11px]">
                              {ev.heureDebut && ev.heureDebut !== "00:00"
                                ? `${ev.heureDebut} `
                                : ""}
                              {ev.titre}
                            </div>
                            {estMultiMembres && (
                              <div className="flex gap-0.5 mt-0.5">
                                <AvatarsMembres
                                  membresIds={membresIds}
                                  size="sm"
                                />
                              </div>
                            )}
                          </button>
                        );
                      })}
                      {evsAffiches.length > 2 && (
                        <div className="text-[11px] text-gray-400 px-1">
                          +{evsAffiches.length - 2}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ★ COMPOSANT : VueSemaine
// ─────────────────────────────────────────────
function VueSemaine({ evenementsFiltres, onOuvrirDetail }) {
  const [debutSemaine, setDebutSemaine] = useState(() => {
    const d = new Date();
    const jour = d.getDay();
    const diff = jour === 0 ? 6 : jour - 1;
    d.setDate(d.getDate() - diff);
    return d;
  });

  const debutSemaineAujourdhui = (() => {
    const d = new Date();
    const jour = d.getDay();
    const diff = jour === 0 ? 6 : jour - 1;
    d.setDate(d.getDate() - diff);
    return d;
  })();

  const retourSemaineActuelle = () => {
    setDebutSemaine(new Date(debutSemaineAujourdhui));
  };

  const estSemaineActuelle =
    debutSemaine.toDateString() === debutSemaineAujourdhui.toDateString();

  const semainePrecedente = () => {
    const nouvelle = new Date(debutSemaine);
    nouvelle.setDate(nouvelle.getDate() - 7);
    setDebutSemaine(nouvelle);
  };

  const semaineSuivante = () => {
    const nouvelle = new Date(debutSemaine);
    nouvelle.setDate(nouvelle.getDate() + 7);
    setDebutSemaine(nouvelle);
  };

  const joursDeLaSemaine = Array.from({ length: 7 }, (_, i) => {
    const jour = new Date(debutSemaine);
    jour.setDate(debutSemaine.getDate() + i);
    return jour;
  });

  const dateToKey = (date) => date.toISOString().split("T")[0];

  const dateDebutSemaine = parseDateLocale(dateToKey(joursDeLaSemaine[0]));
  const dateFinSemaine = parseDateLocale(dateToKey(joursDeLaSemaine[6]));

  const evenementsMonoJour = {};
  const evenementsMultiJoursMap = new Map();

  evenementsFiltres.forEach((ev) => {
    const dateDebut = parseDateLocale(ev.date);
    const dateFin = ev.dateFin ? parseDateLocale(ev.dateFin) : dateDebut;
    const estMultiJour = dateFin > dateDebut;

    if (
      estMultiJour &&
      dateFin >= dateDebutSemaine &&
      dateDebut <= dateFinSemaine
    ) {
      const cle = `${ev.titre}__${ev.date}__${ev.dateFin || ev.date}__${
        ev.heureDebut || ""
      }__${ev.serieId || ""}`;
      const membresIds = ev.membres || [ev.membre];
      const ids = ev.ids || [ev.id];

      if (evenementsMultiJoursMap.has(cle)) {
        const existant = evenementsMultiJoursMap.get(cle);
        membresIds.forEach((membreId) => {
          if (membreId && !existant.membres.includes(membreId)) {
            existant.membres.push(membreId);
          }
        });
        ids.forEach((id) => {
          if (!existant.ids.includes(id)) {
            existant.ids.push(id);
          }
        });
      } else {
        evenementsMultiJoursMap.set(cle, {
          ...ev,
          membres: Array.from(new Set(membresIds)),
          ids: Array.from(new Set(ids)),
        });
      }
    } else if (
      !estMultiJour &&
      dateDebut >= dateDebutSemaine &&
      dateDebut <= dateFinSemaine
    ) {
      const key = dateToKey(dateDebut);
      if (!evenementsMonoJour[key]) evenementsMonoJour[key] = [];
      evenementsMonoJour[key].push(ev);
    }
  });

  const evenementsMultiJours = [];
  const lanes = [];
  const hauteurBarre = 22;
  const margeEntreBarres = 4;

  Array.from(evenementsMultiJoursMap.values()).forEach((ev) => {
    const dateDebut = parseDateLocale(ev.date);
    const dateFin = ev.dateFin ? parseDateLocale(ev.dateFin) : dateDebut;
    const dateDebutVisible =
      dateDebut < dateDebutSemaine ? dateDebutSemaine : dateDebut;
    const dateFinVisible = dateFin > dateFinSemaine ? dateFinSemaine : dateFin;
    const colDebut = Math.max(
      0,
      Math.min(6, Math.floor((dateDebutVisible - dateDebutSemaine) / 86400000)),
    );
    const colFin = Math.max(
      0,
      Math.min(6, Math.floor((dateFinVisible - dateDebutSemaine) / 86400000)),
    );
    const largeur = colFin - colDebut + 1;

    let laneIdx = lanes.findIndex((lane) => {
      return Array.from({ length: largeur }).every(
        (_, idx) => !lane[colDebut + idx],
      );
    });

    if (laneIdx === -1) {
      laneIdx = lanes.length;
      lanes.push(Array(7).fill(false));
    }

    for (let col = colDebut; col <= colFin; col++) {
      lanes[laneIdx][col] = true;
    }

    evenementsMultiJours.push({
      ...ev,
      colDebut,
      largeur,
      lane: laneIdx,
    });
  });

  const hauteurZoneBarres =
    lanes.length > 0
      ? lanes.length * hauteurBarre +
        Math.max(0, lanes.length - 1) * margeEntreBarres
      : 0;

  const evsDuJour = (date) => {
    const dateStr = dateToKey(date);
    return regrouperEvenements(evenementsMonoJour[dateStr] || []);
  };

  const estAujourdhui = (date) => {
    const aujourdhui = new Date();
    return date.toDateString() === aujourdhui.toDateString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={semainePrecedente}
          className="text-gray-400 hover:text-gray-600 font-bold text-xl"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-600">
            {joursDeLaSemaine[0].toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}{" "}
            -{" "}
            {joursDeLaSemaine[6].toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </h3>
          {!estSemaineActuelle && (
            <button
              onClick={retourSemaineActuelle}
              className="rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-bold hover:bg-gray-200"
            >
              Aujourd'hui
            </button>
          )}
        </div>
        <button
          onClick={semaineSuivante}
          className="text-gray-400 hover:text-gray-600 font-bold text-xl"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {joursDeLaSemaine.map((date, index) => (
          <div key={index} className="text-center">
            <div className="text-[10px] font-semibold text-gray-500 mb-1">
              {JOURS_SEMAINE[index]}
            </div>
            <div
              className={`text-lg font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                estAujourdhui(date)
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700"
              }`}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      <div
        className="relative mb-3"
        style={{ minHeight: `${hauteurZoneBarres}px` }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {evenementsMultiJours.map((ev, i) => {
            const couleurEtiquette = getCouleurEtiquette(ev);
            return (
              <div
                key={`${i}-${ev.colDebut}-${ev.lane}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOuvrirDetail(ev);
                }}
                className="absolute pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  top: `${ev.lane * (hauteurBarre + margeEntreBarres)}px`,
                  left: `calc(${(ev.colDebut / 7) * 100}% + ${ev.colDebut * 8}px - ${(48 * ev.colDebut) / 7}px)`,
                  width: `calc(${(ev.largeur / 7) * 100}% + ${Math.max(0, ev.largeur - 1) * 8}px - ${(48 * ev.largeur) / 7}px - 4px)`,
                  height: `${hauteurBarre}px`,
                  backgroundColor: couleurEtiquette,
                  borderRadius: "8px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "white",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
                title={ev.titre}
              >
                {ev.titre}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {joursDeLaSemaine.map((date, index) => {
          const evs = evsDuJour(date);
          return (
            <div key={index} className="flex flex-col">
              <div className="flex-1 space-y-1.5">
                {evs.length === 0 && (
                  <div className="text-center text-gray-300 text-[10px] py-4">
                    —
                  </div>
                )}
                {evs.map((ev, i) => {
                  const membresIds = ev.membres || [ev.membre];
                  const couleurEtiquette = getCouleurEtiquette(ev);
                  const estMultiMembres = membresIds.length > 1;

                  return (
                    <button
                      key={i}
                      onClick={() => onOuvrirDetail(ev)}
                      className="w-full text-left px-2 py-1 rounded text-[11px] font-semibold"
                      style={{
                        backgroundColor: couleurEtiquette,
                        color: "white",
                      }}
                    >
                      <div className="truncate leading-tight text-[11px]">
                        {ev.titre}
                      </div>
                      {estMultiMembres && (
                        <div className="flex gap-0.5 mt-0.5">
                          <AvatarsMembres membresIds={membresIds} size="sm" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {joursDeLaSemaine.every((d) => evsDuJour(d).length === 0) && (
        <div className="text-center text-gray-400 py-6 text-sm mt-2">
          Aucun événement cette semaine
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL : Calendrier
// ─────────────────────────────────────────────
function Calendrier({ membreActif }) {
  const [evenements, setEvenements] = useState([]);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [evenementDetail, setEvenementDetail] = useState(null);
  const [vue, setVue] = useState("liste");

  const [titre, setTitre] = useState("");
  const [date, setDate] = useState("");
  const [dateFin, setDateFin] = useState(""); // ★ NOUVEAU : date de fin pour événements multi-jours
  const [touteLaJournee, setTouteLaJournee] = useState(false); // ★ NOUVEAU : checkbox toute la journée
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [recurrence, setRecurrence] = useState("aucune");
  const [dateFinRecurrence, setDateFinRecurrence] = useState("");
  const [configRecurrencePersonnalisee, setConfigRecurrencePersonnalisee] =
    useState(null); // ★ NOUVEAU : config récurrence personnalisée
  const [afficherModalRecurrence, setAfficherModalRecurrence] = useState(false); // ★ NOUVEAU : état du modal
  const [membresChoisis, setMembresChoisis] = useState([]);
  const [lieu, setLieu] = useState("");
  const [lieuType, setLieuType] = useState("texte");
  const [description, setDescription] = useState("");
  const [evenementEnModification, setEvenementEnModification] = useState(null);

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
    setDateFin("");
    setTouteLaJournee(false);
    setHeureDebut("");
    setHeureFin("");
    setRecurrence("aucune");
    setDateFinRecurrence("");
    setConfigRecurrencePersonnalisee(null);
    setMembresChoisis([]);
    setLieu("");
    setLieuType("texte");
    setDescription("");
    setAfficherFormulaire(false);
    setEvenementEnModification(null);
  };

  const ouvrirFormulaireModification = (evenement) => {
    setTitre(evenement.titre || "");
    setDate(evenement.date || "");
    setDateFin(evenement.dateFin || "");
    setTouteLaJournee(
      !evenement.heureDebut || evenement.heureDebut === "00:00",
    );
    setHeureDebut(evenement.heureDebut || "00:00");
    setHeureFin(evenement.heureFin || "");
    setRecurrence(evenement.recurrence || "aucune");
    setDateFinRecurrence("");

    const membresInitiales = evenement.membres || [evenement.membre];
    const membresSanitises = membresInitiales.filter(
      (membreId) => membreId !== "famille" || membresInitiales.length === 1,
    );
    setMembresChoisis(
      membresSanitises[0] === "famille" ? [] : membresSanitises,
    );

    setLieu(evenement.lieu || "");
    setLieuType(evenement.lieuType || "texte");
    setDescription(evenement.description || "");
    setEvenementEnModification(evenement);
    setAfficherFormulaire(true);
    setEvenementDetail(null);
  };

  const toggleMembre = (membreId) => {
    setMembresChoisis((prev) =>
      prev.includes(membreId)
        ? prev.filter((m) => m !== membreId)
        : [...prev, membreId],
    );
  };

  // ★ NOUVEAU : Gestion de la récurrence personnalisée
  const handleRecurrenceChange = (nouvelleRecurrence) => {
    setRecurrence(nouvelleRecurrence);
    if (nouvelleRecurrence === "personnalise") {
      setAfficherModalRecurrence(true);
    }
  };

  const sauvegarderRecurrencePersonnalisee = (config) => {
    setConfigRecurrencePersonnalisee(config);
    setAfficherModalRecurrence(false);
  };

  const ajouterEvenement = async () => {
    if (!titre.trim() || !date) return;

    // ★ MODE MODIFICATION
    if (evenementEnModification) {
      const idsAModifier = evenementEnModification.ids || [
        evenementEnModification.id,
      ];
      const batch = writeBatch(db);

      idsAModifier.forEach((id) => batch.delete(doc(db, "evenements", id)));

      const selectedMembers = membresChoisis.filter((m) => m !== "famille");
      const membresFinaux =
        selectedMembers.length === 0 ? ["famille"] : selectedMembers;
      for (const m of membresFinaux) {
        const ref = doc(collection(db, "evenements"));
        batch.set(ref, {
          titre: titre.trim(),
          date: date,
          dateFin: dateFin || date, // ★ NOUVEAU : date de fin
          touteLaJournee, // ★ NOUVEAU
          heureDebut: touteLaJournee ? "00:00" : heureDebut || "00:00",
          heureFin: touteLaJournee ? "" : heureFin || "",
          heure: touteLaJournee ? "00:00" : heureDebut || "00:00",
          membre: m,
          lieu: lieu.trim(),
          lieuType,
          description: description.trim(),
          recurrence: "aucune",
          serieId: null,
          source: evenementEnModification.source || "local",
          googleEventId: evenementEnModification.googleEventId || null,
          agendaId: evenementEnModification.agendaId || null,
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
      reinitialiserFormulaire();
      return;
    }

    // ★ MODE CRÉATION
    const serieId =
      recurrence !== "aucune" && recurrence !== "personnalise"
        ? `serie_${Date.now()}`
        : recurrence === "personnalise" && configRecurrencePersonnalisee
          ? `serie_${Date.now()}`
          : null;

    // Générer les dates selon le type de récurrence
    let dates = [];
    if (recurrence === "personnalise" && configRecurrencePersonnalisee) {
      dates = genererDatesRecurrencePersonnalisee(
        date,
        configRecurrencePersonnalisee,
        configRecurrencePersonnalisee.dateFin || dateFinRecurrence || null,
      );
    } else if (recurrence !== "aucune") {
      dates = genererDatesRecurrence(date, recurrence, dateFinRecurrence);
    } else {
      dates = [date];
    }

    const selectedMembers = membresChoisis.filter((m) => m !== "famille");
    const membresFinaux =
      selectedMembers.length === 0 ? ["famille"] : selectedMembers;
    const batch = writeBatch(db);

    for (const d of dates) {
      for (const m of membresFinaux) {
        const ref = doc(collection(db, "evenements"));
        batch.set(ref, {
          titre: titre.trim(),
          date: d,
          dateFin: dateFin || d, // ★ NOUVEAU
          touteLaJournee, // ★ NOUVEAU
          heureDebut: touteLaJournee ? "00:00" : heureDebut || "00:00",
          heureFin: touteLaJournee ? "" : heureFin || "",
          heure: touteLaJournee ? "00:00" : heureDebut || "00:00",
          membre: m,
          lieu: lieu.trim(),
          lieuType,
          description: description.trim(),
          recurrence:
            recurrence === "personnalise" ? "personnalise" : recurrence,
          configRecurrencePersonnalisee:
            recurrence === "personnalise"
              ? configRecurrencePersonnalisee
              : null,
          serieId,
          createdAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
    reinitialiserFormulaire();
  };

  const supprimerEvenement = async (evenement) => {
    const idsASupprimer = evenement.ids || [evenement.id];

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
        const batch = writeBatch(db);
        idsASupprimer.forEach((id) => batch.delete(doc(db, "evenements", id)));
        await batch.commit();
      }
    } else {
      const batch = writeBatch(db);
      idsASupprimer.forEach((id) => batch.delete(doc(db, "evenements", id)));
      await batch.commit();
    }
    setEvenementDetail(null);
  };

  const formatDate = (dateStr) =>
    parseDateLocale(dateStr).toLocaleDateString("fr-FR", {
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
    acc[ev.date].push(ev);
    return acc;
  }, {});
  Object.keys(evenementsParDate).forEach((date) => {
    evenementsParDate[date] = regrouperEvenements(evenementsParDate[date]);
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">📅 Calendrier</h2>
        <button
          onClick={() => setAfficherFormulaire(!afficherFormulaire)}
          className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm"
        >
          + Ajouter
        </button>
      </div>

      {/* Sélecteur 3 vues */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-5">
        {[
          { id: "liste", label: "📋 Liste" },
          { id: "semaine", label: "📆 Semaine" },
          { id: "mois", label: "📅 Mois" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setVue(id)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
              ${vue === id ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ★ MODAL DE RÉCURRENCE PERSONNALISÉE */}
      {afficherModalRecurrence && (
        <ModalRecurrencePersonnalisee
          config={configRecurrencePersonnalisee}
          onSave={sauvegarderRecurrencePersonnalisee}
          onClose={() => {
            setAfficherModalRecurrence(false);
            setRecurrence("aucune"); // Réinitialiser si annulation
          }}
        />
      )}

      {/* Formulaire d'ajout/modification */}
      {afficherFormulaire && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-sm font-bold text-gray-600 mb-4">
            {evenementEnModification
              ? "✏️ Modifier l'événement"
              : "➕ Nouvel événement"}
          </h3>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre de l'événement..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />

            {/* ★ NOUVEAU : Dates (début et fin) */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-400 mb-1 block">
                  Date de début
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-400 mb-1 block">
                  Date de fin{" "}
                  <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="date"
                  value={dateFin}
                  min={date}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* ★ NOUVEAU : Checkbox toute la journée */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={touteLaJournee}
                onChange={(e) => setTouteLaJournee(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Toute la journée</span>
            </label>

            {/* Heures (masquées si toute la journée) */}
            {!touteLaJournee && (
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
            )}

            {/* ★ MODIFIÉ : Récurrence avec option personnalisée */}
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">
                Récurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => handleRecurrenceChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
              >
                {recurrences.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nom}
                  </option>
                ))}
              </select>
              {recurrence === "personnalise" &&
                configRecurrencePersonnalisee && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                    ✓ Récurrence configurée :{" "}
                    {configRecurrencePersonnalisee.intervalle > 1
                      ? `Tous les ${configRecurrencePersonnalisee.intervalle} `
                      : "Tous les "}
                    {configRecurrencePersonnalisee.type === "jour"
                      ? "jours"
                      : configRecurrencePersonnalisee.type === "semaine"
                        ? "semaines"
                        : configRecurrencePersonnalisee.type === "mois"
                          ? "mois"
                          : "années"}
                    {configRecurrencePersonnalisee.finType === "jamais"
                      ? " (sans fin)"
                      : configRecurrencePersonnalisee.finType === "le"
                        ? ` jusqu'au ${configRecurrencePersonnalisee.dateFin}`
                        : ` (${configRecurrencePersonnalisee.occurrences} fois)`}
                    <button
                      type="button"
                      onClick={() => setAfficherModalRecurrence(true)}
                      className="ml-2 text-indigo-600 font-bold hover:underline"
                    >
                      Modifier
                    </button>
                  </div>
                )}
            </div>

            {/* Date de fin de récurrence (pour récurrences simples) */}
            {recurrence !== "aucune" && recurrence !== "personnalise" && (
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
                  min={date}
                  onChange={(e) => setDateFinRecurrence(e.target.value)}
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
                {evenementEnModification
                  ? "💾 Mettre à jour"
                  : "💾 Enregistrer"}
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

      {/* Modal de détail */}
      {evenementDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
            {membreActif === "famille" ? (
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: "#4A4E69" }}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">
                    {evenementDetail.titre}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5 mb-1.5">
                    {(evenementDetail.membres || [evenementDetail.membre])
                      .map(
                        (id) =>
                          membresAffichage.find((m) => m.id === id)?.nom || id,
                      )
                      .join(", ")}
                  </p>
                  <AvatarsMembres
                    membresIds={
                      evenementDetail.membres || [evenementDetail.membre]
                    }
                    size="md"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <AvatarsMembres
                  membresIds={
                    evenementDetail.membres || [evenementDetail.membre]
                  }
                  size="lg"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">
                    {evenementDetail.titre}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {(evenementDetail.membres || [evenementDetail.membre])
                      .map(
                        (id) =>
                          membresAffichage.find((m) => m.id === id)?.nom || id,
                      )
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2 text-sm text-gray-600 mb-4">
              <p>
                📅 {formatDate(evenementDetail.date)}
                {evenementDetail.dateFin &&
                  evenementDetail.dateFin !== evenementDetail.date &&
                  ` → ${formatDate(evenementDetail.dateFin)}`}
              </p>
              {evenementDetail.heureDebut &&
                evenementDetail.heureDebut !== "00:00" &&
                !evenementDetail.touteLaJournee && (
                  <p>
                    🕐 {evenementDetail.heureDebut}
                    {evenementDetail.heureFin
                      ? ` → ${evenementDetail.heureFin}`
                      : ""}
                  </p>
                )}
              {evenementDetail.touteLaJournee && (
                <p className="text-xs text-gray-400">🌞 Toute la journée</p>
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
                    {evenementDetail.recurrence === "personnalise"
                      ? "Récurrence personnalisée"
                      : recurrences.find(
                          (r) => r.id === evenementDetail.recurrence,
                        )?.nom}
                  </p>
                )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => ouvrirFormulaireModification(evenementDetail)}
                className="flex-1 text-xs font-bold text-blue-600 border border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-50"
              >
                ✏️ Modifier
              </button>
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

      {/* Vue SEMAINE */}
      {!chargement && vue === "semaine" && (
        <VueSemaine
          evenementsFiltres={evenementsFiltres}
          onOuvrirDetail={setEvenementDetail}
          membreActif={membreActif}
        />
      )}

      {/* Vue MOIS */}
      {!chargement && vue === "mois" && (
        <VueMensuelle
          evenementsFiltres={evenementsFiltres}
          onOuvrirDetail={setEvenementDetail}
          membreActif={membreActif}
        />
      )}

      {/* Vue LISTE */}
      {!chargement && vue === "liste" && (
        <>
          {Object.keys(evenementsParDate)
            .sort()
            .map((dateStr) => (
              <div key={dateStr} className="mb-4">
                <p className="text-xs font-bold text-gray-400 capitalize mb-2">
                  {formatDate(dateStr)}
                </p>
                <div className="flex flex-col gap-2">
                  {evenementsParDate[dateStr].map((ev, i) => {
                    const estFamille = membreActif === "famille";
                    return estFamille ? (
                      <div
                        key={i}
                        onClick={() => setEvenementDetail(ev)}
                        className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: "#4A4E69" }}
                        />
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-sm">
                            {ev.titre}
                          </p>
                          <p className="text-gray-400 text-xs mb-1.5">
                            {ev.heureDebut && ev.heureDebut !== "00:00"
                              ? `${ev.heureDebut}${ev.heureFin ? ` → ${ev.heureFin}` : ""} · `
                              : ""}
                            {(ev.membres || [ev.membre])
                              .map(
                                (id) =>
                                  membresAffichage.find((m) => m.id === id)
                                    ?.nom || id,
                              )
                              .join(", ")}
                            {ev.lieu ? ` · 📍 ${ev.lieu}` : ""}
                            {ev.recurrence && ev.recurrence !== "aucune"
                              ? " · 🔁"
                              : ""}
                          </p>
                          <AvatarsMembres
                            membresIds={ev.membres || [ev.membre]}
                            size="sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        key={i}
                        onClick={() => setEvenementDetail(ev)}
                        className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
                      >
                        <AvatarsMembres
                          membresIds={ev.membres || [ev.membre]}
                          size="lg"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-sm">
                            {ev.titre}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {ev.heureDebut && ev.heureDebut !== "00:00"
                              ? `${ev.heureDebut}${ev.heureFin ? ` → ${ev.heureFin}` : ""} · `
                              : ""}
                            {(ev.membres || [ev.membre])
                              .map(
                                (id) =>
                                  membresAffichage.find((m) => m.id === id)
                                    ?.nom || id,
                              )
                              .join(", ")}
                            {ev.lieu ? ` · 📍 ${ev.lieu}` : ""}
                            {ev.recurrence && ev.recurrence !== "aucune"
                              ? " · 🔁"
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          {evenementsFiltres.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <p className="text-4xl mb-2">📅</p>
              <p className="font-semibold">Aucun événement</p>
              <p className="text-sm">Ajoute ton premier événement !</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Calendrier;
