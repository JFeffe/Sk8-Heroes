# Sk8 Heroes — Le Lagon

Prototype français de jeu de skate : jusqu’à quatre joueurs, humains et NPC, 41 tricks différents, une pioche commune de 85 cartes et six dés par essai. La partie se joue sur six modules du skatepark **Le Lagon**. Le mode en ligne est hébergé et sauvegardé sur l’ordinateur de l’hôte.

## Jouer

[Jouer à la version publiée](https://jfeffe.github.io/Sk8-Heroes/) · [Bilan de la réserve de Sol](https://jfeffe.github.io/Sk8-Heroes/reports/specialty-balance-063.html)

```sh
npm start
```

Ouvrir http://localhost:8000, choisir **Nouvelle session**, le nombre de NPC (trois par défaut) et un des six skaters. Les NPC choisissent au hasard parmi les skaters restants. Node.js 22 suffit, sans installation de dépendances. Les modules JavaScript nécessitent HTTP.

Sous Windows, un double-clic sur **Lancer Sk8 Heroes.cmd** démarre le serveur en arrière-plan et ouvre le jeu. Si le serveur de cette copie et de cette version fonctionne déjà, il est réutilisé. Si le port habituel est occupé par un autre programme ou une ancienne version, le lanceur choisit un port libre entre 8000 et 8009.

## Jouer à distance sur Internet

Sous Windows, double-cliquer sur **Lancer le multijoueur.cmd** : le partage Internet est préparé si nécessaire, puis le navigateur ouvre directement la création du salon. Choisir Base ou Avancé, créer le salon, puis **Activer le lien Internet** et **Copier le lien**. Les amis ouvrent cette invitation sans installation. Le site GitHub Pages propose aussi le bouton **Multijoueur entre amis** avec ces instructions.

Sur l’ordinateur de l’hôte, installer une première fois l’outil officiel de partage puis lancer le serveur :

```sh
npm run install:share
npm start
```

1. Ouvrir http://127.0.0.1:8000 et choisir **Créer une partie en ligne**. Choisir son nom et une à trois places adversaires ; le lobby est créé avant le choix du rider.
2. Dans le salon, cliquer **Activer le lien Internet**, puis **Copier le lien** et l’envoyer aux amis. Le lien est aussi disponible dans le salon pendant la partie.
3. Chaque invité ouvre le lien et choisit son nom. Avant le départ, une place libre lui est attribuée ; tous les humains choisissent simultanément leur rider parmi les six dans le lobby. La couleur vient du rider. Chaque choix est réservé par le serveur et se verrouille chez les autres ; changer libère le précédent. En cours de partie, rejoindre un NPC conserve son skater, sa main, ses jetons et ses points.
4. Quand chaque humain a choisi son rider, l’hôte clique **Commencer la partie**. Tous jouent avec les mêmes règles ; les NPC occupent les places restantes. L’hôte lance les modules et passe les bilans. Les invités ne contrôlent que leur siège.

Le serveur et l’ordinateur de l’hôte doivent rester allumés. Le partage utilise un [Quick Tunnel Cloudflare](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) : adresse temporaire, sans compte ni domaine, destinée aux essais, sans garantie de disponibilité. Le bouton **Arrêter le lien Internet** coupe ce partage. Pour une adresse stable en production, utiliser un tunnel nommé et un hébergement suivi.

L’hôte sauvegarde automatiquement chaque action acceptée dans `.local-games/`, avant de l’accuser réception. Le menu **Reprendre en ligne** restaure son salon. Les invités retrouvent leur place en rechargeant le lien dans le même navigateur. Le salon fournit aussi un **code personnel de reprise** : si l’adresse Internet change, ouvrir la nouvelle invitation puis **J’ai déjà une place dans cette partie**, et saisir ce code. Il reste privé et ne fait pas partie du lien d’invitation commun.

Les fichiers de parties et `.tools/` sont exclus de Git. L’outil de partage est téléchargé depuis les versions officielles Cloudflare ; sous Windows, sa signature est vérifiée. Les invités n’installent rien. GitHub Pages conserve le mode local ; héberger une partie en ligne demande le serveur Node sur l’ordinateur de l’hôte.

## Table et cartes

La carte skater se trouve à gauche et le module à droite. Le repère **TOI** identifie ta table ; **TABLE DE** indique une table adverse. Les textes des cartes associent les composants à leurs icônes. Nosegrind exige **exactement 2 valeurs d’écart** (1–3, 2–4, 3–5 ou 4–6).

Survoler une carte (ou la sélectionner au clavier) affiche un grand aperçu toujours à droite, dans un espace réservé qui ne recouvre ni les actions ni la main. Cela couvre les tricks en main, joués et archivés, les drafts et la collection, ainsi que les modules, la carte skater et le parc. L’aperçu fonctionne aussi hors de son tour et se rafraîchit en multijoueur sans déplacer la souris. Il est uniquement visuel : le clic et le glisser-déposer continuent d’agir sur la carte d’origine.

En mode Avancé, les choix de spécialité apparaissent directement sous les boutons d’action, avec les icônes des composants concernés. Le jeton de spécialité ramène à cette zone ; aucun popup ne masque la table. La carte du module en cours est agrandie et conserve sa taille pendant le deuxième essai. Sur ordinateur, la table et la main partagent la hauteur de l’écran pour rester visibles sans défilement. Les spécialités utilisent une rangée compacte, avec les échanges de Troc représentés par leurs jetons.

- Au menu, **Voir les cartes** ouvre la collection : choisir **Tricks** ou **Skateparks**, puis un paquet. **Tricks du Lagon** présente les 41 figures complètes, dans l’ordre Kick / Slide / Air, avec leurs exemplaires et l’accès aux probabilités détaillées. **Le Lagon** présente ses 12 modules. Chaque carte peut être agrandie au clic ; les boutons et le fil de navigation permettent de changer de paquet ou de revenir au menu. Le bouton **Cartes** en partie ouvre la même collection et permet de revenir à la table.
- Main en éventail, agrandissement au survol et au clavier, carte déposée sur la table avant chaque jet.
- Les dés déposés sur une carte se rangent dans les cases compatibles. Le clic reste une alternative au glisser-déposer. Après le lancer, la carte reste engagée. « Reprendre les dés », à côté d’Auto, remet uniquement les dés non confirmés dans la réserve : faces, gel, tricks validés et jetons dépensés sont conservés. Le glisser-déposer permet aussi de reprendre un dé isolé avant validation.
- Chaque trick assemble trois couches au format 900 × 1300 : une illustration seule, un cadre graphique partagé et les textes/symboles. Les sources modifiables et les cartes assemblées sont dans `artwork/cards/tricks/deck-v1/`, les ressources Web dans `public/assets/tricks/`. La couche de textes transparente est exportée à 1800 × 2600 pour garder les lettres et symboles nets lors des agrandissements. Les dés utilisent les mêmes coordonnées que les cases du cadre. Les anciennes planches restent comme références.
- Les 12 modules utilisent aussi ces trois couches et le même canevas, avec les illustrations approuvées du Lagon. Les sources SVG et cartes assemblées sont dans `artwork/cards/modules/le-lagon-v1/`, les couches Web dans `public/assets/modules/lagoon/layers/`. Les textes et symboles transparents sont exportés à 1800 × 2600 ; les titres et PV suivent les mêmes repères que les tricks. Table, parcours, collection et aperçus utilisent le même assemblage. Les douze effets simples validés sont imprimés et utilisés par le moteur, les scores en direct et les NPC. Coping Bleu porte Grande amplitude et Double Quai porte Zone de récupération.
- Score de séquence validé, bonus et total possible avec la carte en cours affichés en temps réel sur la table ; le troisième emplacement annonce son +1. Scores de partie, meilleur score de manche et résultats E1/E2 de tous les joueurs affichés au-dessus de la table. L’astérisque désigne l’essai en cours. Le joueur actif est signalé en rouge contrasté avec « À TOI » ou « EN JEU » ; la couleur du skater reste visible dans son avatar.
- Les six modules sont tirés dès le début, sans doublon et partagés par tous : deux parmi les quatre de manches 1–2, deux parmi les quatre de manches 3–4 et deux parmi les quatre finales de manches 5–6. Les six cartes restent visibles pendant le draft, le jeu et les bilans. Survol ou focus clavier : aperçu agrandi ; clic : carte complète avec explication. Les illustrations des finales couvrent plusieurs obstacles et une plus grande portion du park.
- Trois piles de jetons : dorés ±1, turquoise ↻ et bleus ❄. Le compteur indique le stock exact ; jusqu’à cinq couches sont dessinées pour garder la table lisible.

La main est toujours triée Kick → Slide → Air. Pendant les drafts et leurs récapitulatifs, toutes les cartes de la main sont affichées au complet, sans chevauchement, et s’agrandissent au survol ou au clavier. Les cartes d’un type actuellement interdit sont grisées ; une tentative de sélection produit une courte animation.

Pendant les essais, la vue suit le joueur actif. Cliquer un joueur épingle sa main, sa table et ses jetons, même si les tours avancent ou que les NPC reprennent. **Retour au suivi auto** rétablit le suivi ; **Ma table** revient à son propre siège. Les actions restent réservées à sa table et à son tour. Les cartes des essais conservés sont disposées côte à côte avec leurs dés d’origine, sans barre de défilement ; la séquence encore au centre n’est pas dupliquée dans l’archive.

Cliquer une carte engagée, réussie ou conservée l’agrandit avec ses informations et ses dés. Les cartes conservées montrent leurs dés d’origine, même pendant l’essai suivant. L’affichage agrandi reste stable si la partie avance en ligne. **Fermer**, Échap ou cliquer autour de la fenêtre revient à la table. Le clavier fonctionne aussi avec Entrée ou Espace sur la carte. Lorsque des dés sont sélectionnés pour être déposés, cliquer la carte active continue à les placer.

## Skaters et dés

Néo (bleu), Ruby (rouge), Jade (vert), Sol (jaune), Milo (orange) et Iris (mauve) ont chacun une tenue et un portrait, dans `public/assets/skaters/`. Un skater et une couleur sont uniques dans chaque partie. Les portraits et couleurs suivent les scores, le draft et le classement. Les consignes de génération sont dans `artwork/skaters-generation.json`.

Chaque réserve contient un dé de chacune des six couleurs. Le dé du skater actif est toujours affiché à droite des autres, pour le joueur humain et les NPC ; les autres dés gardent leur ordre. Le 1 est affiché ★. L’étoile du dé de sa propre couleur peut représenter 1 à 6 ; toutes les autres étoiles restent des 1. Auto et le placement manuel choisissent une valeur compatible avec la combinaison, affichée à côté de l’étoile. La face physique reste ★ : le −1 permet donc de passer de 2 à ★, et le +1 de ★ à 2. Les dés gelés et archivés conservent leur couleur ; une étoile validée conserve aussi sa valeur attribuée. Les chances affichées incluent le joker seulement si le dé du joueur est encore disponible ; le catalogue compare les chances avec et sans ce dé.

## Un essai

1. Engager une carte compatible avec au moins un symbole du module ; elle peut être remplacée tant que les dés ne sont pas lancés. Sur un module à deux types, les deux premiers tricks doivent couvrir ces deux types : le deuxième doit être du type manquant. Le troisième est libre. Sur les modules à un ou trois types, les cartes suivantes restent libres.
2. Lancer tous les dés disponibles, placer la combinaison, puis valider. Les dés validés sont bloqués jusqu’à la fin de cet essai.
3. Arrêter conserve les points seulement si les deux types imposés ont été réussis. Une chute volontaire reste possible après le premier. Sans carte jouable du type requis (y compris faute de dés), l’essai chute et vaut zéro. Continuer oblige à choisir une nouvelle carte puis à relancer tous les dés restants.
4. Une chute annule tout l’essai, bonus de score compris. Trois tricks maximum ; réussir les trois ajoute normalement +1 point de séquence et donne un jeton au choix parmi ±1, ↻ et ❄. Belle sortie remplace le +1 par +2 ; Session généreuse remplace le jeton par deux jetons. Tous les choix sont obligatoires avant le passage automatique au joueur suivant, et les jetons sont immédiatement disponibles. Aucune somme des valeurs des dés.
5. Les cartes d’une séquence conservée restent en petit sur la table avec une copie de leurs dés. Elles sont indisponibles au deuxième essai et reviennent au module suivant. Les six dés de jeu sont renouvelés entre les essais.

Les demandes ≥ et ≤ s’appliquent à chaque dé. Les scores vont de 2 à 18 points, selon la difficulté à six dés et le coût des dés immobilisés. Les tricks à trois ou quatre dés incluent un supplément de +2 dans leur score imprimé. Chaque module a un effet simple de score ou de jetons. Les effets de points comptent dès le premier trick et sont perdus en cas de chute. Les étoiles des bonus sont physiques, même pour le joker personnel. Les chances imprimées sont celles de six dés ordinaires ; sur la table, elles suivent les dés disponibles, les gels et le joker personnel.

Les effets actuels sont définis dans `public/module-catalog.js`. Chaque essai est indépendant et il n’y a plus de minimum général de deux tricks. Les récompenses des cartes de tricks restent reçues en fin de module.

| Module | Manches | Départ | PV | Effet |
|---|---|---|---:|---|
| L’Îlot | 1, 2 | kick | 2 | Chaque carte Base rapporte +1 point. |
| Le Quai bas | 1, 2 | slide | 2 | Chaque Kick rapporte +1 point. |
| La Petite Vague | 1, 2 | air | 2 | Chaque Slide rapporte +1 point. |
| Le Rail des Palmiers | 1, 2 | Libre | 2 | Utiliser son dé personnel rapporte +2 points, une fois par essai. |
| Le Retour du Rail | 3, 4 | slide + kick | 3 | Chaque Air rapporte +1 point. |
| Le Tour de l’Îlot | 3, 4 | air + kick | 3 | Chaque étoile physique utilisée rapporte +1 point. |
| Le Coping Bleu | 5, 6 | air + slide | 4 | Chaque trick utilisant 3 ou 4 dés rapporte +2 points. |
| Le Double Quai | 3, 4 | slide | 3 | Encaisser exactement deux tricks donne un jeton au choix. |
| La Boucle du Lagon | 5, 6 | Libre | 4 | Le bonus de trois tricks réussis vaut +2 points au lieu de +1 ; le jeton habituel est conservé. |
| Les Marches des Palmiers | 5, 6 | kick + slide | 4 | Le bonus de trois tricks réussis vaut +2 points au lieu de +1 ; le jeton habituel est conservé. |
| Les Embruns | 3, 4 | Libre | 3 | Trois tricks réussis donnent deux jetons au choix au lieu d’un ; le bonus habituel de +1 point est conservé. |
| La Grande Vague | 5, 6 | air | 4 | Chaque trick utilisant 3 ou 4 dés rapporte +2 points. |

## Joueurs et victoire

Chaque joueur choisit simultanément une carte parmi trois au départ. Le premier paquet de chaque type contient deux Base et une Avancée. Les deux cartes restantes passent à droite ; chacun reçoit celles de gauche et ajoute une Avancée du même type. Le choix reste libre. Deux choix Kick, deux Slide puis deux Air donnent six cartes. Les choix sont révélés après confirmation de tous. Aucun jeton ni option de passer au draft initial. Les cartes physiques viennent de la même pioche et ne sont jamais dupliquées. L’ordre complet est tiré au hasard au départ. Tous les joueurs font leur premier essai, puis leur deuxième. Après le draft entre modules, le premier joueur passe dernier. Les tours des NPC sont visibles ; **Pause NPC** et **Accélérer** contrôlent leur présentation.

Après chaque module, un tableau classe les joueurs par leur **meilleur essai complet** et montre les deux résultats en barres. Le meilleur score rapporte 2 PV en découverte, 3 en enchaînement et 4 en finale. Le deuxième score distinct rapporte 1 PV sur tous les modules. Chaque ex æquo reçoit la totalité des PV de sa place. Un score de zéro ne rapporte aucun PV. Le compteur monte pour chaque joueur qui gagne des PV.

Les PV se cumulent pour le classement final. Entre les modules, on propose une carte du niveau actif et un jeton par joueur (4 cartes et 4 jetons à quatre joueurs). Après le module 1 : Base ; après 2 et 3 : Avancées ; après 4 et 5 : Épiques. Tous les exemplaires restants des niveaux inférieurs sont aussi disponibles face visible. Du plus petit au plus grand meilleur essai, chacun prend une carte (de l’offre ou d’un niveau inférieur) ET un jeton. Les égalités suivent l’ordre du module terminé. Les cartes proposées non choisies retournent dans leur pioche. Les confirmations sont atomiques, puis le premier joueur passe dernier. La main complète reste accessible pendant les choix et les cartes s’agrandissent aussi au clic.

Les NPC utilisent exactement les mêmes actions validées que l’humain : mêmes dés, joker personnel, types obligatoires, scores, gains et prix des jetons. Le contrôleur reçoit une copie de ses informations visibles, des seules cartes proposées au draft et du marché partagé ; la pioche cachée et le générateur aléatoire restent inaccessibles. Un jet fourni au moteur est identique pour un humain ou un NPC, indépendamment du niveau.

Le lancement propose **Détente**, **Normal** (par défaut) et **Expert**, en solo et en ligne. Le niveau est sauvegardé et affiché avec les NPC. Détente privilégie le prochain trick et les arrêts prudents ; Normal prévoit deux tricks à l’avance, puis réévalue la suite après chaque réussite. Les deux sécurisent d’abord un résultat et gardent la carte engagée après le jet. Leurs choix varient parmi des options proches, sans consommer ou modifier le hasard des dés. Les deux types obligatoires restent toujours pris en compte. Expert conserve la recherche jusqu’à trois tricks et le placement optimisé. Tous les niveaux et les humains gardent la carte engagée après le lancer ; seuls les dés non confirmés peuvent être repris.

Au deuxième essai, leur cible est le meilleur résultat adverse +1 ; leur premier essai reste protégé. Ils peuvent ainsi tenter de battre le meneur ou chercher trois tricks et les cartes qui rapportent des jetons en fin de module. Ces récompenses perdent leur intérêt à la toute fin de partie. Les six modules visibles orientent aussi leur draft : couverture des types, coût en dés et conditions des bonus à venir. La mention **Utilisés** près des jetons montre leurs dépenses pendant l’essai, même si des gains ont reconstitué le stock. La recherche reste bornée et ses probabilités pour les jets suivants sont estimées ; elle ne garantit pas la stratégie optimale.

## Bilan de partie

Le classement final affiche la durée de jeu et, pour chaque joueur, les chutes, les séquences de trois tricks, les jetons gagnés et les jetons dépensés. Chaque total de jetons détaille ±1 / ↻ / ❄. La réserve de départ ne compte pas comme un gain ; les dépenses restent comptées en cas de chute. Une récompense différée compte seulement quand elle est effectivement attribuée. Les essais déjà archivés ne sont pas comptés une seconde fois.

La durée couvre le draft et les six modules, puis se fige au bilan du dernier module. En solo, les pauses NPC, le retour au menu et le temps entre deux ouvertures sont exclus. En ligne, le serveur mesure la durée commune, hors pauses NPC et interruptions du serveur ; ouvrir un menu ou se déconnecter ne suspend pas la partie des autres joueurs. La durée enregistrée et les compteurs sont conservés dans la sauvegarde. Le bilan final et son export JSON restent stables lorsqu’on les consulte plus tard.

**Exporter le bilan** conserve les données de partie et ajoute `summary`, avec `durationMs`, les résultats de chaque joueur et les jetons de départ, gagnés, dépensés et restants, par type. Le nouveau paquet utilise une sauvegarde v10 distincte : les anciennes sauvegardes restent stockées, mais une nouvelle session est nécessaire pour les nouvelles cartes.

## Bonus

Les jetons persistent entre essais et modules, avec une réserve maximale de **3 par type et par joueur**. Les récompenses au choix utilisent les places libres et les excédents retournent à la banque. Au draft, si aucune offre ne rentre dans la réserve, le joueur prend sa carte et remet un jeton proposé à la banque. Chaque utilisation consomme un jeton. Plusieurs ±1 ou relances peuvent être utilisés pendant le même essai, tant que le stock le permet. Pour ±1, cliquer le bonus puis un dé disponible, ou sélectionner un dé puis le bonus. Pour ↻, un clic relance tous les dés non validés et non gelés, y compris ceux placés sur la carte en cours ; ces dés reviennent dans la réserve. Les faces restent entre 1 et 6 et les dés validés ne peuvent plus changer.

Le gel ❄ s’active aussi pendant un jet sur un dé non validé, avant une relance payante. Il consomme un jeton et protège ce dé pendant le trick en cours. Après un trick réussi, il peut préparer le trick suivant et engage alors la continuation. Plusieurs jetons peuvent conserver plusieurs dés ; le même dé déjà gelé ne peut pas être payé à nouveau. Le gel attend le prochain lancer qui concerne ce dé. Si la carte en cours est validée avec d’autres dés avant ce lancer, le dé gelé garde sa face entre les deux tricks. Le gel conserve sa face pendant tous les lancers et relances de la séquence, même après avoir validé d’autres tricks et cliqué sur Continuer. Seule l’utilisation de ce dé sur une carte validée ou la fin de la séquence (arrêt ou chute) retire le gel. Un ±1 peut modifier volontairement sa face. Un jeton de chaque type est fourni au départ.

Les effets +1 des cartes se déclenchent avec un autre trick du type indiqué, indépendamment de l’ordre. Les cartes à jeton donnent leur récompense en fin de module, seulement pour un essai conservé : un jeton par carte physique récompensée, sans maximum par sorte sur les deux essais. Ces gains s’ajoutent au jeton immédiat de chaque séquence de trois tricks. Les effets détaillés sont définis dans `public/trick-catalog.js` et présentés dans la collection du jeu.

Les colonnes de probabilités avec bonus dans `BALANCE.md` illustrent la disponibilité d’un jeton ±1 et/ou d’une relance (hors gel) ; une réserve plus importante offre davantage de possibilités.

## Sauvegarde et commandes multijoueurs

La version 0.5.0 utilise `sk8-match-v12` et les règles v17, séparées des anciennes sauvegardes. Une nouvelle partie est nécessaire pour les effets simples ; les anciens fichiers et les stockages précédents sont conservés. En ligne, un ancien salon est refusé avec un message invitant à créer une partie. Les anciennes sauvegardes restent stockées ; commencer une nouvelle session pour jouer le paquet de 85 cartes. **Reprendre** restaure les six modules tirés, les mains, la pioche commune, les dés, les jetons, les scores, le joueur actif et l’état du générateur aléatoire. Un parcours incompatible est refusé. Les reprises durant un tour NPC et pendant un récapitulatif ne doublent pas les PV. Le draft reste à une carte et un jeton par joueur. Le bilan complet est exportable en JSON.

`public/match.js` sépare la session et ses joueurs de l’interface. Tous les contrôleurs soumettent des commandes sérialisables à `dispatch`, avec un identifiant de joueur et une révision optionnelle. Le moteur vérifie le joueur actif, la phase et les règles. La pioche n’est sérialisée qu’une seule fois. Le contrôleur `public/npc.js` propose des commandes et ne modifie pas directement les dés ou les scores.

En ligne, `server/rooms.mjs` utilise ce même moteur comme autorité. Les invités envoient des commandes authentifiées ; leurs dés et scores sont calculés sur le serveur. Chaque commande possède une révision et un identifiant pour empêcher les doubles actions lors d’une reprise de connexion. Le serveur utilise une source aléatoire cryptographique, sans transmettre la pioche cachée, l’état aléatoire, les offres des autres joueurs ni leurs codes d’accès. Les mains et les tables de tous les joueurs sont publiques pour permettre leur consultation. Une erreur d’écriture annule l’action en mémoire et sa révision. Les anciennes sauvegardes solo restent indépendantes.

## Validation

```sh
npm test
npm run balance
npm run simulate:match
node --check public/app.js
```

Les tests couvrent les 85 cartes et leurs trois couches, les probabilités exactes de toutes les combinaisons, le stock après un draft initial entièrement Avancé, les offres par niveaux, la réserve inférieure, les récompenses et le plafond de jetons et le cache versionné. Ils vérifient également : combinaisons et probabilités exactes, règles du tour, conservation des cartes, bonus cumulables, pioche commune, acteur autorisé, révision périmée, deux essais, égalités, attribution unique des PV, reprise déterministe pendant le jeu des NPC, draft commun, contraintes de types et relance de tous les dés libres. Le Lagon ajoute 2 000 tirages contrôlés, les 12 conditions de bonus avec contre-exemples, leur cumul, leur perte en cas de chute et le refus des parcours invalides. Les tests réseau vérifient notamment les mains et tables publiques, les offres privées, les droits des sièges et de l’hôte, la restauration depuis le disque, une compétition complète de six modules et l’API HTTP. Les tests ciblent aussi la consultation sans contrôle adverse, le suivi actif, la pause et la reprise, les cartes agrandies avec dés archivés, la recherche de score au deuxième essai, les récompenses, les modules futurs, les types obligatoires, le choix des dés et l’absence d’accès aux informations cachées.

Audit historique antérieur à la version 0.2.1 (qui interdit aussi le remplacement de carte en Expert) : `node scripts/audit-npc-difficulty.mjs 200` vérifie 600 parties à quatre joueurs, soit 28 800 essais, avec rotation du siège de référence. Le rapport `tests/npc-difficulty-audit.json` contrôle les actions légales, les combinaisons, les six dés, les stocks physiques, les coûts des jetons, les scores et les faces tirées. En Normal, les NPC font 9,46 points par essai en moyenne et 18+ sur 3,9 % des essais, contre 13,40 points et 24,8 % en Expert. Ils dépensent 13,54 jetons par partie et en gardent 2,69 en moyenne. La référence heuristique remporte ou partage le classement final dans 14 % des parties contre trois NPC Détente, 10 % contre trois Normaux et 0 % contre trois Experts. Cette référence ne représente pas tous les joueurs humains : ces chiffres mesurent la difficulté relative, pas une promesse de taux de victoire humain.

Les statistiques sont vérifiées sur les récompenses de trois tricks, les gains différés, les drafts, les chutes automatiques, les commandes refusées, la conservation des stocks, les pauses, la reprise, l’horloge reculée, les erreurs de disque et les doublons réseau. Une partie de six modules avec sauvegardes/reprises est comparée à un journal d’événements indépendant. Une partie à quatre joueurs a aussi été terminée dans le navigateur ; les valeurs du tableau ont été comparées à l’export et aux réserves finales. Capture : `tests/screenshots/match-statistics-verified.png`.

Comparaison historique antérieure à la version 0.2.1 : `node scripts/compare-npc-strategy.mjs 50` compare le niveau Expert et l’ancien contrôleur sur 100 duels de six modules, en échangeant les sièges pour chaque graine. Le rapport `tests/npc-strategy-comparison.json` mesure 494 séquences de trois tricks contre 100, et 3,7 % de chutes contre 15,9 %, sur 1 200 essais par version. Les 100 parties terminent et conservent l’inventaire physique. Cette comparaison mesure un progrès contre l’ancien contrôleur, sans démontrer l’équilibre face à des humains. Consultation et retour à la carte engagée vérifiés dans le navigateur en ligne, sans défilement à 1280 × 720 ; capture dans `tests/screenshots/player-inspection-verified.png`.

`npm run simulate:match` vérifie en plus 100 parties à quatre joueurs et six manches : 600 modules, 4 800 essais, inventaire conservé et sauvegarde/reprise à chaque transition. Les originaux des illustrations et les consignes ImageGen sont dans `artwork/parks/le-lagon/modules/`. `node scripts/build-module-art.mjs <chemin-vers-sharp>` régénère les WebP depuis ces originaux, sans modifier leur contenu.

`node scripts/artwork/build-module-layers.mjs <chemin-vers-sharp>` régénère les trois couches des 12 modules, leur manifeste et la planche de contrôle depuis les illustrations approuvées. La version 0.3.1 passe 199 tests, dont les migrations de drafts solo/en ligne, le stock physique, la séparation des couches et leur cache. Vérifications visuelles des modules sur six résolutions et du draft complet à 1280 × 720 dans `tests/module-layers-browser-results.json`.

La version 0.4.0 passe 231 tests, dont les douze bonus V3 et leurs contre-exemples, les deux essais indépendants, les chutes, le joker physique, les preuves de gel et de sauvetage, les prévisions de score sans mutation et la séparation des anciennes sauvegardes. `npm run simulate:match` termine également 100 parties à quatre joueurs, soit 600 modules et 4 800 essais, avec sauvegarde/reprise à chaque transition. Il s’agit d’une vérification fonctionnelle, pas d’une nouvelle garantie d’équilibrage. Les cartes V3 sont contrôlées sur six résolutions dans `tests/module-v3-browser-results.json`.

La suite comprend 100 parties complètes avec 2 à 4 joueurs et sauvegarde/reprise. La comparaison des jetons (`scripts/compare-bonus-economy.mjs`) porte sur 1 000 parties avant et 1 000 après, avec les mêmes graines et quatre profils de risque ; résultats dans `tests/bonus-economy-before.json` et `tests/bonus-economy-after.json`. Les parties emploient le contrôleur public ; les flux aléatoires divergent après des actions différentes. Le banc `node scripts/test-proposed-balance.mjs 200 live` ajoute 800 parties à quatre joueurs, soit 32 000 essais, avec quatre compositions de table. Les résultats des règles v10 sont dans `tests/live-rules10-balance-results.json`. Les fichiers `tests/balanced-balance-results.json` et `tests/adjusted-balance-results.json` restent des mesures historiques v9 : les comparer directement ne sépare pas l’effet des différents changements de règles. Les contrôleurs sont heuristiques et ne garantissent pas l’équilibre entre joueurs humains.

Fichiers principaux :

- `public/data.js`, `public/combinations.js` : catalogue, combinaisons et placement des dés.
- `public/turn.js`, `public/engine.js` : règles communes à chaque joueur.
- `public/match.js`, `public/npc.js`, `public/npc-strategy.js`, `public/npc-dice.js` : session compétitive, planification des NPC et choix des dés.
- `public/table-view.js` : joueur consulté et autorisation de jouer sur sa propre table.
- `public/npc-difficulty.js`, `public/npc-choice.js`, `public/npc-view.js` : profils de décision et informations visibles des NPC.
- `public/played-card.js` : instantané d’une carte jouée et de ses dés pour l’agrandissement.
- `public/match-statistics.js` : comptage des jetons, durée mesurée et synthèse des essais du bilan.
- `server/rooms.mjs`, `server/http-server.mjs` : salons, sauvegarde sur disque, authentification et commandes en ligne.
- `public/online-client.js`, `public/online-ui.js`, `public/online.css` : connexion, invitation, reprise et salon.
- `public/match-ui.js`, `public/match.css` : scores, parcours, jetons et graphiques.
- `public/app.js`, `public/campaign.css`, `public/card-skin.css` : plateau et cartes.
- `public/drag.js` : déplacements souris, stylet et tactile.

L’atelier historique de six cartes et ses pages, moteur, styles et tests dédiés ont été supprimés. `simulate:campaign` conserve le banc de simulation solo avec une politique limitée à un bonus de chaque type par essai ; `simulate:match` teste la partie actuelle.

Le workflow GitHub teste puis publie `public/` lors d’un push sur `main`. Les changements locaux ne sont pas publiés automatiquement.

## Notes de mise à jour

La version 0.5.3 rend Normal et Détente plus accessibles : planification des points et du draft plus courte, choix moins optimisés et budgets de bonus plus modestes. Les objectifs utiles restent respectés ; les joueurs gardent leurs points, dés, règles et liberté de dépense. Expert rejoue exactement les mêmes 100 parties que la version précédente. Les 261 tests et les 1 400 parties supplémentaires montrent en Normal un meilleur essai moyen de 12,62 points par module contre 14,48 auparavant, et 4,6 % d’essais à 20+ points contre 10,7 %. Les résultats sur des graines nouvelles confirment la baisse. Détails et limites dans le [rapport local de difficulté](http://127.0.0.1:8000/reports/build-053-difficulty.html), données dans `tests/build-053-balance/summary.json`. Les sauvegardes v12 et règles v17 restent compatibles.

La version 0.5.2 applique aux deux essais les objectifs de score ou de gain net de jetons, avec les dépenses passées et les coûts gel + relance. Les NPC peuvent passer avant le jet sans objectif utile ; les points et les règles restent inchangés. Les 255 tests et les 1 000 parties supplémentaires sont détaillés dans le [rapport local des objectifs](http://127.0.0.1:8000/reports/build-052-objectives.html). La baisse des dépenses s’accompagne de davantage de chutes et d’un avantage du dernier joueur plus marqué : l’équilibrage global reste à surveiller.

La version et les notes sont accessibles au menu. Un contour indique les versions non lues. Les notes consultées sont mémorisées après fermeture de la fenêtre dans `sk8-seen-patch-notes-v1`, dans le stockage local du navigateur ; cet état est personnel et ne voyage pas dans la sauvegarde multijoueur.

La version 0.5.1 conserve les points, les règles v17 et les sauvegardes v12. Elle révise le draft et la prise de risque des NPC à partir des cartes et ressources publiques, sans accès aux jets futurs. Les 228 tests passent. La comparaison couvre 1 200 parties appariées au build précédent et 400 parties Normal sur des graines supplémentaires, soit 76 800 essais. En Normal, les Épiques passent de 0 à 51,2 % des prises au dernier draft et l’écart premier/dernier de 16,7 à 9,1 points de pourcentage. Le score varie peu (10,69 → 10,85), avec davantage de chutes (14,4 → 21,0 %). Le [rapport local](http://127.0.0.1:8000/reports/build-051-balance.html) détaille aussi les compromis ; données dans `tests/build-051-balance/comparison.json`. Reproduction : `scripts/audit-build050.mjs`, `scripts/run-build051-audit.mjs`, `scripts/summarize-build051.mjs` et `scripts/render-build051-report.mjs`. Les données du build 0.5.0 restent conservées séparément.

La version 0.5.0 passe 222 tests, avec 100 compétitions dans la suite et 100 parties fonctionnelles supplémentaires à quatre joueurs (600 modules, 4 800 essais). Scores variables, étoiles physiques, deux jetons, gains après deux tricks, sauvegardes, erreurs de disque, statistiques et doublons réseau sont contrôlés. Le navigateur vérifie les choix successifs, la reprise au second choix et le passage automatique, ainsi que les couches sur six résolutions : `tests/simple-module-effects-browser-results.json`.


## Passage au prototype physique

Les 41 cartes de tricks portent désormais une grille fixe de chances avant un jet, sans joker, gel ni bonus : 6/4/3/2 dés pour un coût de 2, 6/4/3 pour un coût de 3 et 6/4 pour un coût de 4. Les valeurs sont arrondies au dixième ; une réussite non certaine n’est jamais présentée comme garantie. La grille étroite descend à gauche. Le badge Base orange, Avancé bleu ou Épique mauve se trouve sous l’icône à droite. Les SVG modifiables, WebP transparents et PNG assemblés ont tous été régénérés.

La table de chaque joueur consulté affiche sa carte skater au format poker, avec son nom et trois réserves de bonus. La carte commune du Lagon suit tous les records avec deux marqueurs par joueur : dizaines 30/20/10/00 de haut en bas à gauche ; unités sur deux colonnes à droite, de 0–1 en bas à 8–9 en haut. Seuls les essais encaissés déplacent les marqueurs : on garde le maximum des deux, puis on remet les deux marqueurs à zéro au début du module suivant. La somme des essais, ancien champ historique inutilisé, n’est plus calculée. Les PV de partie restent un compte séparé. Les trois pioches et leurs emplacements de défausse montrent leurs vrais effectifs, aussi en ligne sans révéler les cartes cachées. Selon les règles actuelles, les défausses restent vides : les offres non prises retournent à la pioche et les cartes conservées restent chez leur joueur jusqu’au module suivant.

Pour un premier prototype à quatre joueurs, prévoir :

- 85 cartes tricks (36 Base, 40 Avancé, 9 Épique), les 12 cartes modules, les 6 cartes skaters au choix et la carte commune du parc.
- Un ensemble partagé de 6 dés, un de chaque couleur, avec la face 1 marquée ★ ; 8 petits marqueurs de record, deux par joueur, de sa couleur.
- Trois types de jetons bonus. Proposition matérielle : 16 jetons de chaque type pour couvrir les réserves des quatre joueurs (3 maximum par type) et les quatre offres simultanées ; remettre les jetons dépensés et excédentaires à la banque.
- Six petits repères de gel réutilisables, un marqueur de premier joueur et un repère Essai 1 / Essai 2 commun.
- Des jetons trophée valant chacun 1 PV (jusqu’à 18 PV par joueur sur six modules ; prévoir 72 jetons pour quatre joueurs, égalités comprises).

Manipulation proposée : après un essai encaissé, calculer ses points avec les dés encore posés, déplacer les deux marqueurs seulement si le record est battu, laisser les cartes conservées de côté et récupérer les six dés pour le joueur suivant. Les cartes gardées suffisent à identifier les gains différés de fin de module ; aucune somme des deux essais n’est nécessaire. Les cartes skaters, tricks et modules sont au format poker 63 × 88 mm. La carte du parc utilise le même format à l’horizontale (88 × 63 mm). Prévoir de petits marqueurs pour que plusieurs joueurs puissent partager une case. Le fond perdu et les planches de découpe restent à préparer.


### Cartes poker et trophées — 0.5.7

La carte commune du parc reste affichée pendant le draft, les essais, les bilans et le classement final. Cliquer dessus ou appuyer sur Entrée permet de l’agrandir. Les marqueurs portent la couleur et l’initiale du skater ; un record de 27 se lit 20 + 7. Les PV ne sont pas remis à zéro : les trophées s’accumulent automatiquement après l’attribution des récompenses, y compris pour les ex æquo. Chaque table affiche le stock exact ; au-delà de cinq trophées, le dessin reste compact et le compteur conserve le total réel.

Les fichiers SVG et PNG des six skaters, du parc et du jeton trophée sont dans `artwork/cards/players/poker-v1/`, avec un manifeste de dimensions. Les 41 tricks et 12 modules ont été régénérés à 1008 × 1408 px, avec textes à 2016 × 2816 px. Le repère historique 900 × 1300 est conservé dans les sources ; des marges crème latérales donnent le ratio poker sans étirer l’illustration ni les textes, et les emplacements interactifs des dés suivent la même transformation. Les fichiers sont des faces au format de coupe, pas encore des planches avec fond perdu.

La nouvelle illustration du parc a été créée avec l’outil intégré ImageGen à partir du style approuvé du Lagon. Source et prompt exact : `artwork/parks/le-lagon/overview/park-overview.png` et `generation.json`. Version Web : `public/assets/parks/le-lagon-overview.webp`.


### Deux finales et deux drafts Épiques — 0.5.8

Le Coping Bleu et Les Marches des Palmiers rejoignent La Boucle du Lagon et La Grande Vague à 4 trophées, sans changer leurs types requis ni leurs effets. Les 12 cartes se répartissent en quatre Découverte (2 PV), quatre Enchaînement (3 PV) et quatre Finales (4 PV). Le parcours de six modules tire deux cartes sans remise dans chaque groupe : 2 / 2 / 3 / 3 / 4 / 4 PV. Le deuxième meilleur score distinct rapporte toujours 1 PV.

Les cinq drafts de récupération suivent Base / Avancé / Avancé / Épique / Épique : une carte et un jeton par joueur. Les cartes des niveaux inférieurs restent disponibles. À quatre joueurs, les deux marchés Épiques utilisent au plus huit des neuf exemplaires ; le paquet reste à 85 cartes. Avec deux Épiques en main, le maximum d’un essai atteint 32 points ; les pistes du parc couvrent 0 à 39. Prévoir 72 jetons trophée pour couvrir quatre joueurs à 18 PV, égalités comprises.

Les règles passent en v18 et les sauvegardes en v13 (`sk8-match-v13`). Commencer une nouvelle partie locale ou créer un nouveau salon ; les sauvegardes précédentes restent conservées et ne sont pas converties. Les faces imprimables et Web des modules affichent leurs nouvelles manches et récompenses.


### Spécialités des skaters — 0.6.0

Le choix Base / Avancé apparaît à la création d’une partie locale ou en ligne et s’applique à tous les participants, NPC compris. Base conserve les règles sans pouvoirs. Avancé ajoute une spécialité par skater, utilisable une fois par module parmi les deux essais. Le jeton porte le symbole du pouvoir : face couleur disponible, face noir et blanc utilisée. Il se réactive au début du module suivant, après le draft, jamais entre les deux essais.

- Néo — Troc : échange un jeton contre un autre type, dans la limite de trois par type.
- Ruby — Dé porte-bonheur : après un lancer, relance uniquement son dé personnel libre et non gelé, gratuitement.
- Jade — Trick signature : au deuxième essai, peut reprendre une carte de son premier essai encaissé. La carte revient en main et doit être réussie à nouveau, avec les types requis et le coût en dés habituels. Le premier score et ses dés archivés restent inchangés. Une carte physique donnant un jeton en fin de module ne paie qu’une fois, même si elle est réussie dans les deux essais.
- Sol — Réserve renforcée (depuis 0.6.3) : peut conserver quatre jetons ±1 au lieu de trois en mode Avancé. Pouvoir passif permanent ; relance et gel restent limités à trois. Chaque correction dépense un jeton ordinaire.
- Milo — Bon rythme : après avoir encaissé exactement deux tricks de types différents et reçu les récompenses normales, peut gagner un jeton supplémentaire au choix, si la réserve le permet.
- Iris — Rebond : après une chute, peut récupérer un jeton qu’elle a effectivement dépensé dans cet essai. Aucune récompense pour un essai passé, ni remboursement d’un jeton non dépensé. Le score reste nul.

Cliquer le jeton de spécialité sous la carte skater ouvre les choix possibles. Les pouvoirs facultatifs non utilisés sont conservés pour le second essai. Le joueur peut aussi passer au joueur suivant sans activer Bon rythme ou Rebond. Les NPC suivent les mêmes commandes validées que les humains. La carte reprise par Trick signature reste publique ; son état et le jeton utilisé sont conservés lors d’une reprise, aussi en ligne.

Les six variantes `skater-*-advanced` et les six jetons `specialty-*-front` / `specialty-*-back` sont exportés en SVG et PNG dans `artwork/cards/players/poker-v1/`. Le manifeste avancé précise les dimensions : cartes poker 63 × 88 mm, jetons de spécialité suggérés à 20 mm. Prévoir un jeton de spécialité par skater choisi. Le stock de 85 Tricks suffit toujours ; la carte reprise ne crée aucun exemplaire supplémentaire.

Version de règles v19, sauvegardes v14 (`sk8-match-v14`). Une nouvelle partie est nécessaire ; les sauvegardes précédentes sont conservées. Les pouvoirs proposés sont fonctionnels et testés, mais leur équilibre compétitif reste à mesurer en parties de test.

### Trick signature — 0.6.1

Trick signature remplace Main sur mesure pour Jade en mode Avancé. Le jeton est utilisable pendant le deuxième essai tant qu’il n’est pas terminé, et seulement si le premier essai a été encaissé. Il récupère une seule carte de cette séquence. L’archive affiche un repère de carte reprise pour garder le score visible sans représenter deux exemplaires physiques. La carte devient disponible dans la main et reste soumise aux règles de jeu normales. Le pouvoir est consommé dès la reprise, même si le deuxième essai chute ou si la carte n’est finalement pas rejouée. Les autres pouvoirs gardent leurs règles.

Règles v20 et sauvegardes v15 (`sk8-match-v15`) : commencer une nouvelle partie pour tester cette version. Les anciennes sauvegardes restent conservées.

### Jade et Sol — 0.6.2

Sol remplace Double réglage par Réglage précis : un ±1 gratuit sur un dé disponible après le lancer, une fois par module, même avec une réserve vide. Ce pouvoir peut être combiné aux bonus ordinaires ; il ne consomme aucun jeton ±1 et ne compte pas comme un jeton dépensé. Sa carte avancée et les deux faces de son jeton ont été régénérées.

Les NPC de Jade comparent les reprises selon les séquences du module actuel, les types obligatoires, les dés restants et le score protégé. Ils peuvent attendre avant d’activer le pouvoir et tiennent compte d’une carte récupérable dès le premier essai. Ils ne prévoient pas une seconde récompense de jeton pour la même carte physique. Les NPC de Sol anticipent la correction gratuite et peuvent l’associer à un ajustement ordinaire pour sauver un trick.

Règles v21, sauvegardes v16 (`sk8-match-v16`) : créer une nouvelle partie en mode Avancé. Les anciennes sauvegardes sont conservées. Contrôle des six spécialités dans le navigateur sur ordinateur et mobile ; 296 tests réussis.

Audit : 8 400 nouvelles parties, 403 200 essais et 5 101 545 commandes légales. Les 1 800 parties Base communes reproduisent exactement le bilan précédent. Sol passe de 24,1 à 34,5 % des victoires en Normal et de 22,9 à 42,0 % en Expert ; son gain propre en Expert atteint +2,15 trophées par partie [IC 95 % : +1,75 ; +2,54]. La variante paraît trop forte dans ces simulations, mais reste intégrée pour le test demandé. Le contrôle ciblé de Jade, avec les mêmes adversaires et le nouveau Sol, estime un gain de stratégie de +0,38 trophée en Normal [+0,11 ; +0,64] et +0,20 en Expert [−0,02 ; +0,43]. Ce dernier résultat reste incertain. Des parties humaines sont nécessaires pour confirmer l’équilibre.

Reproduction (les graines restent celles du bilan 0.6.1) :

```sh
node scripts/audit-specialty-balance.mjs --normal=20 --expert=10 --ablation=5 --expert-ablation=10 --workers=6 --out=tests/specialty-balance-062
node scripts/audit-specialty-balance.mjs --normal=20 --expert=10 --legacy-jade=true --workers=6 --out=tests/specialty-balance-062-jade-control
node scripts/summarize-specialty-balance.mjs tests/specialty-balance-062 tests/specialty-balance-062-jade-control
node scripts/compare-specialty-balance.mjs tests/specialty-balance-061 tests/specialty-balance-062 tests/specialty-balance-062-jade-control
```

Résultats dans `tests/specialty-balance-062/` et [rapport local](http://127.0.0.1:8001/reports/specialty-balance-062.html). Les intervalles regroupent les quatre rotations par graine et composition. Le rapport distingue le changement de version, la contribution propre du pouvoir et le changement de stratégie de Jade.

### Réserve renforcée de Sol — 0.6.3

La réserve de Sol passe à quatre jetons ±1 en mode Avancé. Les stocks de départ restent à un jeton par type ; relance et gel restent limités à trois. Le pouvoir est passif pendant toute la partie, sans activation ni retournement de jeton. Le repère de spécialité porte « Passif » ; les deux faces de son repère imprimable sont identiques. Le ±1 gratuit de la version précédente est supprimé.

Les gains de séquence et de fin de module, le draft, les compteurs et la sauvegarde/reprise respectent la capacité par joueur et par type. Les NPC peuvent collecter le quatrième jeton et planifient uniquement des corrections payées avec leurs réserves réelles. La stratégie de Jade reste celle de 0.6.2.

Règles v22, sauvegardes v17 (`sk8-match-v17`) : créer une nouvelle partie. 295 tests réussis ; carte, réserve 4/4, correction payée et affichage mobile vérifiés dans le navigateur.

Audit reproductible :

```sh
node scripts/audit-specialty-balance.mjs --normal=20 --expert=10 --ablation=5 --expert-ablation=10 --workers=6 --out=tests/specialty-balance-063
node scripts/summarize-specialty-balance.mjs tests/specialty-balance-063
node scripts/report-sol-reserve.mjs
```

Le contrôle individuel de Sol ramène sa capacité à trois dès le début, y compris pendant les drafts et récompenses. Le nombre de parties atteignant quatre jetons et le nombre de quatrièmes jetons reçus sont mesurés séparément des activations de pouvoirs. Données dans `tests/specialty-balance-063/` et [rapport local](http://127.0.0.1:8001/reports/specialty-balance-063.html).

Résultats : 7 200 nouvelles parties, 345 600 essais, 4 370 666 commandes légales ; les 1 800 parties Base communes sont identiques au bilan précédent. Sol passe de 34,5 à 20,7 % des victoires en Normal et de 42,0 à 23,5 % en Expert. Il atteint quatre jetons ±1 dans 26,1 % des parties Normal et 22,5 % en Expert. Le gain propre de sa capacité est faible et incertain : −0,04 trophée par partie en Normal [IC 95 % : −0,28 ; +0,21], +0,05 en Expert [−0,04 ; +0,14]. La domination disparaît, mais les simulations ne montrent pas un avantage net clair de la quatrième place. La variante demandée est conservée pour les tests humains.
