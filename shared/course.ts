export type Lesson = {
  id: string;
  title: string;
  duration: string;
  format: "Vidéo" | "Atelier" | "Ressource";
  summary: string;
  resource?: string;
};

export type CourseModule = {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  lessons: Lesson[];
};

export const COURSE_OFFER = {
  slug: "systeme-signature",
  title: "Le Système Signature",
  subtitle: "Transformez votre expertise en une méthode claire, désirable et vendable.",
  priceCents: 7900,
  priceLabel: "79 €",
  currency: "EUR",
  instructor: "Élise Martin",
  modules: [
    {
      id: "fondations",
      number: "I",
      title: "Clarifier votre territoire",
      eyebrow: "Fondations",
      lessons: [
        { id: "vision", title: "La vision qui attire les bons clients", duration: "12 min", format: "Vidéo", summary: "Définir le cap qui rend votre expertise immédiatement reconnaissable.", resource: "Canevas de vision" },
        { id: "audience", title: "Choisir une audience qui écoute", duration: "18 min", format: "Atelier", summary: "Identifier le problème précis que vous êtes la personne la mieux placée pour résoudre.", resource: "Fiche d'exploration" },
      ],
    },
    {
      id: "methode",
      number: "II",
      title: "Composer votre méthode",
      eyebrow: "Architecture",
      lessons: [
        { id: "promesse", title: "Écrire une promesse qui tient", duration: "16 min", format: "Vidéo", summary: "Transformer votre savoir-faire en une transformation claire et crédible.", resource: "Grille de promesse" },
        { id: "cadre", title: "Le cadre en trois mouvements", duration: "22 min", format: "Atelier", summary: "Organiser votre méthode en étapes simples à retenir et à enseigner.", resource: "Template de méthode" },
      ],
    },
    {
      id: "rayonnement",
      number: "III",
      title: "Rendre l'offre évidente",
      eyebrow: "Rayonnement",
      lessons: [
        { id: "recit", title: "Le récit qui donne envie d'entrer", duration: "14 min", format: "Vidéo", summary: "Mettre les mots justes sur le désir de changement de votre futur client.", resource: "Trame narrative" },
        { id: "lancement", title: "Votre semaine de lancement", duration: "19 min", format: "Atelier", summary: "Construire une séquence courte pour présenter votre nouvelle offre avec assurance.", resource: "Plan de lancement" },
      ],
    },
  ] satisfies CourseModule[],
} as const;

export const ALL_LESSONS = COURSE_OFFER.modules.flatMap(module => module.lessons);
export const TOTAL_LESSONS = ALL_LESSONS.length;
export const findLesson = (lessonId: string) => ALL_LESSONS.find(lesson => lesson.id === lessonId);
