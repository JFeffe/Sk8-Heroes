export const TIER_NAMES={base:'Base',advanced:'Avancée',epic:'Épique'};
export const TIER_ORDER={base:0,advanced:1,epic:2};
export const trickKey=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/°/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const definitions={
 high2:[['≥2','≥2'],'Deux dés ≥ 2'],double:[['x','x'],'Deux dés identiques'],mixed:[['P','I'],'Un pair et un impair'],oddGap:[['A','B'],'Écart ≥ 2 · au moins un impair'],
 straight2:[['x','x+1'],'Deux valeurs consécutives'],high4:[['≥4','≥4'],'Deux dés ≥ 4'],extremes:[['≤2','≥5'],'Un dé ≤ 2 et un dé ≥ 5'],oddDistinct:[['I','≠I'],'Deux impairs différents'],
 bands3:[['1–2','3–4','5–6'],'Un dé de chaque tranche'],even3:[['2·4·6','2·4·6','2·4·6'],'Trois pairs · doublons permis'],high5:[['≥5','≥5'],'Deux dés ≥ 5'],
 straight3:[['x','x+1','x+2'],'Trois valeurs consécutives'],exact36:[[3,6],'Un 3 et un 6'],double4:[[4,4],'Deux 4'],exact446:[[4,4,6],'Deux 4 et un 6'],exact666:[[6,6,6],'Trois 6'],
 low5:[['≤5','≤5'],'Deux dés ≤ 5'],largeGap:[['A','B'],'Écart ≥ 3'],doubleLow:[['x','x'],'Une paire de 1 à 5'],gap2:[['x','x+2'],'Exactement 2 valeurs d’écart'],evenDistinct:[['P','≠P'],'Deux pairs différents'],
 odd3:[['1·3·5','1·3·5','1·3·5'],'Trois impairs · doublons permis'],low2:[['≤2','≤2'],'Deux dés ≤ 2'],exact25:[[2,5],'Un 2 et un 5'],high5three:[['≥5','≥5','≥5'],'Trois dés ≥ 5'],
 exact366:[[3,6,6],'Un 3 et deux 6'],exact2345:[[2,3,4,5],'Un 2, un 3, un 4 et un 5'],low4:[['≤4','≤4'],'Deux dés ≤ 4'],gap3:[['x','x+3'],'Deux valeurs d’écart 3'],
 parityRun3:[['1/2','3/4','5/6'],'1·3·5 ou 2·4·6'],highPairs4:[['A','A','B','B'],'Deux paires distinctes · 4, 5 ou 6'],fourKind:[['x','x','x','x'],'Quatre dés identiques']
};
export function presentation(code){const pair=definitions[code];if(!pair)throw Error('Combinaison inconnue : '+code);return {symbols:pair[0].map(String),rule:pair[1]};}
export function socketLayout(cost){const size=cost===2?128:cost===3?116:106,gap=cost===2?42:cost===3?32:18,start=321-(cost*size+(cost-1)*gap)/2;return Array.from({length:cost},(_,i)=>({x:start+i*(size+gap),y:1025,width:size,height:96}));}
export const lowerTierCards=(deck,level)=>deck.filter(c=>TIER_ORDER[c.tier]<level);
export const recoveryTier=completedModule=>completedModule===0?'base':completedModule>=3?'epic':'advanced';
