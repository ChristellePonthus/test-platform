type ProtectedResource = { filename: string; content: string };

const resources: Record<string, ProtectedResource> = {
  vision: { filename: "canevas-de-vision.txt", content: `CANEVAS DE VISION — Le Système Signature\n\n1. Le changement que je rends possible :\n\n2. La personne à qui ce changement compte maintenant :\n\n3. La phrase que je veux que cette personne puisse répéter après notre travail :\n\n4. Ce que je refuse de promettre :\n\nRelisez votre réponse à voix haute : est-elle précise, désirable et crédible ?` },
  audience: { filename: "fiche-exploration.txt", content: `FICHE D'EXPLORATION — Choisir une audience\n\nDécrivez une personne réelle ou un groupe très précis.\n\n- Que veut-elle débloquer dans les 90 prochains jours ?\n- Qu'a-t-elle déjà essayé ?\n- Quel coût paie-t-elle à rester au même point ?\n- Quel mot emploie-t-elle pour décrire son problème ?\n\nTerminez par : « J'aide [personne] à [transformation] sans [obstacle]. »` },
  promesse: { filename: "grille-de-promesse.txt", content: `GRILLE DE PROMESSE — Écrire une promesse qui tient\n\nUne promesse solide contient :\n1. Une transformation observable.\n2. Un destinataire précis.\n3. Un horizon ou un contexte.\n4. Une manière de faire qui vous appartient.\n\nVersion de travail :\n« J'accompagne ______ à ______ grâce à ______, pour que ______. »\n\nSupprimez toute formule qui ne pourrait pas être vérifiée par votre client.` },
  cadre: { filename: "template-de-methode.txt", content: `TEMPLATE DE MÉTHODE — Trois mouvements\n\nMouvement 1 / Avant : quelle décision prépare le changement ?\nMouvement 2 / Pendant : quelle action produit le déplacement ?\nMouvement 3 / Après : quelle preuve rend le résultat durable ?\n\nPour chaque mouvement, nommez : l'intention, le livrable et le signe que l'étape est terminée.` },
  recit: { filename: "trame-narrative.txt", content: `TRAME NARRATIVE — Rendre l'offre évidente\n\n1. Le moment où votre futur client se reconnaît.\n2. La croyance qui le maintient immobile.\n3. Le nouvel angle que vous lui proposez.\n4. Le premier pas, suffisamment simple pour être engagé maintenant.\n\nÉcrivez ce récit comme si vous parliez à une personne, jamais à un segment abstrait.` },
  lancement: { filename: "plan-de-lancement.txt", content: `PLAN DE LANCEMENT — Une semaine de visibilité\n\nJour 1 : partagez le problème que vous avez décidé de résoudre.\nJour 2 : montrez une erreur fréquente et votre point de vue.\nJour 3 : dévoilez un morceau de votre méthode.\nJour 4 : racontez une transformation possible.\nJour 5 : présentez l'offre et son cadre.\nJour 6 : répondez aux hésitations.\nJour 7 : invitez clairement à choisir.` },
};

export function getResourceForLesson(lessonId: string) {
  return resources[lessonId] ?? null;
}
