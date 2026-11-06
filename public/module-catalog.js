// Approved simple park effects; each card has exactly one effect.
export const MODULE_DEFINITIONS=[
 {id:0,key:'ilot',name:'L’Îlot',stage:0,needs:['kick'],pv:2,bonus:{kind:'base',points:1},condition:'Chaque carte Base rapporte +1 point.'},
 {id:1,key:'quai-bas',name:'Le Quai bas',stage:0,needs:['slide'],pv:2,bonus:{kind:'favored',type:'kick',points:1},condition:'Chaque Kick rapporte +1 point.'},
 {id:2,key:'petite-vague',name:'La Petite Vague',stage:0,needs:['air'],pv:2,bonus:{kind:'favored',type:'slide',points:1},condition:'Chaque Slide rapporte +1 point.'},
 {id:3,key:'rail-palmiers',name:'Le Rail des Palmiers',stage:0,needs:[],pv:2,bonus:{kind:'signature',points:2},condition:'Utiliser son dé personnel rapporte +2 points, une fois par essai.'},
 {id:4,key:'retour-rail',name:'Le Retour du Rail',stage:1,needs:['slide','kick'],pv:3,bonus:{kind:'favored',type:'air',points:1},condition:'Chaque Air rapporte +1 point.'},
 {id:5,key:'tour-ilot',name:'Le Tour de l’Îlot',stage:1,needs:['air','kick'],pv:3,bonus:{kind:'stars',points:1},condition:'Chaque étoile physique utilisée rapporte +1 point.'},
 {id:6,key:'coping-bleu',name:'Le Coping Bleu',stage:2,needs:['air','slide'],pv:4,bonus:{kind:'amplitude',minimumDice:3,points:2},condition:'Chaque trick utilisant 3 ou 4 dés rapporte +2 points.'},
 {id:7,key:'double-quai',name:'Le Double Quai',stage:1,needs:['slide'],pv:3,bonus:{kind:'recovery',tokens:1},condition:'Encaisser exactement deux tricks donne un jeton au choix.'},
 {id:8,key:'boucle-lagon',name:'La Boucle du Lagon',stage:2,needs:[],pv:4,bonus:{kind:'three-score',points:2},condition:'Le bonus de trois tricks réussis vaut +2 points au lieu de +1 ; le jeton habituel est conservé.'},
 {id:9,key:'marches-palmiers',name:'Les Marches des Palmiers',stage:2,needs:['kick','slide'],pv:4,bonus:{kind:'three-score',points:2},condition:'Le bonus de trois tricks réussis vaut +2 points au lieu de +1 ; le jeton habituel est conservé.'},
 {id:10,key:'embruns',name:'Les Embruns',stage:1,needs:[],pv:3,bonus:{kind:'three-tokens',tokens:2},condition:'Trois tricks réussis donnent deux jetons au choix au lieu d’un ; le bonus habituel de +1 point est conservé.'},
 {id:11,key:'grande-vague',name:'La Grande Vague',stage:2,needs:['air'],pv:4,bonus:{kind:'amplitude',minimumDice:3,points:2},condition:'Chaque trick utilisant 3 ou 4 dés rapporte +2 points.'}
];
