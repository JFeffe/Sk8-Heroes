// Final shape study: reuse the same obstacles, distinguish the four corners.
import {readFileSync,writeFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,value)=>writeFileSync(new URL(name,import.meta.url),value);
const spec=JSON.parse(read('draft-v6.json'));
const round=n=>Math.round(n*100)/100;
const point=(q,r,a)=>[round(q.center[0]+r*q.sx*Math.cos(a*Math.PI/180)),round(q.center[1]+r*q.sy*Math.sin(a*Math.PI/180))];
const arc=(q,r,a,b)=>`M${point(q,r,a)} A${round(r*q.sx)} ${round(r*q.sy)} 0 ${b-a>180?1:0} 1 ${point(q,r,b)}`;
const ring=(q,r1,r2,a,b)=>`M${point(q,r1,a)} A${round(r1*q.sx)} ${round(r1*q.sy)} 0 0 1 ${point(q,r1,b)} L${point(q,r2,b)} A${round(r2*q.sx)} ${round(r2*q.sy)} 0 0 0 ${point(q,r2,a)} Z`;
const rect=(x,y,w,h,cls,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" ${extra}/>`;
const path=(d,cls)=>`<path d="${d}" class="${cls}"/>`;
const line=(a,b,cls,extra='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${cls}" ${extra}/>`;
const label=(x,y,v,cls='map-label')=>`<text x="${x}" y="${y}" class="${cls}">${v}</text>`;
const dot=(x,y,id)=>`<circle cx="${x}" cy="${y}" r=".75" class="spot-disc"/>`+label(x,y+.25,id,'map-label spot-label');
spec.version=7;
spec.outline='M7 3 C15 -.5 24 2.2 32 2.4 C39 2.4 45 .5 52 1.7 C59 2.6 63 8 62.5 16 C62.5 20 61 22 62 27 C64 35 59 40.5 52 42.3 C44 44.4 38 42.8 32 44 C24 46 13 44 7 40 C1.2 36 .6 30 2 24 C3 20 1 17 2 11 C2.8 7.4 4.4 4.5 7 3 Z';
spec.pockets=spec.pockets.map(q=>({...q,sx:q.id==='QC'?1.03:1,sy:q.id==='QC'?.96:1,angles:q.id==='QC'?[230,400]:q.angles,character:{QA:'Coin bas relié au bank des Dunes',QB:'Quarter des Palmiers et terrasse courbe vers les marches',QC:'Anse du Large, petit bowl ouvert sur le centre',QD:'Coin du Soleil prolongé par un retour en vague'}[q.id]}));
spec.extensions=[{pocket:'QB',kind:'Prolongement droit aux bords ondulés, raccordé au deck des marches'},{pocket:'QD',kind:'Long retour courbe orienté vers le ledge et le centre'}];
spec.designMeaning='Même équipement que le draft 06. Quatre zones distinctes : coin bas et bank A ; terrasse courbe avec marches B ; anse en bowl ouvert C ; retour étiré en vague D. Tabletop recentré de trois unités pour dégager son axe dans les deux sens. Les courbes et les dégagements sont une étude graphique, sans calcul de vitesse ni échelle de construction.';
spec.jumpAxis={from:[22,24],to:[57,24],tabletop:[33.5,21,12,6],purpose:'Approche et sortie rectilignes des deux côtés du grand saut'};
const p=spec.sharedElements.find(e=>e.id==='P');
Object.assign(p,{box:[33.5,21,12,6],launch:[33.5,21,2.5,6],table:[36,21,7,6],landing:[43,21,2.5,6]});
const e=(x,y,type,place)=>({point:[x,y],type,place});
const paths={
 1:'M19 39.5 L19 34.7 C19 31 20.5 29.6 23 29.6 L29.5 29.6 L36 29.6 C39 29.6 40 31.5 43 32 C47 32 52 35 54.5 34 C56 33 54 30.5 50.5 30.5',
 2:'M8.28 7.28 L11.68 10.68 C16 15 18 17 24 17 L31 17 L38 17 C42 17 45 17.5 47 18.5 C50 17 56 14 54.6 10.3 C53 7.8 50.5 11.2 49.5 13.5',
 3:'M55.72 7.28 L52.32 10.68 C49 14 52 24 48 24 L45.5 24 L44.25 24 L43 24 L36 24 L34.75 24 L33.5 24 C31 24 28.5 23 26 23 C21 23 19.5 29.6 23 29.6 L29.5 29.6 L36 29.6',
 4:'M55.72 36.72 L52.32 33.32 C50 31 53 24 48 24 L45.5 24 L44.25 24 L43 24 L36 24 L34.75 24 L33.5 24 C31 24 29 22 26 22 C22 22 20 25 23 29.6 L29.5 29.6 L36 29.6',
 5:'M19 39.5 L19 34.7 C19 31 20.5 29.6 23 29.6 L29.5 29.6 L36 29.6 C40 29.6 51 24 48 24 L45.5 24 L44.25 24 L43 24 L36 24 L33.5 24 C30 24 28 23 26 23',
 6:'M19 39.5 L19 34.7 C19 29 17 25 18 22 C19 18 21 17 24 17 L31 17 L38 17 C42 17 47 13 53.2 8.4 C55 6 49 6.4 46 11',
 7:'M8.28 7.28 C10.1 5.45 12.3 4.5 15 4.5 L22 4.5 L27 4.5 L27 7 L27 8.8 L27 10.6 C27 14 21 17 24 17 L31 17 L38 17 C44 17 52 24 48 24 L45.5 24 L44.25 24 L43 24 L36 24 L33.5 24',
 8:'M8.28 7.28 L11.68 10.68 C17 16 25 24 30 24 L33.5 24 L34.75 24 L36 24 L43 24 L45.5 24 L48 24 C52 24 55.8 27 55.8 30 C55.8 33.76 52.76 36.8 49 36.8 C45 36.8 43.4 35.7 40.6 35 C37 34 39.5 29.6 36 29.6 L29.5 29.6 L23 29.6 C20 29.6 20 25 21 23',
 9:'M55.72 7.28 L52.32 10.68 C49 14 46 16 43 16 C41 16 40 17 38 17 L31 17 L24 17 C19 17 16 12 10.2 9.2 C7 7.1 7.8 12.5 12 14.5',
 10:'M55.72 36.72 L52.32 33.32 C50 31 53 21.2 48 21.2 L45.5 21.2 L39.5 21.2 L33.5 21.2 C30 21.2 28 21 26 21 C21 21 16 12 10.2 9.2 C7 7.1 7.8 12.5 12 14.5',
 11:'M55.72 7.28 L52.32 10.68 C48 15 43 17 38 17 L31 17 L24 17 C18 17 8.2 19 8.2 14 C8.2 10.24 11.24 7.2 15 7.2 C21 7.2 23 10 25 12 C28 15 22 24 25.5 24 L33.5 24 L36 24 L39.5 24 L43 24 L45.5 24 L56 24',
 12:'M55.72 36.72 L52.32 33.32 C52 29 53 22 51 19 C49 17 44 17 38 17 L31 17 L24 17 C17 17 8.2 19 8.2 14 C8.2 10.24 11.24 7.2 15 7.2 C19 7.2 22 12 24 12 L30 12 C37 12 43 18 49 19 C53 20.5 55 21.2 57 21.2 C62 21.2 62 24 57 24 L45.5 24 L43 24 L39.5 24 L36 24 L33.5 24 L22 24'
};
const events={
 3:[e(44.25,24,'Air','Bank du tabletop P'),e(26,23,'Kick','Flat'),e(29.5,29.6,'Slide','Ledge L')],
 4:[e(44.25,24,'Air','Bank du tabletop P'),e(26,22,'Kick','Flat'),e(29.5,29.6,'Slide','Ledge L')],
 5:[e(29.5,29.6,'Slide','Ledge L'),e(44.25,24,'Air','Bank du tabletop P'),e(26,23,'Kick','Flat')],
 7:[e(27,8.8,'Kick','Escalier M'),e(31,17,'Slide','Rail R'),e(44.25,24,'Air','Bank du tabletop P')],
 8:[e(34.75,24,'Air','Bank du tabletop P'),e(29.5,29.6,'Slide','Ledge L'),e(21,23,'Kick','Flat')],
 10:[e(39.5,21.2,'Slide','Bord du tabletop P'),e(26,21,'Kick','Flat'),e(10.2,9.2,'Air','Quarter QB')],
 11:[e(31,17,'Slide','Rail R'),e(25.5,24,'Kick','Flat'),e(39.5,24,'Air','Grand saut P')],
 12:[e(31,17,'Slide','Rail R'),e(30,12,'Kick','Flat'),e(39.5,24,'Air','Grand saut P')]
};
spec.cards.forEach(c=>{c.path=paths[c.id];if(events[c.id])c.events=events[c.id];});
let base=path('M0 -5H64V-2Q48 0 32 -2T0 -2Z','sea')+path('M0 -2Q16 -4 32 -2T64 -2','shore')+path('M4 1Q13 -1 25 .5 M39 .2Q52 -.8 61 4','walk');
for(const [x,y]of [[2,7],[14,.2],[27,.6],[42,.2],[60,5],[63,31],[3,36],[11,44],[51,44]])base+=`<circle cx="${x}" cy="${y}" r=".8" class="tree"/>`;
base+=path(spec.outline,'floor');
// The flight axis is a planning mark, not another obstacle.
base+=rect(22,22.85,35,2.3,'jump-axis');
for(const q of spec.pockets){const [a,b]=q.angles;
 base+=path(ring(q,10.2,8.5,a,b),'deck')+path(ring(q,8.5,5.5,a,b),'quarter');
 for(const r of [6.1,6.8,7.5,8])base+=path(arc(q,r,a,b),'contour');
 base+=path(arc(q,8.5,a,b),'coping')+path(arc(q,5.5,a,b),'toe');
 for(const angle of [a+18,(a+b)/2,b-18])base+=line(point(q,7.8,angle),point(q,5.8,angle),'slope','marker-end="url(#slope-arrow)"');
 base+=label(q.center[0],q.center[1]+.3,q.id,'map-label quarter-label');
}
// A: low bank with a softer outer deck.
base+=path('M15 38.5H23 C24 39 23.5 40.8 22.2 40.8 L16 40.7 Q15 40.7 15 40.2Z','deck')+rect(15,35.5,8,3,'bank')+line([15,38.5],[23,38.5],'bank-top')+line([19,38],[19,35.8],'slope','marker-end="url(#slope-arrow)"');
// B: continuous quarter extension and rounded stair terrace.
base+=path('M15 3.8 C17 3.4 20 3.9 22 3.8 L22 5.5 C20 5 17 5.5 15 5.5Z','deck');
base+=path('M15 5.5 C17 5.5 20 5 22 5.5 L22 8.5 C20 8 17 8.5 15 8.5Z','quarter');
base+=path('M15 5.5 C17 5.5 20 5 22 5.5','coping')+path('M15 8.5 C17 8.5 20 8 22 8.5','toe');
for(const y of [6,6.5,7.2,7.9])base+=path(`M15 ${y} C17 ${y} 20 ${y-.5} 22 ${y}`,'contour');
base+=line([18.5,5.8],[18.5,8],'slope','marker-end="url(#slope-arrow)"');
base+=path('M22 3.8 C25 3.2 27 3.4 29.5 3.8 C32 3.7 33.7 4.6 33 7 H22Z','deck');
base+=rect(25,7,4,3.6,'steps')+rect(24.4,7,.45,3.6,'pad')+rect(30.5,7,2.5,3.6,'bank');
for(let i=0;i<=4;i++)base+=line([25,7+i*.9],[29,7+i*.9],'step-edge');
base+=line([29.6,7],[29.6,10.6],'rail');for(const y of [7,8.8,10.6])base+=`<circle cx="29.6" cy="${y}" r=".1" class="support"/>`;
base+=line([31.75,7.4],[31.75,10.2],'slope','marker-end="url(#slope-arrow)"');
// D: longer sweep that bends back towards the ledge and the flat.
base+=path('M49 38.5 C44.5 38.5 42.5 37.6 39 36.7 L37.6 38.1 C40.5 39.4 44 40.2 49 40.2Z','deck');
base+=path('M49 38.5 C44.5 38.5 42.5 37.6 39 36.7 L41 33.7 C43 34.6 45.5 35.5 49 35.5Z','quarter');
base+=path('M49 38.5 C44.5 38.5 42.5 37.6 39 36.7','coping')+path('M49 35.5 C45.5 35.5 43 34.6 41 33.7','toe');
for(const t of [.2,.43,.67,.84]){const y=38.5-3*t;const x=39+2*t;base+=path(`M49 ${round(y)} C${44.5+t} ${round(y)} ${42.5+.5*t} ${round(37.6-3*t)} ${round(x)} ${round(36.7-3*t)}`,'contour');}
base+=line([44.4,37.9],[45,35.5],'slope','marker-end="url(#slope-arrow)"');
// Shared street objects, with the tabletop shifted west for two clear approaches.
base+=line([24,17],[38,17],'rail');for(let i=0;i<5;i++)base+=`<circle cx="${24+i*3.5}" cy="17" r=".11" class="support"/>`;
base+=rect(23,29,13,1.2,'pad','rx=".16"')+rect(23.13,29.13,12.74,.94,'padtop','rx=".12"');
base+=rect(33.5,21,12,6,'pad')+rect(33.5,21,2.5,6,'bank')+rect(43,21,2.5,6,'bank')+rect(36,21,7,6,'padtop');
base+=line([33.5,21.2],[45.5,21.2],'grind-edge')+line([33.8,24],[35.7,24],'slope','marker-end="url(#slope-arrow)"')+line([45.2,24],[43.3,24],'slope','marker-end="url(#slope-arrow)"');
base+=line([36.2,24],[42.8,24],'flight-line')+label(39.5,22.9,'TABLETOP','map-label jump-label');
base+=dot(31,14.5,'R')+dot(29.5,32,'L')+dot(40,29.5,'P')+dot(34.5,8.8,'M');
base+=label(23,20.7,'FLAT','map-label flat-label')+label(31,37.5,'FLAT','map-label flat-label')+label(32,-3.5,'PLAGE / MER','map-label sea-label');
for(const st of spec.starts)base+=`<circle cx="${st.point[0]}" cy="${st.point[1]}" r="1" class="start-disc"/>`+label(st.point[0],st.point[1]+.32,st.id,'start-text');
base+=path('M32 47V44.5m-.4.6.4-.6.4.6','slope');
const oldSvg=read('park-stairs-jump-plan-v6.svg'),defs=oldSvg.match(/<defs>[\s\S]*?<\/defs>/)[0],css=oldSvg.match(/<style>([\s\S]*?)<\/style>/)[1]+'.jump-axis{fill:#204e5b;fill-opacity:.035;stroke:none}';
const txt=(x,y,v,size=17,weight=400)=>`<text x="${x}" y="${y}" fill="#204e5b" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}">${v}</text>`;
let plan=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1320" viewBox="0 0 1800 1320">${defs}<style>${css}</style><rect width="1800" height="1320" fill="#fffdf5"/>${txt(60,60,'LE LAGON — UNE FORME, QUATRE AMBIANCES',31,700)}${txt(60,93,'DRAFT 07 · PLAN DE DESSUS · ANSE OUVERTE, TERRASSES COURBES ET RETOUR EN VAGUE',16)}<g transform="translate(65 235) scale(18.2)">${base}</g>`;
plan+=txt(1295,175,'A — LES DUNES',22,700)+txt(1295,212,'Coin bas et départ par bank droit.',16)+txt(1295,242,'Plateforme aux contours adoucis.',16);
plan+=txt(1295,315,'B — LES PALMIERS',22,700)+txt(1295,352,'Terrasse courbe reliée aux quatre marches.',16)+txt(1295,382,'Main courante, hubba et bank adjacent.',16);
plan+=txt(1295,455,'C — L’ANSE DU LARGE',22,700)+txt(1295,492,'Petit bowl ouvert sur le centre du park.',16)+txt(1295,522,'Courbe plus enveloppante et légèrement ovale.',16);
plan+=txt(1295,595,'D — LE RETOUR DU SOLEIL',22,700)+txt(1295,632,'Quarter étiré en une longue vague.',16)+txt(1295,662,'La sortie revient vers le ledge et le flat.',16);
plan+=txt(1295,750,'P — LA GRANDE VAGUE',22,700)+txt(1295,787,'Tabletop recentré, axe dégagé des deux côtés.',16)+txt(1295,817,'Élan, saut et sortie dans le même alignement.',16)+txt(1295,847,'R — Rail bas · L — Ledge long · M — Marches',16);
plan+=txt(1295,935,'12 CARTES / MÊMES ÉQUIPEMENTS',20,700)+txt(1295,975,'4 cartes niveaux 1–2',17)+txt(1295,1007,'6 cartes niveaux 3–5',17)+txt(1295,1039,'2 cartes niveau 6',17)+txt(1295,1092,'08 — Retour en vague par D',17)+txt(1295,1124,'11 / 12 — Approches du grand saut',17);
plan+=txt(60,1190,'Les coins ont des formes distinctes. Les mêmes départs et équipements restent partagés entre plusieurs cartes.',16)+txt(60,1222,'La bande discrète au sol indique l’axe d’approche et de sortie du grand saut ; ce n’est pas un obstacle.',16)+txt(60,1278,'Étude pour le jeu · géométrie et lignes indicatives · sans échelle de construction ni calcul de vitesse.',15)+'</svg>';
write('park-organic-plan-v7.svg',plan);
function route(c){let s=path(c.path,'route-halo')+path(c.path,'route');c.events.forEach((ev,i)=>{s+=`<circle cx="${ev.point[0]}" cy="${ev.point[1]}" r="1.05" class="event"/>`+label(ev.point[0],ev.point[1]+.3,i+1,'event-label');});if(c.carve)s+=`<circle cx="${c.carve.point[0]}" cy="${c.carve.point[1]}" r=".85" class="carve"/>`+label(c.carve.point[0],c.carve.point[1]+.26,'V','carve-label');return s;}
let atlas=`<svg xmlns="http://www.w3.org/2000/svg" width="1950" height="2100" viewBox="0 0 1950 2100">${defs}<style>${css}.map-label{font-size:1.35px}.start-text{font-size:1.5px}.event-label{font-size:1.5px}.carve-label{font-size:1.35px}.jump-label,.flat-label,.quarter-label{display:none}</style><rect width="1950" height="2100" fill="#fffdf5"/>${txt(40,45,'LE LAGON — DES COURBES AUX LIGNES',28,700)}${txt(40,78,'1 / 2 / 3 : possibilités de tricks · V : virage sans trick · lignes alternatives',16)}`;
spec.cards.forEach((c,i)=>{const x=35+i%3*640,y=110+Math.floor(i/3)*490;atlas+=`<g transform="translate(${x} ${y})">${txt(0,24,`${String(c.id).padStart(2,'0')}  ${c.name}`,21,700)}${txt(0,51,`Niveaux ${c.level} · départ ${c.start}${c.jumpDirection?' · saut '+c.jumpDirection:''}`,16)}<g transform="translate(35 105) scale(7.6)">${base}${route(c)}</g>${txt(0,474,c.events.map((ev,j)=>`${j+1} ${ev.type}`).join('  ·  '),16)}</g>`;});
atlas+='</svg>';write('park-organic-routes-v7.svg',atlas);
write('draft-v7.json',JSON.stringify(spec,null,2)+'\n');write('park-base-v7.svg-fragment.txt',base);
// Use the established map controls and responsive annotation behavior.
let template=readFileSync('C:/Users/jeanf/.codex/visualizations/2026/10/25/01a17526-8894-7e62-af4a-1d48fa05beb0/le-lagon-marches-saut.html','utf8');
template=template.replace(/<script type="application\/json" id="lagoon-v6-data">[\s\S]*?<\/script>/,'<script type="application/json" id="lagoon-v6-data">__PARK_DATA__</script>').replaceAll('v6','v7').replaceAll('m?.version===6','m?.version===7').replaceAll('version:6','version:7');
template=template.replaceAll('Vue d’ensemble · les quatre coins','Vue d’ensemble · la nouvelle forme').replaceAll('Quatre coins · marches M · grand tabletop P · rail et ledge','Anse ouverte en C · retour en vague en D · terrasse courbe en B').replaceAll('C · Large','C · Anse du Large').replaceAll('D · Soleil','D · Retour du Soleil');
template=template.replaceAll('Quatre coins courbes, plateformes A à D, marches M sur le deck des palmiers et grand tabletop P au centre, avec rail R et ledge L.','Petit bowl ouvert en C, retour courbe prolongé en D, terrasse des marches en B et bank bas en A. Tabletop P recentré sur un axe d’approche et de sortie dégagé.');
template=template.replace('</style>','#lagoon-corners-v7 .jump-axis{fill:var(--foreground);fill-opacity:.035;stroke:none}</style>');
writeFileSync('C:/Users/jeanf/.codex/visualizations/2026/10/25/01a17526-8894-7e62-af4a-1d48fa05beb0/le-lagon-forme-finale.html',template.replace('__PARK_DATA__',JSON.stringify({...spec,baseMarkup:base})));
console.log('V7: open cove C, long return D, softer terraces, centered flight axis, twelve routes.');
