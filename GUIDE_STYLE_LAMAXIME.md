# Guide De Code de Lamaxime

Ce document formalise les conventions observées dans `vue/` et `backend/`, complétées par les intentions explicites du projet. L'objectif est simple : permettre à n'importe quel développeur de produire du code qui ressemble au tien, dans la structure, dans le fond, dans le niveau d'exigence SEO, et dans la manière de découper les responsabilités.

## 1. Philosophie générale

- Chaque fichier doit avoir une responsabilité claire.
- Le code doit rester lisible sans effort : noms explicites, structure prévisible, imports propres, composants courts quand c'est possible.
- Le frontend ne doit pas seulement "fonctionner" : il doit vendre, rassurer, respirer, et servir le branding.
- Le backend ne doit pas exposer brutalement les données : il les valide, les sécurise, les transforme et les renvoie dans un format propre à consommer.
- Le projet privilégie la modularité, le mobile-first, l'accessibilité utile, le SEO fort, et un copywriting aligné avec le positionnement.

## 2. Arborescence attendue

### Frontend `vue/src`

- Les pages React sont dans `vue/src/pages`.
- Les composants réutilisables ou sections de pages sont dans `vue/src/components`.
- Les styles sont tous centralisés dans `vue/src/assets/styles`.
- Les images et assets médias sont dans `vue/src/assets/images` ou dans un sous-dossier dédié.
- Les données, constantes, helpers métier, textes, routes et appels d'API sont regroupés dans `vue/src/services`.

### Backend `backend/app`

- Les contrôleurs API sont dans `backend/app/Http/Controllers/Api`.
- Les middlewares sont dans `backend/app/Http/Middleware`.
- Les modèles sont dans `backend/app/Models`.
- Les helpers techniques transverses sont dans `backend/app/Support`.
- Les routes API sont centralisées dans `backend/routes/api.php`.

## 3. Règles de nommage des fichiers

- Un composant React correspond à un fichier `.jsx`.
- Une page React correspond à un fichier `.jsx`.
- Chaque page `.jsx` possède son fichier CSS dédié dans `vue/src/assets/styles/pages`.
- Chaque composant `.jsx` possède son fichier CSS dédié dans `vue/src/assets/styles/components/...`.
- Le nom du fichier CSS doit exactement le nom du fichier JSX autant que possible.
- Les fichiers de logique métier sont en `.js`, pas dans les `.jsx`.

### Important

- Dans l'état actuel du projet, la logique réutilisable vit surtout dans `vue/src/services/`.
- Si une logique est pure, réutilisable, métier, SEO, navigation, session, appel API, mapping ou génération de lien, elle doit aller dans `services/`.
- Le JSX doit rester orienté rendu, orchestration d'état local, et branchement UI.

## 4. Organisation interne d'un fichier JSX

L'ordre implicite qui ressort du projet est le suivant :

1. Imports React et librairies.
2. Imports des composants enfants.
3. Imports des services, constantes, routes ou helpers.
4. Import du fichier CSS.
5. Déclaration du composant.
6. Export `default`.

Exemples observés :

- Les pages importent d'abord leurs sections, puis leur CSS.
- Les composants importent leur contenu métier depuis `services/` puis leur CSS dédié.
- Le CSS est toujours importé directement dans le composant ou la page qui l'utilise.

## 5. Règles JSX et HTML

- Toute page doit avoir une racine claire, souvent un `<main>`.
- Toute section importante doit être structurée avec des balises sémantiques : `main`, `section`, `article`, `aside`, `header`, `nav`, `footer`.
- Chaque élément important doit recevoir un `className`.
- En pratique, tu cherches à rendre stylable chaque bloc significatif du DOM.
- Même les wrappers intermédiaires reçoivent souvent une classe dédiée.
- Les classes servent autant à designer qu'à documenter la structure visuelle.
- Les éléments d'interface doivent rester explicites : CTA, shells, grids, cards, headings, copy, meta, actions.

### Règle forte sur les `className`

- Ne laisse pas un élément HTML structurel sans `className` si ce n'est pas volontaire.
- Si un élément peut nécessiter un style aujourd'hui ou demain, donne-lui une classe.
- Les noms de classes doivent refléter le composant parent.
- On évite les classes trop génériques du type `box`, `wrapper`, `item` seules.
- On préfère des classes contextualisées comme `aboutHero-title`, `serviceDomains-card`, `blogArticle-meta`.

### Convention de nommage CSS

- La classe racine reprend le nom du composant et se termine souvent par `-root`.
- Les sous-parties suivent un nommage hiérarchique lisible `nomDuComposant-sousElement`.
- Les variantes utilisent souvent le suffixe `--modifier`.
- Les sous-éléments très liés utilisent parfois `__element`.

Exemples déjà présents :

- `aboutHero-root`
- `blogArticle-ctaCard__eyebrow`
- `navBar-panel--open`
- `app-button--primary`

## 6. CSS : manière de structurer le design

- Les styles globaux sont centralisés dans `index.css` et `App.css`.
- Les variables de design sont définies dans `:root`.
- Les couleurs, rayons, espacements, largeurs de shell, ombres et typographies passent par des variables CSS.
- Les composants consomment ces variables au lieu de dupliquer des valeurs arbitraires.
- Le CSS doit rester modulaire : un fichier CSS par page ou composant.
- Les styles partagés réels peuvent être consolidés dans `App.css` quand ils sont transverses.

### Mobile-first

- Les styles de base sont écrits pour mobile.
- Les adaptations desktop arrivent ensuite avec des `@media (min-width: ...)`.
- Pour le responsive, tu vas mettre les media-queries pour toutes les tailles
    - Mobiles & Smartwatches: @media (max-width: 480px)
    - Tablettes: @media (min-width: 769px) and (max-width: 1024px)
    - Ordinateurs portables: @media (min-width: 1025px) and (max-width: 1200px)
    - Desktops, Écrans plats & Téléviseurs: @media (min-width: 1201px)
- Les largeurs sont fluides, souvent avec `width: min(...)`.
- La typographie utilise `clamp(...)` pour rester souple.

## 7. SEO : niveau d'exigence attendu

Le SEO est une discipline de base du projet, pas un ajout secondaire.

- Les métadonnées de base sont présentes dès `vue/index.html`.
- Le SEO dynamique est centralisé dans `vue/src/services/seo.js`.
- Les routes ont une définition SEO dédiée.
- Les pages publiques importantes doivent être indexables si c'est pertinent.
- Les pages sensibles comme l'admin sont en `noindex,nofollow`.
- Les pages d'article ont une gestion spécifique.
- Le canonical est défini.
- Les métadonnées Open Graph sont définies.
- Les métadonnées Twitter sont définies.
- Les données structurées JSON-LD sont générées.
- Les FAQ peuvent être injectées dans le schéma si la page en possède.
- Le sitemap s'appuie sur les routes SEO et les articles.

### Conséquences pratiques

- Toute nouvelle page doit avoir son titre, sa description, ses règles robots, son URL canonique et, si pertinent, son schéma.
- Toute nouvelle page stratégique doit être pensée SEO avant d'être pensée visuellement.
- Les contenus, `alt`, headings, liens internes et wording doivent servir le référencement.
- Les accents et caractères spéciaux doivent être utilisés dans le contenu visible pour respecter la langue française, même si certaines chaînes SEO techniques existantes sont encore sans accents.

## 8. Gestion du contenu et du copywriting

- Le texte métier n'est pas dispersé au hasard dans l'UI quand il peut être centralisé.
- Beaucoup de contenus éditoriaux sont stockés dans des fichiers `services/*.js`.
- Les composants lisent des objets, tableaux ou helpers qui contiennent le contenu.
- Cette séparation permet de réécrire le fond sans casser le rendu.

## 9. Gestion des routes et de la navigation

- On évite d'écrire les chemins en dur partout dans les composants.
- Les items de navigation et de footer sont pilotés par des constantes.
- La navigation React utilise `react-router-dom`.
- Les comportements globaux liés à la route, comme scroll top et SEO, sont gérés au niveau de `App.jsx`.

## 10. Emplacement de la logique JavaScript

- La logique réutilisable ne doit pas être enfouie dans les composants.
- Les composants ne doivent pas devenir des fourre-tout métier.
- Les helpers de liens, de session, de SEO, de transformation de données, de draft admin ou d'appel API vont dans des `.js` dédiés.
- Le `.jsx` orchestre l'affichage et les interactions d'écran.
- La logique métier commune vit dans `services/`.
- La logique technique backend commune vit dans `backend/app/Support`.

## 11. Appels API

- Les appels API ne se font pas directement partout dans les composants.
- Ils sont encapsulés dans des services dédiés.
- Une couche d'abstraction unique gère `fetch`, les headers, le token, les erreurs et le parsing.
- Les réponses sont normalisées avant usage.
- Les erreurs remontent avec un message exploitable.
- Le token admin est injecté automatiquement si disponible.
- Le `401` déclenche un nettoyage de session côté front.
- Les uploads ont une voie dédiée avec gestion `FormData`.

### Règle de style

- Toute nouvelle famille d'appels backend doit avoir son fichier de service.
- On sépare l'appel réseau brut de la logique d'interface.
- On préfère des fonctions nommées clairement : `getBlog`, `getBlogs`, `loginAdmin`, `uploadAdminImage`.

## 12. Gestion des états côté frontend

- L'état local de page reste dans la page ou dans le composant orchestrateur.
- Les composants enfants reçoivent des données et callbacks explicites.
- Les effets globaux sont centralisés et ciblés.
- Les flux sensibles, comme l'admin, sont défensifs : restauration de session, verrouillage, notices, états de chargement, erreurs utilisateur.
- Les formulaires suivent des handlers dédiés et des retours utilisateur clairs.

## 13. Accessibilité et qualité HTML

- Les images ont un `alt`.
- Les boutons ont un `type`.
- Les zones de navigation ont un `aria-label` si nécessaire.
- Les toggles exposent `aria-expanded` et `aria-controls`.
- Les contenus purement visuels peuvent recevoir `aria-hidden`.
- La classe utilitaire `sr-only` existe pour le texte accessible non visible.

## 14. Règles backend

- Les routes API sont déclarées explicitement dans `backend/routes/api.php`.
- Les endpoints publics sont séparés des endpoints protégés.
- Les middlewares protègent les zones sensibles.
- Les validations de requête sont faites côté contrôleur.
- Les réponses JSON restent explicites.
- Les erreurs attendues renvoient des codes HTTP cohérents.
- Les données dates/heures sont normalisées en UTC via `UtcDateTime`.
- Les réponses publiques sont transformées avant exposition.
- Les modèles définissent leurs relations et leurs champs modifiables.

### Style backend attendu

- Ne pas exposer directement des structures brutes si une transformation métier est nécessaire.
- Vérifier les droits avant modification ou suppression.
- Regrouper les utilitaires transverses dans `Support`.
- Séparer la logique publique de la logique admin/protégée.
- Renvoyer des messages compréhensibles côté client.

## 15. Modularité

La modularité est une règle cardinale.

- Une page assemble des sections.
- Une section peut devenir un composant.
- Un composant ne doit pas absorber des responsabilités voisines si elles peuvent être séparées proprement.
- Un CSS ne doit pas piloter plusieurs composants sans raison claire.
- Une logique réutilisable doit sortir du JSX.
- Une source de vérité unique doit exister pour les routes, SEO, contenus structurés et helpers communs.

## 16. Règles de contenu et de langue

- Respecter la langue avec ses accents et caractères spéciaux dans les textes affichés à l'utilisateur.

## 17. Icônes, emojis et éléments visuels

- La préférence cible est de ne pas utiliser d'emojis dans l'interface.
- Quand un pictogramme est utile, mieux vaut utiliser un système d'icônes cohérent, par exemple Font Awesome.

## 18. Imports

- Les imports doivent rester groupés par rôle.
- On évite le désordre dans les imports.
- On importe les routes et helpers depuis leur source centrale plutôt que de recopier les valeurs.
- Le CSS dédié du composant est importé directement dans le composant.
- Les assets sont importés explicitement avec des noms lisibles.

## 19. Workflow recommandé pour ajouter une nouvelle page

1. Créer la page dans `vue/src/pages`.
2. Créer son CSS dédié dans `vue/src/assets/styles/pages`.
3. Déclarer ou réutiliser les composants de section dans `vue/src/components/<famille>`.
4. Créer le CSS de chaque section dans `vue/src/assets/styles/components/<famille>`.
5. Centraliser le contenu, les constantes et helpers dans `vue/src/services`.
6. Ajouter les règles SEO dans `services/seo.js`.
7. Vérifier mobile-first, accessibilité, `alt`, `aria`, maillage interne et CTA.

## 20. Workflow recommandé pour ajouter une nouvelle logique métier

1. Si la logique est réutilisable, créer un `.js` dédié dans `vue/src/services`.
2. Nommer la fonction selon son intention métier.
3. Garder le composant JSX centré sur le rendu.
4. Ajouter le CSS dédié uniquement si la logique s'accompagne d'une nouvelle UI.
5. Si la logique touche au SEO, l'intégrer dans `services/seo.js` ou dans une structure cohérente avec lui.

## 21. Workflow recommandé pour une nouvelle API backend

1. Déclarer la route dans `backend/routes/api.php`.
2. Créer ou compléter le contrôleur API dédié.
3. Ajouter la validation des entrées.
4. Vérifier les droits d'accès si l'endpoint est protégé.
5. Normaliser la réponse JSON.
6. Gérer les dates en UTC si concerné.
7. Créer ensuite le service frontend qui encapsule l'appel.

## 22. Checklist avant de considérer un écran comme terminé

- Le fichier est au bon endroit.
- Le CSS dédié existe au bon endroit.
- Les classes sont suffisamment nombreuses pour styler proprement chaque élément.
- La structure HTML est sémantique.
- La page est responsive en mobile-first.
- Le contenu est correct dans la langue concernée.
- Les `alt`, `aria`, boutons et liens sont propres.
- Les routes ne sont pas dupliquées en dur.
- Le SEO est traité.
- La logique réutilisable n'est pas enfouie dans le JSX.
- Les appels API sont encapsulés.
- Le code reste modulaire.