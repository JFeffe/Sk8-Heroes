export const APP_VERSION='0.5.5';
export const RELEASE_NOTES=[{version:APP_VERSION,date:'2026-11-04',changes:[
 'Réserve limitée à trois jetons par type et par joueur. Un compteur indique le stock sur trois.',
 'Les récompenses et le draft tiennent compte de la place disponible. Les jetons excédentaires retournent à la banque.'
]},{version:'0.5.4',date:'2026-11-04',changes:[
 'Le deuxième meilleur score distinct rapporte 1 PV. Les ex æquo reçoivent chacun les PV de leur place.',
 'Les cartes des 12 modules affichent les deux récompenses. Le bilan anime tous les PV gagnés.'
]},{version:'0.5.3',date:'2026-11-02',changes:[
 'Normal et Détente plus accessibles : anticipation des points limitée et choix de cartes moins optimisés.',
 'Les NPC de ces niveaux gardent davantage leurs bonus. Les objectifs de score et de gain net de jetons restent respectés, dès le premier essai.',
 'Expert conserve son comportement. Points, dés, récompenses et règles restent identiques pour tous ; parties actuelles compatibles.'
]},{version:'0.5.2',date:'2026-11-02',changes:[
 'NPC : dès le premier essai, une séquence vise le meilleur score connu ou un gain net de jetons. Un petit score sans intérêt ne suffit plus.',
 'Les dépenses ±1, relance et gel sont évaluées avant utilisation, avec les jetons déjà dépensés dans l’essai. Le gel suivi d’une relance compte pour deux jetons.',
 'Cartes à récompense, bonus du module et trois tricks sont pris en compte. Les NPC peuvent passer avant de lancer si aucun objectif utile n’est disponible.',
 'Points, combinaisons et règles conservés ; sauvegardes et salons actuels compatibles.'
]},{version:'0.5.1',date:'2026-11-02',changes:[
 'NPC : le draft tient compte des jetons disponibles, des Épiques et du rôle des cartes dans le parcours visible.',
 'NPC : le risque tient compte des essais restant aux adversaires et de leurs cartes publiques, avec une valeur accrue pour un premier score assuré.',
 'Points, combinaisons, bonus et règles du draft conservés. Sauvegardes et salons actuels compatibles.'
]},{version:'0.5.0',date:'2026-11-02',changes:[
 'Les 12 modules utilisent les effets simples validés : Base, types favorisés, dé personnel, étoiles, Grande amplitude et récompenses de séquence.',
 'Coping Bleu : +2 par trick à 3 ou 4 dés. Double Quai : un jeton au choix en encaissant exactement deux tricks.',
 'Belle sortie donne +2 points de séquence au total ; les Embruns donnent deux jetons à choisir avant le passage automatique au joueur suivant.',
 'Cartes en trois couches et scores en direct actualisés ; aucun minimum général de deux tricks. Draft inchangé : une carte et un jeton par joueur.',
 'Nouvelle partie nécessaire pour ces règles ; les anciennes sauvegardes restent conservées séparément.'
]},{version:'0.4.0',date:'2026-11-01',changes:[
 'Les 12 modules utilisent les nouvelles conditions V3 validées : +2 points par essai conservé, avec au moins deux tricks.',
 'Faces physiques, gel reporté entre tricks, dé personnel, trick sauvé et effets de carte sont vérifiés dans le calcul réel.',
 'Cartes en trois couches, aperçus et NPC utilisent les mêmes conditions mises à jour. Le draft reste à 4 cartes et 4 jetons à quatre joueurs.',
 'Une nouvelle partie applique ces règles. Les anciennes sauvegardes restent conservées séparément.'
]},{version:'0.3.1',date:'2026-11-01',changes:[
 'Draft entre modules : une carte et un jeton par joueur, soit 4 cartes et 4 jetons à quatre joueurs.',
 'Les 12 modules du Lagon assemblent trois couches indépendantes : illustration, cadre et textes/symboles.',
 'Format des cartes harmonisé, titres ajustés et PV alignés dans la collection, le parcours et la table.',
 'Les drafts déjà sauvegardés sont ajustés en conservant toutes les cartes et les choix confirmés.'
]},{version:'0.3.0',date:'2026-11-01',changes:[
 '41 tricks, 85 cartes : Base, Avancés et Épiques, avec les combinaisons et scores validés.',
 'Chaque carte assemble une illustration, un cadre graphique et une couche de textes et symboles, avec des dés alignés à toutes les tailles.',
 'Draft par niveaux : mélange Base/Avancés au départ, puis offres progressives et réserve visible des niveaux précédents.',
 'Les jetons des cartes sont gagnés en fin de module, sans plafond par sorte. Les nouveaux paquets démarrent une nouvelle sauvegarde.'
]},{version:'0.2.1',date:'2026-10-31',changes:[
 'Notes non lues surlignées, mémorisées dans ton navigateur après consultation et fermeture.',
 'Lobby multijoueur : choix simultané des six riders, réservations uniques et couleur liée au personnage.',
 'Carte engagée après le lancer : seuls les dés non confirmés peuvent être repris, pour tous les joueurs et NPC.',
 'Cartes des essais réussis côte à côte avec leurs dés, sans défilement ni duplication de la séquence centrale.'
]},{version:'0.2.0',date:'2026-10-31',changes:[
 'Draft de départ simultané : choisis une carte, passe les deux autres à droite et complète le paquet.',
 'Réserves de jetons, portraits et PV de partie visibles pendant les choix.',
 'Focus libre sur un joueur, avec retour explicite au suivi automatique.',
 'Dés utilisables mis en lumière et animation des lancers et relances.',
 'Boutons de décision centrés, validation du trick plus grande et animée.',
 'Historique des essais agrandi et fenêtres de cartes refermables en cliquant autour.'
]}];
