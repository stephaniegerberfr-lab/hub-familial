import { useState } from "react";

const categoriesInitiales = [
  {
    id: "fruits-legumes",
    nom: "🍎 Fruits & Légumes",
    articles: [
      { id: 1, nom: "Pommes", fait: false },
      { id: 2, nom: "Carottes", fait: false },
    ],
  },
  {
    id: "frais",
    nom: "🥛 Produits frais",
    articles: [
      { id: 3, nom: "Lait", fait: false },
      { id: 4, nom: "Yaourts", fait: false },
    ],
  },
  {
    id: "epicerie",
    nom: "🥫 Épicerie",
    articles: [{ id: 5, nom: "Pâtes", fait: false }],
  },
];

function ListeCourses() {
  const [categories, setCategories] = useState(categoriesInitiales);
  const [nouvelArticle, setNouvelArticle] = useState("");
  const [categorieChoisie, setCategorieChoisie] = useState("epicerie");

  const totalArticles = categories.reduce(
    (acc, cat) => acc + cat.articles.length,
    0,
  );
  const articlesFaits = categories.reduce(
    (acc, cat) => acc + cat.articles.filter((a) => a.fait).length,
    0,
  );

  const cocherArticle = (categorieId, articleId) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categorieId) return cat;
        return {
          ...cat,
          articles: cat.articles.map((art) => {
            if (art.id !== articleId) return art;
            return { ...art, fait: !art.fait };
          }),
        };
      }),
    );
  };

  const ajouterArticle = () => {
    if (!nouvelArticle.trim()) return;
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categorieChoisie) return cat;
        return {
          ...cat,
          articles: [
            ...cat.articles,
            {
              id: Date.now(),
              nom: nouvelArticle.trim(),
              fait: false,
            },
          ],
        };
      }),
    );
    setNouvelArticle("");
  };

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

        {/* Barre de progression */}
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

      {/* Articles par catégorie */}
      {categories.map((cat) => (
        <div key={cat.id} className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-500 mb-3">{cat.nom}</h3>
          <div className="flex flex-col gap-2">
            {cat.articles.map((article) => (
              <div
                key={article.id}
                onClick={() => cocherArticle(cat.id, article.id)}
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
    </div>
  );
}

export default ListeCourses;
