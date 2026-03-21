import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

// Articles de base pré-définis
export const articlesDeBase = [
  { nom: "Lait", categorie: "frais" },
  { nom: "Beurre", categorie: "frais" },
  { nom: "Crème fraîche", categorie: "frais" },
  { nom: "Fromage", categorie: "frais" },
  { nom: "Pain", categorie: "epicerie" },
  { nom: "Pain au lait", categorie: "epicerie" },
  { nom: "Croissants", categorie: "epicerie" },
  { nom: "Brioche", categorie: "epicerie" },
  { nom: "Pâte à tartiner", categorie: "epicerie" },
  { nom: "Confiture de Fraises", categorie: "epicerie" },
  { nom: "Farine", categorie: "epicerie" },
  { nom: "Sucre", categorie: "epicerie" },
  { nom: "Pâtes", categorie: "epicerie" },
  { nom: "Riz", categorie: "epicerie" },
  { nom: "Huile d'olive", categorie: "epicerie" },
  { nom: "Tomates", categorie: "fruits-legumes" },
  { nom: "Carottes", categorie: "fruits-legumes" },
  { nom: "Salade", categorie: "fruits-legumes" },
  { nom: "Pommes", categorie: "fruits-legumes" },
  { nom: "Citrons", categorie: "fruits-legumes" },
  { nom: "Bananes", categorie: "fruits-legumes" },
  { nom: "Poulet", categorie: "boucherie" },
  { nom: "Jambon", categorie: "boucherie" },
  { nom: "Steak haché", categorie: "boucherie" },
  { nom: "Shampoing", categorie: "hygiene" },
  { nom: "Dentifrice", categorie: "hygiene" },
  { nom: "Papier toilette", categorie: "hygiene" },
  { nom: "Liquide vaisselle", categorie: "hygiene" },
];

// Mémoriser un article après ajout manuel
export async function memoriserArticle(nom, categorie) {
  const nomNormalise = nom.trim().toLowerCase();

  // Vérifier si déjà mémorisé
  const q = query(
    collection(db, "suggestions"),
    where("nomNormalise", "==", nomNormalise),
  );
  const existant = await getDocs(q);
  if (!existant.empty) return; // déjà connu, on ne dédouble pas

  await addDoc(collection(db, "suggestions"), {
    nom: nom.trim(),
    nomNormalise,
    categorie,
    compteur: 1,
  });
}

// Récupérer toutes les suggestions apprises
export async function getSuggestionsApprises() {
  const snapshot = await getDocs(collection(db, "suggestions"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
