// Design study only: one park shared by twelve card illustrations.
import {readFileSync,writeFileSync} from 'node:fs';

const round=n=>Math.round(n*100)/100;
const polar=(c,r,a)=>[round(c[0]+r*Math.cos(a*Math.PI/180)),round(c[1]+r*Math.sin(a*Math.PI/180))];
const arc=(c,r,a,b)=>`M${polar(c,r,a)} A${r} ${r} 0 ${b-a>180?1:0} 1 ${polar(c,r,b)}`;
const ring=(c,r1,r2,a,b)=>`M${polar(c,r1,a)} A${r1} ${r1} 0 0 1 ${polar(c,r1,b)} L${polar(c,r2,b)} A${r2} ${r2} 0 0 0 ${polar(c,r2,a)} Z`;
const pockets=[
 {id:'QA',center:[15,30],angles:[90,180],character:'Coin bas relié au bank de départ'},
 {id:'QB',center:[15,14],angles:[180,270],character:'Quarter bas et large, côté palmiers'},
 {id:'QC',center:[49,14],angles:[270,360],character:'Quarter arrondi, retour côté mer'},
 {id:'QD',center:[49,30],angles:[0,90],character:'Quarter un peu plus haut, côté soleil'}
].map(q=>({...q,toeRadius:5.5,copingRadius:8.5,deckRadius:10.2}));
const starts=[
 {id:'A',name:'Les Dunes',point:[19,39.5],exit:[19,34.7],kind:'Plateforme du coin QA + bank droit'},
 {id:'B',name:'Les Palmiers',point:[8.28,7.28],exit:[11.68,10.68],kind:'Plateforme haute du quarter QB'},
 {id:'C',name:'Le Large',point:[55.72,7.28],exit:[52.32,10.68],kind:'Plateforme haute du quarter QC'},
 {id:'D',name:'Le Soleil',point:[55.72,36.72],exit:[52.32,33.32],kind:'Plateforme haute du quarter QD'}
];
const extensions=[
 {pocket:'QB',deck:[15,3.8,7,1.7],ramp:[15,5.5,7,3],axis:'y',coping:5.5,toe:8.5,contours:[6,6.5,7.2,7.9],label:'Quarter droit bas après le coin des palmiers'},
 {pocket:'QC',deck:[57.5,14,1.7,5],ramp:[54.5,14,3,5],axis:'x',coping:57.5,toe:54.5,contours:[55.1,55.8,56.5,57],label:'Retour latéral côté mer'},
 {pocket:'QD',deck:[42,38.5,7,1.7],ramp:[42,35.5,7,3],axis:'y',coping:38.5,toe:35.5,contours:[36.1,36.8,37.5,38],label:'Coping droit relié au grand coin du soleil'}
];
const e=(x,y,type,place)=>({point:[x,y],type,place});
const cards=[
 {id:1,name:'Le Quai bas',level:'1–2',start:'A',path:'M19 39.5 L19 34.7 C19 31 20.5 29.6 23 29.6 L29.5 29.6 L36 29.6 C39 29.6 40 31.5 43 32 C47 32 52 35 54.5 34 C56 33 54 30.5 50.5 30.5',events:[e(29.5,29.6,'Slide','Ledge L'),e(43,32,'Kick','Flat'),e(54.5,34,'Air','Quarter QD')]},
 {id:2,name:'Le Rail des Palmiers',level:'1–2',start:'B',path:'M8.28 7.28 L11.68 10.68 C16 15 18 17 24 17 L31 17 L38 17 C42 17 45 17.5 47 18.5 C50 17 56 14 54.6 10.3 C53 7.8 50.5 11.2 49.5 13.5',events:[e(31,17,'Slide','Rail R'),e(47,18.5,'Kick','Flat'),e(54.6,10.3,'Air','Quarter QC')]},
 {id:3,name:'La Petite Vague',level:'1–2',start:'C',path:'M55.72 7.28 L52.32 10.68 C49 14 45.5 19 46 24 L44.5 24 L39.5 24 L38 24 C33 24 30 23 27 23 C22 23 19.5 29.6 23 29.6 L29.5 29.6 L36 29.6',events:[e(44.5,24,'Air','Bank de P'),e(27,23,'Kick','Flat'),e(29.5,29.6,'Slide','Ledge L')]},
 {id:4,name:'L’Îlot',level:'1–2',start:'D',path:'M55.72 36.72 L52.32 33.32 C49 30 49 24 46 24 L44.5 24 L39.5 24 L38 24 C34 24 32 22 29 22 C25 22 20 25 23 29.6 L29.5 29.6 L36 29.6',events:[e(44.5,24,'Air','Bank de P'),e(29,22,'Kick','Flat'),e(29.5,29.6,'Slide','Ledge L')]},
 {id:5,name:'Le Double Quai',level:'3–5',start:'A',path:'M19 39.5 L19 34.7 C19 31 20.5 29.6 23 29.6 L29.5 29.6 L36 29.6 C41 29.6 51 24 46 24 L44.5 24 L39.5 24 L38 24 C34 24 31 23 28 23',events:[e(29.5,29.6,'Slide','Ledge L'),e(44.5,24,'Air','Bank de P'),e(28,23,'Kick','Flat')]},
 {id:6,name:'Le Retour du Rail',level:'3–5',start:'A',path:'M19 39.5 L19 34.7 C19 29 17 25 18 22 C19 18 21 17 24 17 L31 17 L38 17 C42 17 47 13 53.2 8.4 C55 6 49 6.4 46 11',events:[e(18,22,'Kick','Flat'),e(31,17,'Slide','Rail R'),e(53.2,8.4,'Air','Quarter QC')]},
 {id:7,name:'Le Virage des Dunes',level:'3–5',start:'B',path:'M8.28 7.28 L11.68 10.68 C9 15 8.2 23 8.2 30 C8.2 33.76 11.24 36.8 15 36.8 C21 36.8 20 29.6 23 29.6 L29.5 29.6 L36 29.6 C42 29.6 51 24 46 24 L44.5 24 L39.5 24 L38 24 C33 24 30 22 27 22',events:[e(29.5,29.6,'Slide','Ledge L'),e(44.5,24,'Air','Bank de P'),e(27,22,'Kick','Flat')],carve:{point:[10.19,34.81],place:'QA'}},
 {id:8,name:'Le Tour de l’Îlot',level:'3–5',start:'B',path:'M8.28 7.28 L11.68 10.68 C17 16 28 24 38 24 L39.5 24 L44.5 24 L46 24 C51 24 55.8 27 55.8 30 C55.8 33.76 52.76 36.8 49 36.8 C43 36.8 40 29.6 36 29.6 L29.5 29.6 L23 29.6 C20 29.6 20 25 21 23',events:[e(39.5,24,'Air','Bank de P'),e(29.5,29.6,'Slide','Ledge L'),e(21,23,'Kick','Flat')],carve:{point:[53.81,34.81],place:'QD'}},
 {id:9,name:'Le Coping Bleu',level:'3–5',start:'C',path:'M55.72 7.28 L52.32 10.68 C49 14 46 16 43 16 C41 16 40 17 38 17 L31 17 L24 17 C19 17 16 12 10.2 9.2 C7 7.1 7.8 12.5 12 14.5',events:[e(43,16,'Kick','Flat'),e(31,17,'Slide','Rail R'),e(10.2,9.2,'Air','Quarter QB')]},
 {id:10,name:'Les Embruns',level:'3–5',start:'D',path:'M55.72 36.72 L52.32 33.32 C49 30 49 22.2 46 22.2 L42 22.2 L38 22.2 C34 22.2 32 21 29 21 C23 21 16 12 10.2 9.2 C7 7.1 7.8 12.5 12 14.5',events:[e(42,22.2,'Slide','Bord de P'),e(29,21,'Kick','Flat'),e(10.2,9.2,'Air','Quarter QB')]},
 {id:11,name:'La Grande Traverse',level:'6',start:'C',path:'M55.72 7.28 L52.32 10.68 C48 15 43 17 38 17 L31 17 L24 17 C18 17 8.2 19 8.2 14 C8.2 10.24 11.24 7.2 15 7.2 C21 7.2 23 10 25 12 C29 15 27 22 30 24 C33 24 35 24 38 24 L39.5 24 L46 24',events:[e(31,17,'Slide','Rail R'),e(30,24,'Kick','Flat'),e(39.5,24,'Air','Bank de P')],carve:{point:[10.19,9.19],place:'QB'}},
 {id:12,name:'La Boucle du Lagon',level:'6',start:'D',path:'M55.72 36.72 L52.32 33.32 C48 29 46 17 38 17 L31 17 L24 17 C17 17 8.2 19 8.2 14 C8.2 10.24 11.24 7.2 15 7.2 C21 7.2 23 10 25 12 C29 15 28 22 29 24 C30 26 36 27 42 30 C45 32 51 35 54 34 C56 33 54 30.5 50.5 30.5',events:[e(31,17,'Slide','Rail R'),e(29,24,'Kick','Flat'),e(54,34,'Air','Quarter QD')],carve:{point:[10.19,9.19],place:'QB'}}
];
const outline='M8 2 C18 0 24 2 32 2 C42 0 53 0 59 5 C64 10 64 19 62 23 C64 30 62 39 56 42 C46 46 37 44 32 44 C22 46 9 44 4 37 C0 30 1 22 2 18 C0 11 2 5 8 2 Z';
const sources=[
 {name:'South Padre Island · Spohn Ranch',url:'https://www.spohnranch.com/spohn-ranch-completes-construction-of-south-padre-island-skatepark-2021-05-24/',principle:'Transitions et bowl débutant autour d’un centre avec manual pads et rail bas.'},
 {name:'Crowley Lake · Spohn Ranch',url:'https://www.spohnranch.com/crowley-lake-skatepark-charges-ahead-2017-10-16/',principle:'Quarterpipes et parois arrondies en périphérie pour conserver le mouvement.'},
 {name:'Queensborough · New Line',url:'https://www.newlineskateparks.com/project/queensborough-skatepark/',principle:'Terrain organique mêlant plans inclinés, quarterpipes et sections de bowl.'}
];
const spec={version:5,name:'Le Lagon',status:'Étude de forme et de lignes pour un jeu de cartes',outline,pockets,extensions,starts,cards,sources,sharedElements:[{id:'R',name:'Rail bas',box:[24,17,14,0]},{id:'L',name:'Ledge long',box:[23,29,13,1.2]},{id:'P',name:'Îlot bank-to-bank',box:[38,22,8,4]}],distribution:{'1–2':4,'3–5':6,'6':2},routeMeaning:'Lignes alternatives, pas des pistes simultanées. La descente initiale donne de l’élan. Les points 1–3 montrent trois possibilités de tricks ; V désigne un virage pompé, sans trick supplémentaire. Les exemples ne changent pas les règles.',designMeaning:'Quatre quarterpipes de coin concaves vers le centre et prolongés différemment : bank en A, quarter droit en B, retour latéral en C, coping long en D. Trois équipements centraux. Les hauteurs sont qualitatives ; dessin schématique sans échelle de construction.'};
const rect=(x,y,w,h,cls)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;
const path=(d,cls)=>`<path d="${d}" class="${cls}"/>`;
const line=(a,b,cls,extra='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${cls}" ${extra}/>`;
const text=(x,y,v,cls='map-label')=>`<text x="${x}" y="${y}" class="${cls}">${v}</text>`;
function base(){
 let s=path('M0 -5H64V-2Q48 0 32 -2T0 -2Z','sea')+path('M0 -2Q16 -4 32 -2T64 -2','shore')+path('M4 1Q15 -1 26 .4 M38 .4Q51 -1 61 3','walk');
 for(const [x,y]of [[3,5],[15,.1],[27,.2],[42,.1],[60,5],[63,29],[3,34],[10,44],[52,44]])s+=`<circle cx="${x}" cy="${y}" r=".8" class="tree"/>`;
 s+=path(outline,'floor');
 for(const ex of extensions){const [x,y,w,h]=ex.ramp;s+=rect(...ex.deck,'deck')+rect(...ex.ramp,'quarter');
  if(ex.axis==='y'){s+=line([x,ex.coping],[x+w,ex.coping],'coping')+line([x,ex.toe],[x+w,ex.toe],'toe');for(const yy of ex.contours)s+=line([x,yy],[x+w,yy],'contour');s+=line([x+w/2,ex.coping+(ex.toe>ex.coping?.6:-.6)],[x+w/2,ex.toe+(ex.toe>ex.coping?-.3:.3)],'slope','marker-end="url(#slope-arrow)"');}
  else{s+=line([ex.coping,y],[ex.coping,y+h],'coping')+line([ex.toe,y],[ex.toe,y+h],'toe');for(const xx of ex.contours)s+=line([xx,y],[xx,y+h],'contour');s+=line([ex.coping-.6,y+h/2],[ex.toe+.3,y+h/2],'slope','marker-end="url(#slope-arrow)"');}
 }
 for(const q of pockets){const [a,b]=q.angles;s+=path(ring(q.center,10.2,8.5,a,b),'deck')+path(ring(q.center,8.5,5.5,a,b),'quarter');
  for(const rad of [6.1,6.8,7.5,8])s+=path(arc(q.center,rad,a,b),'contour');
  s+=path(arc(q.center,8.5,a,b),'coping')+path(arc(q.center,5.5,a,b),'toe');
  for(const angle of [a+18,a+45,a+72])s+=line(polar(q.center,7.8,angle),polar(q.center,5.8,angle),'slope','marker-end="url(#slope-arrow)"');
  s+=text(q.center[0],q.center[1]+.3,q.id,'map-label quarter-label');
 }
 s+=rect(15,38.5,8,2,'deck')+rect(15,35.5,8,3,'bank')+line([15,38.5],[23,38.5],'bank-top')+line([19,38],[19,35.8],'slope','marker-end="url(#slope-arrow)"');
 s+=line([24,17],[38,17],'rail');for(let i=0;i<5;i++)s+=`<circle cx="${24+i*3.5}" cy="17" r=".11" class="support"/>`;
 s+=rect(23,29,13,1.2,'pad')+rect(23.13,29.13,12.74,.94,'padtop');
 s+=rect(38,22,8,4,'pad')+rect(38,22,1.5,4,'bank')+rect(44.5,22,1.5,4,'bank')+rect(39.5,22,5,4,'padtop')+line([38,22.2],[46,22.2],'grind-edge');
 s+=line([38.2,24],[39.3,24],'slope','marker-end="url(#slope-arrow)"')+line([45.8,24],[44.7,24],'slope','marker-end="url(#slope-arrow)"');
 for(const [id,x,y]of [['R',31,14.5],['L',29.5,32],['P',42,27.7]])s+=`<circle cx="${x}" cy="${y}" r=".75" class="spot-disc"/>`+text(x,y+.25,id,'map-label spot-label');
 s+=text(25,23,'FLAT','map-label flat-label')+text(36,37,'FLAT','map-label flat-label')+text(32,-3.5,'PLAGE / MER','map-label sea-label');
 for(const st of starts)s+=`<circle cx="${st.point[0]}" cy="${st.point[1]}" r="1" class="start-disc"/>`+text(st.point[0],st.point[1]+.32,st.id,'start-text');
 s+=path('M32 47V44.5m-.4.6.4-.6.4.6','slope');return s;
}
const baseMarkup=base();
const defs=`<defs><pattern id="bank-hatch" width=".4" height=".4" patternUnits="userSpaceOnUse"><path d="M0 .4 .4 0" stroke="#a9bfbd" stroke-width=".035"/></pattern><marker id="slope-arrow" viewBox="0 0 7 7" refX="6" refY="3.5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 7 3.5 0 7" fill="none" stroke="#6b888e" stroke-width="1"/></marker><marker id="route-arrow" viewBox="0 0 7 7" refX="6" refY="3.5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 7 3.5 0 7Z" fill="#087d95"/></marker></defs>`;
const css=`.floor{fill:#fbf9ed;stroke:#204e5b;stroke-width:.13}.sea{fill:#d7f1f7}.shore{fill:none;stroke:#7bb4c2;stroke-width:.06}.walk{fill:none;stroke:#c9d3c6;stroke-width:.8}.tree{fill:#dce9d6;stroke:#91ae91;stroke-width:.05}.deck{fill:#e8ede1;stroke:#789698;stroke-width:.06}.quarter{fill:#d5eceb;stroke:none}.contour{fill:none;stroke:#a0c9cb;stroke-width:.035}.coping{fill:none;stroke:#204e5b;stroke-width:.16}.toe{fill:none;stroke:#789698;stroke-width:.055}.bank{fill:url(#bank-hatch);stroke:#789698;stroke-width:.055}.bank-top,.grind-edge{stroke:#204e5b;stroke-width:.1}.rail{stroke:#204e5b;stroke-width:.16}.support{fill:#fbf9ed;stroke:#204e5b;stroke-width:.06}.pad{fill:#d4e3df;stroke:#204e5b;stroke-width:.08}.padtop{fill:#fbf9ed;stroke:#829d9f;stroke-width:.05}.slope{fill:none;stroke:#6b888e;stroke-width:.055}.map-label{fill:#204e5b;font:400 .83px Arial,sans-serif;text-anchor:middle}.start-text{fill:#694c1f;font:700 1px Arial,sans-serif;text-anchor:middle}.start-disc{fill:#fff4d6;stroke:#b78629;stroke-width:.1}.spot-disc{fill:#fbf9ed;stroke:#7d999d;stroke-width:.07}.route-halo{fill:none;stroke:#fffdf4;stroke-width:.43;stroke-linecap:round;stroke-linejoin:round}.route{fill:none;stroke:#087d95;stroke-width:.19;stroke-linecap:round;stroke-linejoin:round;marker-end:url(#route-arrow)}.event{fill:#fffdf4;stroke:#087d95;stroke-width:.08}.event-label{fill:#164f5b;font:700 .83px Arial,sans-serif;text-anchor:middle}.carve{fill:#e3ebe4;stroke:#526d72;stroke-width:.06}.carve-label{fill:#3b595f;font:400 .75px Arial,sans-serif;text-anchor:middle}`;
function route(c){let s=path(c.path,'route-halo')+path(c.path,'route');c.events.forEach((ev,i)=>{s+=`<circle cx="${ev.point[0]}" cy="${ev.point[1]}" r="1.05" class="event"/>`+text(ev.point[0],ev.point[1]+.3,i+1,'event-label');});if(c.carve)s+=`<circle cx="${c.carve.point[0]}" cy="${c.carve.point[1]}" r=".85" class="carve"/>`+text(c.carve.point[0],c.carve.point[1]+.26,'V','carve-label');return s;}
const txt=(x,y,v,size=17,weight=400)=>`<text x="${x}" y="${y}" fill="#204e5b" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}">${v}</text>`;
let overview=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1320" viewBox="0 0 1800 1320">${defs}<style>${css}</style><rect width="1800" height="1320" fill="#fffdf5"/>${txt(60,60,'LE LAGON — LES COINS FONT LES LIGNES',31,700)}${txt(60,93,'DRAFT 05 · VUE DE DESSUS · QUATRE QUARTERPIPES ARRONDIS + UN BANK + TROIS ÉLÉMENTS STREET',16)}<g transform="translate(65 235) scale(18.2)">${baseMarkup}</g>`;
overview+=txt(1295,180,'QUATRE DÉPARTS HAUTS',22,700);
starts.forEach((s,i)=>{const y=225+i*80;overview+=txt(1295,y,`${s.id} — ${s.name}`,20,700)+txt(1295,y+27,s.id==='A'?'Bank droit relié au coin bas':'Drop-in dans le quarter de coin',15);});
overview+=txt(1295,565,'LES COINS',22,700)+txt(1295,605,'QA / QB : bas et accueillants',17)+txt(1295,638,'QC : retour arrondi côté mer',17)+txt(1295,671,'QD : un peu plus haut',17)+txt(1295,710,'Descendre, tourner ou faire un air.',16)+txt(1295,737,'Les courbes restent ouvertes au centre.',16);
overview+=txt(1295,810,'AU CENTRE',22,700)+txt(1295,852,'R — Rail bas',18)+txt(1295,887,'L — Ledge long',18)+txt(1295,922,'P — Îlot avec deux banks et bord slide',17);
overview+=txt(1295,1015,'12 CARTES / MÊMES ÉQUIPEMENTS',19,700)+txt(1295,1053,'4 cartes niveaux 1–2',17)+txt(1295,1086,'6 cartes niveaux 3–5',17)+txt(1295,1119,'2 cartes niveau 6',17);
overview+=txt(60,1188,'Coins concaves vers le centre : trait foncé = coping en haut ; courbes fines = transition ; flèches = descente.',16)+txt(60,1220,'Les routes sont des possibilités alternatives. Les virages dans les coins peuvent relancer une ligne sans ajouter un trick.',16)+txt(60,1278,'Étude pour le jeu · sans échelle de construction · inspirations : South Padre Island, Crowley Lake et Queensborough.',15)+'</svg>';
writeFileSync(new URL('park-corners-plan-v5.svg',import.meta.url),overview);
let atlas=`<svg xmlns="http://www.w3.org/2000/svg" width="1950" height="2100" viewBox="0 0 1950 2100">${defs}<style>${css}.map-label{font-size:1.35px}.start-text{font-size:1.5px}.event-label{font-size:1.5px}.carve-label{font-size:1.35px}</style><rect width="1950" height="2100" fill="#fffdf5"/>${txt(40,45,'LE LAGON — 12 POSSIBILITÉS DE LIGNES',28,700)}${txt(40,78,'1 / 2 / 3 : tricks possibles · V : virage pompé sans trick · départs partagés · lignes alternatives',16)}`;
cards.forEach((c,i)=>{const x=35+i%3*640,y=110+Math.floor(i/3)*490;atlas+=`<g transform="translate(${x} ${y})">${txt(0,24,`${String(c.id).padStart(2,'0')}  ${c.name}`,21,700)}${txt(0,51,`Niveaux ${c.level} · départ ${c.start}${c.carve?' · retour par '+c.carve.place:''}`,16)}<g transform="translate(35 105) scale(7.6)">${baseMarkup}${route(c)}</g>${txt(0,474,c.events.map((ev,j)=>`${j+1} ${ev.type}`).join('  ·  '),16)}</g>`;});
atlas+='</svg>';writeFileSync(new URL('park-corners-routes-v5.svg',import.meta.url),atlas);
writeFileSync(new URL('draft-v5.json',import.meta.url),JSON.stringify(spec,null,2)+'\n');
writeFileSync(new URL('park-base-v5.svg-fragment.txt',import.meta.url),baseMarkup);
const template=readFileSync(new URL('park-corners-v5.fragment.html',import.meta.url),'utf8');
const inlinePath='C:/Users/jeanf/.codex/visualizations/2026/10/25/01a17526-8894-7e62-af4a-1d48fa05beb0/le-lagon-coins.html';
writeFileSync(inlinePath,template.replace('__PARK_DATA__',JSON.stringify({...spec,baseMarkup})));
console.log('V5: four corner quarters, three shared street objects, twelve routes.');
