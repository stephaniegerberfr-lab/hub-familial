import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
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

  // Écoute les changements Firebase en temps réel
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
    setNouvelArticle("");
  };

  const cocherArticle = async (articleId, faitActuel) => {
    await updateDoc(doc(db, "courses", articleId), {
      fait: !faitActuel,
    });
  };

  // Regroupe les articles par catégorie
  const articlesParCategorie = categories
    .map((cat) => ({
      ...cat,
      articles: articles.filter((a) => a.categorie === cat.id),
    }))
    .filter((cat) => cat.articles.length > 0);

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
        <div className="w-full bg-gray-100 rounded-full h-2">
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
      </div>

      {/* Ajout rapide */}
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
            placeholder="Ex: Tomates..."
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
            onClick={ajouterArticle}
            className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700"
          >
            +
          </button>
        </div>
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
                onClick={() => cocherArticle(article.id, article.fait)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  article.fait
                    ? "bg-gray-50 opacity-50"
                    : "bg-gray-50 hover:bg-gray-100"
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
                  className={`text-sm font-semibold ${article.fait ? "line-through text-gray-400" : "text-gray-800"}`}
                >
                  {article.nom}
                </span>
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
