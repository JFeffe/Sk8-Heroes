# Sk8 Heroes — Lagoon Park

Prototype solo v0.1 d'un jeu de cartes et de dés de skateboard. Interface française, sans compte, avec sauvegarde automatique locale.

## Jouer

Le workflow `Test and deploy Sk8 Heroes` teste puis publie le dossier `public/` sur GitHub Pages à chaque push sur `main`.

Pour jouer localement : `python3 -m http.server 8000 --directory public`, puis ouvrir `http://localhost:8000` (ne pas ouvrir index.html en file://, car les modules JavaScript nécessitent HTTP).

## Parcours solo

- Menu de création : nom, partie complète de 6 modules ou rapide de 4.
- Repêchage initial de 6 cartes : 2 Kick, 2 Slide et 2 Air accessibles.
- Collection physique de 72 cartes, 24 figures, exemplaires distincts.
- Choisir 1 à 3 tricks en respectant les catégories du module avant de lancer 6d6.
- Cliquer les dés puis le trick pour attribuer leurs valeurs, ou utiliser Répartir.
- Chaque dé ne sert qu'une fois. La somme attribuée doit atteindre la difficulté de chaque carte.
- Un +2 et une relance d'un dé maximum par essai ; conserver le nouveau résultat. Le modificateur +2 reste sur le dé relancé.
- Tous les tricks et le minimum de points doivent réussir, sinon l'essai vaut zéro et toutes les cartes reviennent en main.
- Les cartes réussies sont bloquées jusqu'à la fin du module. Deux essais, meilleur score conservé.
- Combo de 2 cartes : +2 points. Combo de 3 cartes : +6 points.
- Le 1080° demande 26 et rapporte 32 points, se joue seul.
- En solo, réussir au moins un essai rapporte les PV du module (pas de classement adverse).
- Récompense après deux essais ; échec des deux : bonus de récupération au choix. Effets gagnant un bonus différés jusqu'à la fin du module, plafonnés à un de chaque type par module.
- Réserve limitée à 3 bonus. Si elle est pleine, le bonus supplémentaire n'est pas conservé ; l'écran l'indique pour la récompense du module.
- Une amélioration par exemplaire de carte : −1 difficulté, permanent.
- Entre les modules : choisir une carte parmi trois, puis récupérer les cartes posées. La main grandit.
- Pas de récompense ni repêchage après la finale. Bilan exportable en JSON.

Les 12 modules sont dans `public/data.js`. Le parcours est visible dès le début. Partie complète : 2 Découverte, 3 Enchaînement, 1 Finale. Partie rapide : 1 + 2 + 1.

## Statut du prototype

Les règles numériques sont dans les données et sont rendues en HTML. Les illustrations Lagoon Park sont des concepts générés pendant la conception ; les zones d'image des planches sont cadrées en CSS. Certaines techniques (Lipslide, Bluntslide, Crooked Grind notamment) restent à corriger avant une édition définitive. Les 12 modules réutilisent pour le moment 4 illustrations de validation.

Les points et quantités sont des valeurs de test. Les difficultés Kick/Slide couvrent 5 à 10. Les Air : 6/10/14/18/22/26. Le repêchage initial des Air offre deux figures accessibles, 180° et 360°, avec doublons autorisés.

La v0.1 ne simule pas encore de concurrents et n'implémente pas le classement de repêchage multijoueur. Le solo adapte le repêchage en choix parmi 3. Pas de serveur, de compte ni de collecte des parties. La sauvegarde reste dans le navigateur, par origine.

## Développement et tests

Node.js 22 recommandé. Aucune dépendance à installer.

```
npm test
node --check public/app.js
```

- `public/engine.js` : règles sans DOM, transitions et répartition des dés.
- `public/data.js` : 24 tricks, 72 exemplaires, 12 modules.
- `public/app.js` et `style.css` : interface et sauvegarde.
- `tests/engine.test.js` : tests de règles et parcours complet.

Les polices Google Fonts ont des polices de repli locales. Tous les visuels sont inclus dans le dépôt. Les décisions de gameplay et l'historique de version sont décrits ici et dans `CHANGELOG.md`.
