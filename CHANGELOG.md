# Version 0.6.10 — 8 novembre 2026

- Personnages en pied sur les cartes skaters, nom et informations superposés sur des dégradés translucides.
- Spécialité et jetons disposés dans un même flux, tailles proportionnelles à la carte ; suppression des zones fixes qui coupaient le texte.
- Douze cartes imprimables Base/Avancé régénérées. Règles et sauvegardes inchangées.
- Audit descriptif de 120 parties NPC : réserves observées au début des essais et gains ventilés par source. Résultats dans tests/token-pressure-audit/summary.json ; aucun changement d’équilibrage appliqué.

# Version 0.6.9 — 7 novembre 2026

- Skater à gauche, module à droite et repère explicite de propriétaire sur la table.
- Tour actif en rouge contrasté avec libellé visible, distinct de la table consultée.
- Nosegrind précise « Exactement 2 valeurs d’écart » sur sa face et dans ses textes accessibles.
- Icônes de composants dans les textes des cartes, y compris les exports imprimables ; retrait des contours extérieurs superflus.
- Règles et sauvegardes inchangées.

# Version 0.6.3 — 6 novembre 2026

- Livraison des évolutions depuis la version publiée 0.5.5 : cartes au format poker, probabilités fixes imprimées, carte du parc pour les meilleurs essais, jetons trophée et piles/défausses visibles.
- Parcours à deux modules par niveau, quatre modules à quatre trophées et drafts Épiques avant les modules 5 et 6 ; couleurs distinctes pour les trois niveaux de modules.
- Choix Base/Avancé en local et en ligne, spécialités des six skaters et stratégie de Jade améliorée. Les pouvoirs actifs se réinitialisent à chaque module ; Sol possède un pouvoir passif.
- Sol : Réserve renforcée remplace le ±1 gratuit. Capacité permanente de quatre jetons ±1 en Avancé, trois relances et trois gels ; chaque correction coûte un jeton.
- Capacité prise en compte dans les récompenses, le draft, les choix NPC, les compteurs et les reprises de sauvegarde. Carte et repère passif imprimables mis à jour.
- Règles v22, sauvegardes v17 : nouvelle partie nécessaire. 295 tests réussis et contrôle navigateur sur ordinateur et mobile.
- 7 200 simulations : Sol revient à 20,7 % des victoires en Normal et 23,5 % en Expert. Le gain propre de la quatrième place reste faible et incertain (+0,05 trophée par partie en Expert). Rapport : `public/reports/specialty-balance-063.html`.

# Version 0.6.2 — 6 novembre 2026

- Sol : Réglage précis remplace Double réglage. Un ±1 gratuit sur un dé disponible après le lancer, une fois par module parmi les deux essais, sans dépense de jeton ordinaire.
- Jade : les NPC comparent les cartes récupérables selon le module, les dés restants et le meilleur score, anticipent une reprise au premier essai et évitent de prévoir deux fois la récompense d’une même carte.
- Sol : les NPC intègrent la correction gratuite à leur plan et peuvent la combiner aux jetons ordinaires.
- Carte avancée et jeton de Sol mis à jour. Règles v21 et sauvegardes v16 : nouvelle partie nécessaire. 296 tests réussis et vérification navigateur des six spécialités.
- 8 400 simulations : Sol atteint 34,5 % des victoires en Normal et 42,0 % en Expert, signal d’un pouvoir trop fort. À adversaires identiques, la stratégie de Jade gagne environ +0,38 trophée par partie en Normal ; le gain Expert de +0,20 reste incertain. Rapport comparatif `public/reports/specialty-balance-062.html`.

# Version 0.5.5 — 4 novembre 2026

- Réserve de trois jetons par type, avec compteur sur la table et pendant le draft.
- Les bonus au choix utilisent les places disponibles. Au draft, si aucune offre ne rentre, le joueur prend sa carte et remet un jeton proposé à la banque.

# Version 0.5.4 — 4 novembre 2026

- Le deuxième meilleur score distinct rapporte 1 PV sur chaque module. Chaque ex æquo reçoit les PV de sa place.
- Les 12 cartes de module et le bilan affichent les deux récompenses. Dans une partie en cours, la règle s’applique dès le prochain bilan à calculer.

# Version 0.5.3 — 2 novembre 2026

- Normal et Détente assouplis : recherche des points respectivement sur deux et un tricks, draft centré sur les deux et un prochains modules, choix moins systématiquement optimaux. Le score connu ne force plus ces niveaux à optimiser trois tricks comme Expert.
- Les collectes rentables de trois tricks et les deux types obligatoires restent recherchés. Budget stratégique de deux jetons par essai pour Normal et un pour Détente, anticipé dans leurs décisions et leurs choix de cartes ; le moteur permet toujours aux joueurs de dépenser davantage. Objectifs utiles, gain net strict et points inchangés.
- Expert conserve exactement ses statistiques et son compte de commandes sur les 100 parties comparables au build 0.5.2 ; comparaison décision par décision sur trois autres parties. Référence NPC 0.5.2 conservée avec empreintes dans `tests/fixtures/npc-052/`.
- 261 tests réussis. 1 400 nouvelles parties / 67 200 essais, dont 200 parties Normal sur des graines supplémentaires. 210 136 contrôles de jeu et 62 487 dépenses vérifiées. Normal : meilleur essai moyen par module 14,48 → 12,62 ; essais à 20+ points 10,7 → 4,6 %. Confirmation hors réglage : 12,36 et 3,7 %.
- Rapport : `public/reports/build-053-difficulty.html`. Statistiques : `tests/build-053-balance/summary.json`. Les mesures portent sur des NPC ; les chutes et l’avantage du dernier joueur restent à surveiller. Règles v17 et sauvegardes v12 conservées.

# Version 0.5.2 — 2 novembre 2026

- Objectifs NPC sur les deux essais : améliorer le meilleur score utile au classement, ou récolter un solde strictement positif de jetons. Un petit score sous le score déjà assuré n’a plus de valeur indépendante.
- Budgets explicites de collecte, dont un plan sans dépense pour gagner un seul jeton. Cartes récompensées, récompenses du module et trois tricks comptés ensemble. Les dépenses passées sont incluses ; gel puis relance comptent pour deux. Prévisions sur une copie publique sans tirage de dés.
- Les NPC peuvent passer avant le jet sans objectif utile. Les récompenses déjà acquises peuvent être encaissées pour récupérer une dépense passée. Égalités, points, combinaisons, règles v17 et sauvegardes v12 conservés.
- 255 tests réussis, dont 27 nouveaux cas. 1 000 parties / 48 000 essais ; 148 346 contrôles de jeu et 54 115 dépenses vérifiées indépendamment, sans dépense sans objectif légal possible. Normal : dépenses 15,84 → 13,78 jetons par joueur et partie ; chutes 21,0 → 31,1 %, passes 0 → 7,1 %. L’avantage du dernier remonte : le changement d’objectifs ne valide pas l’équilibrage global.
- Rapport : `public/reports/build-052-objectives.html`. Statistiques : `tests/build-052-balance/summary.json`.

# Version 0.5.1 — 2 novembre 2026

- Décisions NPC uniquement : valeur des cartes au draft selon les jetons disponibles et les futurs modules publics ; maintien d’options à deux dés au draft initial. Les Épiques et les cartes à quatre dés entrent dans leurs choix sans être imposées.
- Prévision des mains publiques et des essais restant aux adversaires pour estimer les PV possibles. Les égalités valent les mêmes PV qu’une victoire seule ; le premier joueur ne se contente plus d’un seuil fixe sans score connu. Valeur d’assurance du premier essai conservé.
- Points, combinaisons, effets de module, règles du draft, sauvegarde v12 et règles v17 inchangés. Les parties actuelles restent compatibles.
- 228 tests réussis. 1 600 nouvelles parties mesurées / 76 800 essais, dont 400 parties Normal sur des graines supplémentaires ; 400 replays exclus du total, résultats et compte des décisions identiques. 248 336 contrôles d’inventaire, de dés, de scores et de jetons.
- Normal, 400 parties appariées : Épiques prises 0 → 51,2 % ; victoires du premier 16,7 → 21,2 %, du dernier 33,5 → 30,3 %. Score moyen 10,69 → 10,85 ; chutes 14,4 → 21,0 % et trois tricks 34,7 → 27,8 %. L’avantage de l’ordre et le profil de risque restent à surveiller avec des humains. Rapport : `public/reports/build-051-balance.html` ; données : `tests/build-051-balance/comparison.json`.

# Version 0.5.0 — 2 novembre 2026

- Nouveaux effets simples sur les 12 modules et leurs trois couches : Base, types favorisés, dé personnel, étoiles, Grande amplitude, Zone de récupération, Belle sortie et Session généreuse.
- Échange demandé : Coping Bleu donne +2 par trick à 3 ou 4 dés ; Double Quai donne un jeton au choix après exactement deux tricks encaissés. Types obligatoires, manches autorisées et PV conservés.
- Plus de minimum général de deux tricks. Belle sortie donne +2 points de séquence au total ; les Embruns donnent deux jetons au choix avec le +1 habituel.
- Choix de récompenses successifs, conservation des deux gains dans l’historique et les bilans, statistiques exactes et passage automatique après le dernier choix. Reprises, doublons et erreurs de disque vérifiés en ligne.
- Scores, compteur de récompenses, troisième emplacement, profils, bilans et NPC utilisent les nouveaux effets. Les cadres et illustrations restent partagés ; les nouvelles informations sont dans leur couche dédiée.
- Sauvegarde v12 / règles v17 : nouvelle partie requise ; anciennes sauvegardes conservées séparément.
- 222 tests réussis et 100 parties fonctionnelles supplémentaires (600 modules, 4 800 essais). Vérification en navigateur des récompenses et de six résolutions.

# Version 0.4.0 — 1 novembre 2026

- Intégration des 12 conditions V3 validées : sans relance, face commune, Base + Avancée, points croissants, dé personnel sur le dernier trick, gel reporté, trick sauvé, paire physique, quatre faces différentes, effet de score d’une carte, exactement deux tricks et six dés utilisés.
- Chaque condition vaut +2 points par essai conservé, avec au moins deux tricks. Les deux essais sont indépendants ; les faces physiques comptent même quand le joker représente un autre chiffre. Une chute annule le bonus.
- Enregistrement des jets initiaux, ajustements utilisés, relances, faces validées et gels conservés entre tricks. Ces preuves sont sérialisées ; les simulations de placement des NPC sont isolées de la partie réelle. Les estimations des jets futurs servent uniquement à leur stratégie.
- Nouvelles conditions, obligations et PV sur les 12 cartes en trois couches, dans la collection et sur la table ; minimum de deux tricks visible sur chaque carte. Le draft reste à N cartes + N jetons.
- Sauvegarde v11 / règles v16 : nouvelle partie nécessaire ; stockage v10 et anciens salons conservés, avec message explicite si un ancien salon est repris.
- 231 tests réussis, dont 100 compétitions avec reprises. Simulation fonctionnelle supplémentaire : 100 parties à quatre joueurs, 600 modules, 4 800 essais, stock physique préservé. Cartes contrôlées sur six résolutions. Rapports : `tests/match-simulation-results.json`, `tests/module-v3-browser-results.json`.

# Version 0.3.1 — 1 novembre 2026

- Draft entre modules : une carte et un jeton par joueur, soit 4 cartes et 4 jetons à quatre. Choix obligatoire des deux, ordre du moins bon au meilleur essai et réserve des niveaux précédents conservés.
- Les 12 modules du Lagon utilisent trois couches indépendantes : illustration, cadre graphique, textes et symboles. Format 900 × 1300 commun aux tricks, sources SVG modifiables, textes transparents à 2× et cache versionné.
- Même assemblage dans la collection, le parcours, les aperçus et la table ; titres ajustés, PV alignés et carte entière sur les petits écrans. Draft compact avec la main complète visible à 1280 × 720.
- Reprise des drafts à huit cartes : les offres supplémentaires retournent dans la pioche, sans perte de carte ni modification des choix confirmés. Migration réseau persistée une fois et signalée aux clients par une nouvelle révision.
- 199 tests réussis, dont 100 compétitions complètes. Modules contrôlés sur six résolutions ; rapport : `tests/module-layers-browser-results.json`.

# Version 0.3.0 — 1 novembre 2026

- 192 tests réussis, dont 100 compétitions simulées et les commandes multijoueurs. Couches, dés et archives vérifiés sur six résolutions. Rapport : tests/trick-layers-browser-results.json.
- 41 tricks différents, 85 cartes physiques : 36 Base, 40 Avancées, 9 Épiques ; combinaisons et points validés, dont +2 inclus pour trois ou quatre dés.
- Illustrations seules, cadre commun et textes/symboles indépendants pour toutes les cartes. Sources SVG, masters, cartes assemblées et consignes conservés dans artwork/cards/tricks/deck-v1.
- Draft initial 2 Base + 1 Avancée, ajout d’une Avancée après le passage à droite ; entre modules, deux propositions par joueur du niveau actif, choix possible dans la réserve visible des niveaux inférieurs.
- Récompenses des cartes en fin de module, sans plafond par sorte ; nouvelles probabilités exactes pour toutes les cartes et les dés personnels.
- Alignement des couches et dés, formats de cartes cohérents, aperçus agrandis, main consultable au clic dans le draft et dispositions adaptées aux écrans courts. Images versionnées et mises en cache.
- Sauvegarde de partie v10 / règles v15 : une nouvelle session utilise le paquet de 85 cartes, sans effacer les anciennes sauvegardes. Les modules V3 approuvés restent prévus pour une autre passe.

# Commandes de table — 31 octobre 2026

- Choisir le jeton après trois tricks réussis passe directement au joueur suivant, au deuxième essai ou au bilan. Attribution et passage de tour atomiques, sans double gain lors d’un renvoi réseau. Les 34 tests ciblés de récompense, de chute et de multijoueur passent.
- Bouton Chuter centré sous les cartes, dans les phases où la chute est proposée. Le clic termine l’essai et passe directement au joueur suivant, au deuxième essai ou au bilan du module, selon l’ordre de jeu.
- Chute et passage de tour exécutés en une commande atomique en local et en ligne. Une requête répétée ne joue pas deux fois ; un échec de sauvegarde annule les deux opérations. Les chutes, les dépenses et les deux essais restent comptabilisés.
- Récompense des trois tricks : trois cases avec un seul jeton ±1, ↻ ou ❄, sans libellé ni compteur visible. Les réserves restent affichées avec les bonus du plateau ; les choix conservent leurs noms accessibles.
- 178 tests réussis. Vérification visuelle à 1280 × 720 et 390 × 844, passage immédiat au NPC et attribution du jeton choisi.

# Présentation et rétroaction — 31 octobre 2026

- Palette du Lagon harmonisée, relief du plateau et des jetons, ombres des cartes, contraste des boutons et meilleure hiérarchie des scores. Bandeau de parcours compact pour laisser davantage de place aux tricks.
- Textes existants conservés : amélioration de leur taille, contraste, espacement et position. Les états engagé/réussi/chute se placent sur la carte et ne chevauchent plus le bouton central.
- Retours visuels brefs sur le placement, la reprise des dés, la réussite d’un trick, trois tricks réussis, l’encaissement, le tour actif et les jetons gagnés/dépensés. Aucune consommation du hasard ni modification de la partie ; les actualisations réseau ne rejouent pas les effets. Les effets de score expirent au changement d’essai.
- Mobile : dés plus grands et scores alignés. Draft initial : cartes choisies groupées, agrandissement au survol, profils compacts gardant tous les choix visibles. Vérification du sixième choix à 1280 × 720 sans défilement.
- 173 tests réussis. Vérifications en navigateur du plateau, des bonus, des chutes, des trois tricks, du draft et du lobby, à 1280 × 720 et 390 × 844. Animations limitées et préférence de réduction des mouvements respectée. Rapport : `tests/ui-polish-validation-results.json`.

# Version 0.2.1 — 31 octobre 2026

- Contour des notes non lues, conservé pendant leur consultation et retiré après fermeture. Suivi personnel par version dans le navigateur, indépendant des parties et des autres joueurs.
- Création du lobby avant le choix du rider. Six portraits disponibles pour tous les humains en même temps, couleur associée au personnage, réservations atomiques et actualisées dans les autres clients. Le lancement attend tous les choix humains ; les NPC utilisent les couleurs restantes. Choix et réservations persistés côté hôte.
- Carte verrouillée après le lancer, pour les humains et tous les NPC. « Reprendre les dés » retire seulement le placement non confirmé, sans modifier les faces, le gel ou les dépenses.
- Archives côte à côte avec les dés utilisés, adaptées à la place disponible sans défilement. La séquence encore au centre est affichée une seule fois.
- 167 tests réussis, dont les 100 compétitions complètes, les courses de réservation, la reprise du lobby, le gel et les contours personnels. Vérification avec deux clients locaux distincts, puis sur écran 1280 × 720 et mobile 390 × 844. Captures : `tests/screenshots/rider-lobby-021.png` et `tests/screenshots/attempt-row-021.png`.

# Version 0.2.0 — 31 octobre 2026

- Draft de départ simultané : trois cartes par joueur, choix d’une carte, passage des deux restantes à droite et ajout d’une carte du même type. Deux choix Kick, deux Slide, deux Air. Révélation après confirmation de tous ; sauvegarde en cours de vague et confirmations réseau concurrentes prises en charge. Les anciens drafts séquentiels restent jouables.
- Réserves des trois jetons visibles pendant les drafts et les choix de récompenses. Les profils montrent le portrait du skater et les PV cumulés de partie, avec le score du dernier module affiché séparément.
- Inspection d’un joueur épinglée jusqu’au bouton « Retour au suivi auto ». Les actions restent réservées à sa propre table et à son tour.
- Boutons Lancer, Réussir, Continuer et Garder centrés sous les tricks. Validation plus grande et pulsante lorsqu’elle est possible.
- Lueur sur les dés participant à une combinaison légale, en tenant compte du joker et des dés déjà posés. Animation commune des lancers et relances, humains et NPC, en local et en ligne ; dés gelés et bloqués exclus.
- Aperçus d’historique agrandis et vue complète des cartes d’un essai, accessible aussi au bilan du module. Conservation des dés d’origine, y compris les nouvelles chutes. Les anciens historiques affichent les cartes disponibles. Sur mobile, un bouton ouvre l’essai complet.
- Clic autour des fenêtres de cartes pour les fermer ; numéro de version et notes consultables au menu. Animations adaptées à la préférence de réduction des mouvements.
- Validation : 161 tests réussis, dont 100 compétitions complètes. Vérifications en navigateur à 1280 × 720 et 390 × 844, draft en ligne local, relance avec gel, historique des trois cartes, focus et retour au suivi. Rapport : `tests/ux-validation-results.json`.

# Tri du catalogue des tricks

- Familles Kick → Slide → Air conservées, avec les cartes classées par score croissant dans chaque famille. Tri vérifié sur les 24 cartes et dans le navigateur.

# Difficulté et équité des NPC

- Trois niveaux : Détente, Normal par défaut, Expert. Choix en début de session locale ou en ligne, sauvegardé et visible avec les NPC. Les anciennes sauvegardes sans niveau reprennent en Normal.
- Normal et Détente conservent la carte engagée après le jet, sécurisent un premier essai et visent le meneur au deuxième. Recherche moins profonde et choix variés parmi des options proches ; Expert conserve l’optimisation complète et le remplacement de carte avec le même jet.
- Aucun changement des règles, dés, scores, réserves ou récompenses. Le contrôleur ne reçoit plus que ses informations visibles et les offres publiques. Tests d’égalité exacte des jets humains/NPC, d’absence d’accès au hasard et de débit effectif des bonus.
- Compteur « Utilisés » pendant l’essai pour rendre visibles les dépenses de jetons, même lorsque des récompenses reconstituent la réserve.
- 149 tests réussis et audit de 600 parties, soit 28 800 essais : scores de 18+ sur 3,9 % des essais NPC normaux contre 24,8 % en Expert. Score moyen 9,46 contre 13,40. Les NPC normaux dépensent en moyenne 13,54 jetons par partie ; stocks et tirages contrôlés sans anomalie.
- Mesures contre une référence heuristique fixe, sans prétendre représenter tous les niveaux humains. Vérification en navigateur du choix Normal et du compteur de jetons ; captures dans `tests/screenshots/npc-difficulty-verified.png` et `tests/screenshots/npc-token-use-verified.png`.

# Statistiques du bilan final

- Durée de jeu, chutes, séquences de trois tricks, jetons gagnés et dépensés pour chaque joueur. Détail des trois types de jetons et export JSON enrichi avec `summary`.
- Gains comptés à leur attribution réelle, hors réserve de départ ; dépenses conservées en cas de chute. Les essais archivés, commandes refusées et requêtes réseau dupliquées ne doublent pas les compteurs.
- Chronomètre conservé après reprise et figé au dernier bilan : pauses et interruptions entre sessions exclues, calcul commun côté serveur en ligne. Une erreur de sauvegarde restaure aussi les statistiques et l’état du chronomètre ; une pause NPC automatique arrête sa mesure.
- Anciennes sauvegardes compatibles, avec indication des durées et historiques de jetons incomplets.
- 140 tests réussis, dont 12 nouveaux cas. Vérification d’une partie de six modules contre un journal indépendant, puis d’une partie à quatre joueurs dans le navigateur et de son export JSON.

# Suivi des tours et cartes agrandies

- La table suit automatiquement le joueur actif, puis revient au joueur humain à son tour. Une sélection manuelle reste fixe pendant la pause NPC ; reprendre le NPC réactive le suivi. Hors pause, la prochaine action de jeu rétablit le suivi, sans déplacement lors des actualisations réseau inchangées.
- Clic, Entrée ou Espace sur une carte engagée, réussie ou conservée : agrandissement avec ses dés, son score et son effet. Les dés archivés et la couleur du propriétaire restent exacts même si la partie avance en ligne. Fermer ou Échap revient à la table.
- Le clic pour poser des dés sélectionnés sur la carte active reste disponible. Les sélections de dés sont effacées lors d’un changement de table.
- 128 tests réussis. Vérification en navigateur du suivi du NPC, de la consultation en pause, de la reprise, du retour au tour humain, du placement au clic et de l’agrandissement au clavier ; capture `tests/screenshots/played-card-zoom-verified.png`.

# Consultation des joueurs et stratégie des NPC

- Joueurs cliquables dans le bandeau : main complète, dés, jetons, tricks en cours et séquences conservées du joueur choisi. Retour à sa table obligatoire pour agir ; carte engagée conservée pendant la consultation. Compatible solo et en ligne.
- Mains et tables publiques dans les vues réseau ; offres non choisies, pioche, état aléatoire et codes d’accès toujours privés.
- Recherche de séquences jusqu’à trois tricks, prise en compte du coût en dés, des types obligatoires et des bonus du module. Choix des dés pour garder un joker ou un gel utile ; remplacement d’une carte non validée avec le même jet.
- Deuxième essai orienté vers le meilleur score adverse +1, les trois tricks ou les jetons de fin de module, en tenant compte du premier essai déjà protégé. Draft guidé par les six modules visibles et les jetons disponibles.
- 122 tests réussis, dont 14 nouveaux cas et les 100 parties avec sauvegarde/reprise. Comparaison sur 100 duels : 494 séquences de trois tricks contre 100 et 3,7 % de chutes contre 15,9 % pour l’ancien contrôleur. Contrôleurs heuristiques, sans garantie d’optimalité.
- Vérification en navigateur : main adverse, tricks conservés avec leurs dés, actions bloquées en consultation, retour à la carte engagée, écran sans défilement à 1280 × 720.

# Compétition en ligne hébergée par l’hôte

- Création d’un salon de deux à quatre joueurs, invitation Internet et remplacement d’un NPC par un ami. Choix de skater avant le départ ; reprise de la main, des dés, des jetons et du score du NPC si la partie est déjà lancée.
- Serveur autoritaire utilisant les mêmes règles, authentification par siège, commandes datées par révision et dédoublonnées, générateur aléatoire cryptographique. Les invités ne reçoivent ni pioche cachée ni état du générateur.
- Sauvegarde atomique sur le disque de l’hôte à chaque action acceptée, restauration des joueurs et des scores, reconnexion automatique et code privé de reprise si le lien change. Les sauvegardes solo restent indépendantes.
- Lien temporaire Cloudflare activable depuis le salon, installation officielle vérifiée sous Windows, arrêt explicite du partage. L’ordinateur de l’hôte doit rester allumé. Les fichiers de sauvegarde et l’outil sont exclus de Git.
- 108 tests, dont 11 tests réseau et une partie complète à quatre joueurs. Essai dans deux navigateurs, l’un via le lien public : draft commun, jet de dés, placement, score identique et reprise après redémarrage.

# Collection de cartes au menu

- Bouton « Voir les cartes » au menu et accès identique depuis « Cartes » en partie. Choix de la famille Tricks / Skateparks, puis du paquet, avant l’affichage.
- Paquet Tricks de base : les 24 cartes complètes, regroupées Kick / Slide / Air, quantités dans la pioche, agrandissement et probabilités détaillées. Paquet Le Lagon : les 12 cartes de modules et leur inspection.
- Navigation entre familles, paquets, cartes et retour à la partie sans modifier son état. Présentation adaptée aux écrans étroits.

# Le Lagon : 12 cartes de modules et parcours visible

- Douze illustrations originales du même skatepark côtier, avec cadre crème, bleu marine, orange et vagues turquoise. Titres, symboles, manches autorisées, PV et conditions de bonus sont rendus depuis les règles. Catalogue dans le jeu et planche `/modules.html`.
- Tirage unique dès la création : 2 cartes de découverte pour les manches 1–2, 3 intermédiaires pour les manches 3–5 et 1 finale pour la manche 6. Aucun doublon, même parcours pour tous, sauvegardé et visible pendant toute la session. Aperçu agrandi au survol et au clavier, ouverture au clic.
- Aucun minimum : le meilleur essai conservé remporte les PV, avec totalité aux ex æquo et aucun PV si tous les essais valent zéro. Bonus facultatif de +2 points propre à chaque module, une fois par essai, cumulable et perdu en cas de chute. Score réel, aperçu, NPC et bilans utilisent le même calcul.
- Sauvegarde v9 et règles v14 ; nouvelle session nécessaire. Les anciennes sauvegardes restent stockées.
- 97 tests, 2 000 tirages contrôlés et 100 parties simulées de six manches avec reprise à chaque transition. Contrôle visuel du catalogue, du parcours et de l’agrandissement dans le navigateur.

# Gel maintenu après Continuer

- Un dé libre conserve son gel sur toute la séquence, même s’il a déjà évité un lancer ou une relance. Valider une autre carte et continuer ne le dégèlent plus.
- Le gel est retiré quand le dé est utilisé sur une carte validée, à l’arrêt ou à la chute. Le dé gelé n’anime plus un faux lancer.
- Probabilités et NPC tiennent compte des dés déjà gelés et ne dépensent pas un second jeton sur le même dé. Sauvegardes existantes compatibles ; 86 tests.

# Gel conservé entre deux tricks

- Un gel appliqué pendant un jet ne disparaît plus quand la carte est validée avec d’autres dés avant le prochain lancer.
- Le dé libre conserve sa face au lancer du trick suivant ; les relances du trick restent protégées. Les gels déjà utilisés expirent à la validation, et les dés validés ne peuvent pas être emportés.
- Consignes adaptées et 85 tests, dont la régression reproduite avant correction et la sauvegarde/reprise entre tricks.

# Jetons de séquence et nouvelles cartes à récompense

- Trois tricks réussis : +1 point conservé et un jeton ±1, relance ou gel au choix. Le tour attend ce choix ; le jeton est crédité une seule fois, avec sauvegarde et contrôleur NPC.
- Six cartes à récompense, deux par type de trick et deux par type de jeton : Inward Heelflip / 360° (±1), Feeble Grind / 720° (relance), Hardflip / Lipslide (gel). Maximum un gain par type et par module pour les cartes.
- Compteurs, troisième emplacement, choix sur la table, archives, récapitulatif et règles adaptés. Les combinaisons, points et minimums restent identiques.
- Sauvegarde v8 ; règles v13. Comparaison de 1 000 parties avant et 1 000 après avec les mêmes graines et profils.

# Six skaters et étoile personnelle

- Choix initial entre Néo bleu, Ruby rouge, Jade verte, Sol jaune, Milo orange et Iris mauve ; six portraits générés dans le style Lagoon Park. Les NPC prennent des skaters restants et leur couleur.
- Six dés colorés, face 1 remplacée par ★. Seule l’étoile du dé personnel est joker ; 2 → ★ reste accessible avec −1 et ★ → 2 avec +1.
- Placement manuel, Auto, NPC, gel, remise en main et archives utilisent la même résolution du joker. Valeur attribuée visible sur la carte.
- Probabilités exactes recalculées avec le dé personnel disponible ou déjà bloqué.
- Sauvegarde v7 et 76 tests validés, dont l’énumération indépendante des combinaisons et les parties complètes.

# Retouche Lipslide et contrôles de séquence

- Lipslide : illustration corrigée avec deux essieux et quatre roues, dans le style existant.
- +1 annoncé sur le troisième emplacement ; score validé et projection avec la carte active visibles pendant l’essai.
- Gel utilisable pendant un jet, avant une relance ; plusieurs jetons peuvent protéger plusieurs dés.
- Reprendre la carte : retour de la carte non validée et de ses dés, sans changer leurs faces ni rembourser les bonus.
- Suppression de l’atelier des six cartes ; calculateur commun des probabilités conservé sous `scripts/dice-probability.mjs`.
- Sauvegarde v6 ; 68 tests passent, dont les parties complètes et la reprise déterministe.

# Gel persistant, points de séquence et draft carte + jeton

- Un gel couvre le trick suivant et toutes ses relances, puis expire à sa validation ou à la fin de l’essai.
- Trois tricks validés : +1 point de séquence, affiché dans les résultats et archives.
- Chaque carte à trois dés reçoit +1 supplémentaire, déjà inclus dans son score affiché.
- Draft entre modules : N cartes et N jetons aléatoires, un choix de chaque obligatoire par joueur, confirmation commune et aucun reste. Ordre du moins bon au meilleur conservé.
- NPC, sauvegarde v5, règles affichées et tests adaptés.

# Combinaisons diversifiées et barème équilibré

- Combinaisons proposées conservées : seuils, parités, suites, valeurs exactes, paires et carré libre.
- Points resserrés de 2 à 16 ; Air : 3 / 6 / 8 / 10 / 13 / 16. Bonus des cartes inchangés.
- Minimums intermédiaires : 7 ; finales : grande ligne 10, ligne street 10, parcours libre 11, grande rampe 9. PV inchangés.
- Probabilités recalculées, emplacements compatibles avec les alternatives de combinaison ; NPC capables de choisir un dé à geler adapté au prochain trick.
- 75 tests validés ; comparaisons de barèmes reproductibles et 2 000 parties pour le réglage retenu.
- Sauvegarde v4 indépendante : les anciennes parties restent stockées, sans reprise sous le nouveau barème.

# Draft commun, main visible et types obligatoires

- Six cartes obligatoires au draft initial ; aucun bonus ni option de passer.
- Cartes de la main entièrement visibles pendant tous les drafts et récapitulatifs.
- Entre modules : N cartes et un jeton au centre, un choix par joueur, du moins bon au meilleur essai ; égalités départagées dans l’ordre de tour précédent, élément restant défaussé.
- Suppression des récompenses automatiques de module ; rotation du premier joueur après le draft.
- Relance de tous les dés non validés, avec probabilités de bonus recalculées.
- Modules à deux types : second trick du type manquant, encaissement après les deux, chute si impossible ; modules à trois types inchangés.
- Cartes de type interdit grisées et animation de refus. Sauvegarde v3.

# Essais alternés, gel et draft partagé

- Ordre aléatoire de tous les joueurs au départ, rotation du premier au dernier après chaque module.
- Premier essai de chacun, puis deuxième ; points de manche et des deux essais visibles en haut.
- Main triée Kick / Slide / Air, remplacement de la carte engagée avant le jet.
- Jeton de gel cumulable : conserve un dé libre au prochain lancer et engage immédiatement la suite.
- Draft visible pour tous : trois cartes, un bonus aléatoire ou passer, historique des choix et récapitulatif.
- Sauvegarde v2, 62 tests et 100 parties de quatre joueurs simulées sans blocage.

# Partie compétitive — NPC, classement et jetons

- Un à trois NPC réglables, trois par défaut, avec les mêmes règles et une pioche commune de 72 cartes.
- Contrôleurs séparés du moteur de commandes, joueur actif validé et reprise déterministe des jets.
- Récapitulatif après chaque module, classement au meilleur essai complet, barres des deux essais et PV animés.
- Seuls les meilleurs joueurs atteignant le minimum gagnent les PV ; égalité : mêmes PV pour chaque gagnant.
- Scores de partie et progression du parcours visibles sur la table.
- Jetons ±1 / ↻ empilés, cumul sans plafond et plusieurs utilisations possibles dans un même essai.
- Sauvegarde compétitive séparée, 55 tests et simulation de 100 parties à quatre joueurs.

# Habillage des planches originales

- Réutilisation des cartes complètes, avec titres et personnages entiers, cadre crème et vagues turquoise.
- Remplacement des anciennes valeurs imprimées par les combinaisons, scores et bonus actuels ; symboles conservés.
- Même habillage pour les cartes en main, engagées, conservées et proposées au choix, ainsi que pour les modules.
- Règles et sauvegardes v5 inchangées ; 48 tests réussis et vérification visuelle ordinateur / téléphone.

# Campagne v5 — Cartes illustrées, séquences conservées et bonus

- Images en fond intégral, informations translucides et symboles Kick / Slide / Air.
- Bonus de séquence et gains de bonus sur huit figures ; chute à zéro inchangée.
- Première carte du type du module, y compris au deuxième essai.
- Séquences conservées en petit avec leurs dés figés ; cartes indisponibles jusqu’au module suivant.
- Bonus utilisables dans les deux sens : bonus puis dé, ou dé puis bonus ; limite par essai visible.
- Sauvegarde v5 distincte, 48 tests et 1 000 parties simulées sans blocage.

# Campagne v4 — Table, éventail et conditions souples

- Table de jeu avec module illustré, dés, trois emplacements et commandes intégrées ; en-tête réduit.
- Main complète en éventail, agrandissement au survol et au focus, cartes portrait sans découpe du contenu.
- Cartes déposables sur la table ; dés rangés dans les cases imprimées, y compris en ordre inversé et lors de placements partiels.
- Bornes inclusives ≥ / ≤ sur les figures accessibles ; faces exactes réservées aux figures plus difficiles.
- Points et probabilités recalculés sur les 24 figures ; nouveau barème sauvegardé séparément en v4.
- 41 tests, 1 000 sessions simulées et contrôles du plateau jusqu’à onze cartes en portrait et paysage.

# Campagne v3 — Combinaisons sur toutes les cartes

- Conversion des 24 tricks et 72 exemplaires, avec points croissants selon la difficulté sans bonus.
- Nouveau tour intégré au parcours : une carte avant chaque jet, dés bloqués, arrêter ou continuer, trois tricks maximum et chute à zéro.
- Deux essais par module, meilleur score pour les PV ; arrêter sous l’objectif conserve les points.
- Bonus ±1 / relance et récompenses adaptés ; anciens effets de somme, améliorations et points de combo retirés.
- Probabilités dynamiques, catalogue complet, main paginée et glisser-déposer ; sauvegarde v3 distincte.
- Dénombrement indépendant sur tous les jets de six dés pour les 24 figures, tests de règles et 1 000 sessions complètes simulées sans blocage.
- Plateau vérifié sur ordinateur, téléphone portrait et paysage ; ancien atelier conservé.

# Atelier v2 — Difficulté alignée sur les probabilités

- Six demandes revues, de pair + impair à 1, 1 et 2 ; points croissants de 2 à 14.
- Ordre de difficulté vérifié exactement pour deux à six dés avec toutes les réserves de bonus.
- Pourcentages sans bonus affichés selon les dés disponibles, tableau complet dans les règles.
- Nouvelle sauvegarde pour conserver séparément les résultats de l'ancien barème.
- Nouvelles simulations et tests de cohérence des probabilités affichées.

# Expérience — Six cartes et prise de risque

- Atelier séparé accessible depuis l'accueil : combinaisons de dés à la place des additions.
- Carte engagée avant chaque jet, première carte conforme à un type du module, dés réussis bloqués.
- Arrêter ou continuer jusqu'à trois tricks ; chute à zéro pour tout le tour.
- Un bonus ±1 et une relance par tour, utilisables avant validation ou chute.
- Tests de règles, probabilités exactes et 240 000 tours simulés ; résultats et hypothèses dans le README.

# En développement — Plateau compact et glisser-déposer

- Plateau ajusté à la hauteur de la fenêtre, répertoire paginé et dispositions ordinateur, téléphone et paysage.
- Cartes déplaçables vers le combo, entre ses emplacements et vers le répertoire ; remplacement par dépôt.
- Dés déplaçables seuls ou en groupe vers un trick ou la réserve, avec surbrillance des destinations et annulation.
- Clics existants, sauvegarde et règles conservés ; tests des transitions de déplacement.
- Démarrage local avec `npm start`, sans dépendance supplémentaire.

# v0.1.0 — Première session solo

- Menu principal Lagoon Park, création et reprise de partie.
- Repêchage de départ, six cartes, doublons et collection de 72 exemplaires.
- Parcours visible de quatre ou six modules et deux essais par obstacle.
- Lancer 6d6, attribution manuelle ou automatique, bonus et amélioration.
- Blocage des cartes réussies, récupération intégrale sur échec.
- Attribution des PV solo, progression, repêchage, bilan final et export.
- Sauvegarde automatique locale.
- Premiers tests automatisés et déploiement GitHub Pages.

À venir : retours sur le feel, équilibrage des points, illustrations définitives, adversaires et multijoueur.
