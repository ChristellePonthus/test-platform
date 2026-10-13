# Plan — Académie Nocturne

## Produit
Plateforme française de formation en ligne permettant de présenter une formation premium, d'encaisser un achat par carte et de donner un accès sécurisé aux contenus après confirmation de paiement. Les visiteurs découvrent la proposition de valeur puis se connectent avec leur compte Manus ; les apprenants acheteurs accèdent au campus, aux leçons et à leur progression.

## Direction créative : Académie Nocturne

- **Mouvement visuel** — Éditorial de luxe contemporain : une académie confidentielle, immersive et exigeante plutôt qu'une plateforme SaaS générique.
- **Principes** — contraste profond, hiérarchie très éditoriale, rythme asymétrique et détails métalliques discrets.
- **Couleurs** — bleu nuit `#14213D` comme écrin de concentration ; or doux `#E9C46A` pour les preuves, interactions et jalons ; ivoire pour préserver la lecture longue.
- **Mise en page** — larges panneaux superposés, bandeau de preuves et cours en « ruban » de progression ; aucune mosaïque décorative uniforme.
- **Signatures** — voûtes filaires, liserés dorés, étoiles/repères de progression et monogramme A architectural.
- **Interactions & animation** — entrées calmes, soulignements dorés au survol, états de progression très lisibles ; respect de `prefers-reduced-motion`.
- **Typographie** — Cormorant Garamond pour les titres à caractère éditorial, DM Sans pour l'interface et le texte utilitaire.
- **Essence de marque** — « Une académie concentrée pour transformer une expertise en résultats visibles. » Personnalité : exigeante, confidentielle, généreuse.
- **Voix** — directe et ambitieuse : « Votre expertise mérite une méthode. » ; « Entrez dans le programme, avancez avec intention. »
- **Marque** — monogramme A formé par une voûte et une étoile dorée ; le mot-symbole *Académie Nocturne* l'accompagne.

## Comportement produit

1. **Page de vente** : promesse, programme, bénéfices, formateur, témoignages, questions et appels à l'action vers l'achat. Le prix initial et les contenus éditoriaux sont clairement centralisés pour un remplacement ultérieur.
2. **Comptes** : connexion, déconnexion et identité via Manus OAuth. L'application gère une session validée, sans compte fictif. La récupération du compte est renvoyée à la gestion sécurisée du compte Manus, le fournisseur d'identité retenu.
3. **Paiement** : Stripe Checkout est créé côté serveur pour l'apprenant connecté. Les webhooks vérifiés et idempotents créent le droit d'accès ; le retour de Stripe n'accorde jamais l'accès seul.
4. **Espace membre** : routes protégées avec garde d'accès. Les personnes non acheteuses voient une invitation à rejoindre le programme ; les apprenants voient modules, leçons, ressources et l'historique d'achat.
5. **Progression** : chaque leçon peut être marquée terminée, sa progression est persistée et le parcours reprend à la prochaine leçon.
6. **Responsive** : navigation, hero, programme et campus s'adaptent aux écrans mobile, tablette et bureau.

## Architecture

| Dossier / module | Responsabilité |
| --- | --- |
| `client/src/pages` | Page de vente, connexion, campus membre, commande et leçon ; routes Wouter. |
| `client/src/components` | Navigation, bloc de cours, jauges et primitives d'interface réutilisables. |
| `server/routers.ts` | API tRPC pour l'offre, le statut membre et la progression. |
| `server/stripe.ts` | Création Checkout, prix centralisé et validation de webhooks Stripe. |
| `server/_core/index.ts` | Route HTTP raw-body `/api/stripe/webhook` avant le parseur JSON. |
| `drizzle/schema.ts` | Droits d'accès, achats, événements Stripe et progrès par leçon. |
| `drizzle/` | Migrations versionnées et additives de la base MySQL. |
| `client/public` | Visuel héroïque, manifeste de routes et ressources publiques. |

## Contraintes techniques

- React + Express + tRPC + Drizzle, base MySQL managée et OAuth Manus du starter.
- Stripe managé par la plateforme : clés et webhook sont déclarés par l'intégration, sans collecte ni stockage de données carte.
- Les achats et événements Stripe sont sauvegardés de façon minimale : identifiants de session, paiement et événement traité ; aucun payload brut Stripe ou détail carte n'est stocké.
- L'achat nécessite un compte connecté afin de lier sans ambiguïté l'accès à l'apprenant.
