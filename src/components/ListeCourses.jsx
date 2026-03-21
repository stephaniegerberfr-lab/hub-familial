import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  memoriserArticle,
  articlesDeBase,
  getSuggestionsApprises,
} from "../services/suggestions";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const categories = [
  { id: "fruits-legumes", nom: "🍎 Fruits & Légumes" },
  { id: "frais", nom: "🥛 Produits frais" },
  { id: "epicerie", nom: "🥫 Épicerie" },
  { id: "boucherie", nom: "🥩 Boucherie" },
  { id: "hygiene", nom: "🧴 Hygiène" },
];

function ListeCourses() {
  const [articles, setArticles] = useState([]);
  const [nouvelArticle, setNouvelArticle] = useState("");
  const [categorieChoisie, setCategorieChoisie] = useState("epicerie");
  const [chargement, setChargement] = useState(true);
  const [suggestionsApprises, setSuggestionsApprises] = useState([]);
  const [afficherSuggestions, setAfficherSuggestions] = useState(false);
  const [ecoute, setEcoute] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "courses"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArticles(data);
      setChargement(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    getSuggestionsApprises().then(setSuggestionsApprises);
  }, []);

  const totalArticles = articles.length;
  const articlesFaits = articles.filter((a) => a.fait).length;

  const ajouterArticle = async () => {
    if (!nouvelArticle.trim()) return;
    await addDoc(collection(db, "courses"), {
      nom: nouvelArticle.trim(),
      categorie: categorieChoisie,
      fait: false,
      createdAt: serverTimestamp(),
    });
    await memoriserArticle(nouvelArticle.trim(), categorieChoisie);
    setNouvelArticle("");
  };

  const cocherArticle = async (articleId, faitActuel) => {
    await updateDoc(doc(db, "courses", articleId), {
      fait: !faitActuel,
    });
  };

  const supprimerArticle = async (articleId) => {
    await deleteDoc(doc(db, "courses", articleId));
  };

  const viderCoches = async () => {
    const articlesFaitsListe = articles.filter((a) => a.fait);
    for (const article of articlesFaitsListe) {
      await deleteDoc(doc(db, "courses", article.id));
    }
  };

  const viderTout = async () => {
    if (!window.confirm("Vider toute la liste ?")) return;
    for (const article of articles) {
      await deleteDoc(doc(db, "courses", article.id));
    }
  };

  const ajouterDepuisSuggestion = async (article) => {
    await addDoc(collection(db, "courses"), {
      nom: article.nom,
      categorie: article.categorie,
      fait: false,
      createdAt: serverTimestamp(),
    });
  };

  const demarrerVocal = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setEcoute(true);
    recognition.onend = () => setEcoute(false);

    recognition.onresult = (event) => {
      const texte = event.results[0][0].transcript;
      setNouvelArticle(texte);
    };

    recognition.onerror = () => setEcoute(false);

    recognition.start();
  };

  const articlesParCategorie = categories
    .map((cat) => ({
      ...cat,
      articles: articles.filter((a) => a.categorie === cat.id),
    }))
    .filter((cat) => cat.articles.length > 0);

  // Fusionner articles de base + appris sans doublons
  const tousLesSuggestions = [...articlesDeBase];
  suggestionsApprises.forEach((s) => {
    const dejaDansBase = articlesDeBase.some(
      (b) => b.nom.toLowerCase() === s.nomNormalise,
    );
    if (!dejaDansBase)
      tousLesSuggestions.push({ nom: s.nom, categorie: s.categorie });
  });

  const nomsDejaEnListe = articles.map((a) => a.nom.toLowerCase());

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            🛒 Liste de courses
          </h2>
          <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">
            {articlesFaits}/{totalArticles} articles
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{
              width:
                totalArticles > 0
                  ? `${(articlesFaits / totalArticles) * 100}%`
                  : "0%",
            }}
          />
        </div>

        {/* Boutons de nettoyage */}
        {totalArticles > 0 && (
          <div className="flex gap-2">
            {articlesFaits > 0 && (
              <button
                onClick={viderCoches}
                className="flex-1 bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-2 rounded-xl hover:bg-emerald-100 transition-all"
              >
                ✓ Vider les cochés ({articlesFaits})
              </button>
            )}
            <button
              onClick={viderTout}
              className="flex-1 bg-red-50 text-red-600 text-sm font-bold px-3 py-2 rounded-xl hover:bg-red-100 transition-all"
            >
              🗑️ Tout vider
            </button>
          </div>
        )}
      </div>

      {/* Ajouter un article */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-600 mb-3">
          Ajouter un article
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={nouvelArticle}
            onChange={(e) => setNouvelArticle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ajouterArticle()}
            placeholder={ecoute ? "🎤 J'écoute..." : "Ex: Tomates..."}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
          <select
            value={categorieChoisie}
            onChange={(e) => setCategorieChoisie(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nom}
              </option>
            ))}
          </select>
          <button
            onClick={demarrerVocal}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              ecoute
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🎤
          </button>
          <button
            onClick={ajouterArticle}
            className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700"
          >
            +
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <button
          onClick={() => setAfficherSuggestions(!afficherSuggestions)}
          className="w-full flex justify-between items-center text-sm font-bold text-gray-600"
        >
          <span>⚡ Ajout rapide</span>
          <span className="text-gray-400">
            {afficherSuggestions ? "▲" : "▼"}
          </span>
        </button>

        {afficherSuggestions && (
          <div className="mt-3">
            {categories.map((cat) => {
              const articlesDeCat = tousLesSuggestions.filter(
                (a) => a.categorie === cat.id,
              );
              if (articlesDeCat.length === 0) return null;
              return (
                <div key={cat.id} className="mb-3">
                  <p className="text-xs font-bold text-gray-400 mb-2">
                    {cat.nom}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {articlesDeCat.map((article) => {
                      const dejaPresent = nomsDejaEnListe.includes(
                        article.nom.toLowerCase(),
                      );
                      return (
                        <button
                          key={article.nom}
                          disabled={dejaPresent}
                          onClick={() => ajouterDepuisSuggestion(article)}
                          className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                            dejaPresent
                              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          }`}
                        >
                          {dejaPresent ? "✓ " : "+ "}
                          {article.nom}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chargement */}
      {chargement && (
        <div className="text-center text-gray-400 py-8">Chargement...</div>
      )}

      {/* Articles par catégorie */}
      {articlesParCategorie.map((cat) => (
        <div key={cat.id} className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-500 mb-3">{cat.nom}</h3>
          <div className="flex flex-col gap-2">
            {cat.articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
              >
                <div
                  onClick={() => cocherArticle(article.id, article.fait)}
                  className={`flex items-center gap-3 flex-1 cursor-pointer ${
                    article.fait ? "opacity-50" : ""
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      article.fait
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-300"
                    }`}
                  >
                    {article.fait && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      article.fait
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {article.nom}
                  </span>
                </div>
                <button
                  onClick={() => supprimerArticle(article.id)}
                  className="text-gray-300 hover:text-red-400 transition-all text-lg px-1"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Liste vide */}
      {!chargement && totalArticles === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-4xl mb-2">🛒</p>
          <p className="font-semibold">La liste est vide</p>
          <p className="text-sm">Ajoute ton premier article !</p>
        </div>
      )}
    </div>
  );
}

export default ListeCourses;
