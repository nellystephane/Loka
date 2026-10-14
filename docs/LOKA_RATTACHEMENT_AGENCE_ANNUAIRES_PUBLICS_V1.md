# Loka — Rattachement agence et annuaires publics (V1)

## Règles métier renforcées

- Le rattachement n'est autorisé que pour une agence active et un profil livreur actif dont le compte utilisateur est actif.
- Un livreur déjà rattaché à cette agence ne peut pas être ajouté une seconde fois.
- Un livreur qui porte une mission active (`assignée`, `en_cours`, `en_route`, `arrivée`) ne peut pas être rattaché tant que la mission n'est pas clôturée.
- Les deux côtés de la relation sont maintenus : `AgenceLivraison.livreurs` et `Livreur.agences`. Les mises à jour utilisent `$addToSet`; si la seconde mise à jour échoue, la première est annulée.
- L'affectation de mission vérifie aussi que l'agence et le profil livreur sont actifs et refuse un livreur déjà engagé.
- Les profils publics de livreurs suspendus ou associés à un compte suspendu ne sont pas servis.
- Le modèle permet toujours le rattachement d'un même livreur à plusieurs agences, conformément au tableau `Livreur.agences`; la disponibilité et les missions restent contrôlées au moment de l'affectation.

## Pages publiques ajoutées

- `/boutiques` : annuaire des boutiques, filtres de recherche et ville, cartes cohérentes avec le design system.
- `/restaurants` : annuaire des restaurants.
- `/hotels` : annuaire des hôtels.
- `/livreurs` : annuaire combiné présentant séparément les agences et les livreurs indépendants.
- `/livreur/:id` : profil public du livreur avec disponibilité, zone, transport, tarif indicatif, notation et contact lorsque le téléphone public est renseigné.
- L'accueil fournit des liens directs vers ces quatre annuaires.

## API

- `GET /api/agences-livraison/public` : liste publique paginée des agences actives, avec filtres ville/recherche.
- `POST /api/agences-livraison/moi/livreurs` : rattachement avec validations métier renforcées.
- `GET /api/agences-livraison/moi/livreurs/candidats` : candidats actifs et non déjà rattachés à l'agence connectée.

## Validation réalisée

- `node --check` sur les contrôleurs et routes modifiés.
- Transpilation syntaxique TypeScript/JSX des pages modifiées.
- Tests backend : 23/23 passés.
- Le build Vite/TypeScript complet n'a pas pu être exécuté dans cet environnement, car les dépendances frontend (`react`, `lucide-react` et types associés) ne sont pas installées. Une compilation complète reste donc à lancer dans l'environnement de développement du projet.
