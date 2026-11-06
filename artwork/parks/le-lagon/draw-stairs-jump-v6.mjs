// Design study: add stairs on an existing deck and enlarge the existing island.
import {readFileSync,writeFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,value)=>writeFileSync(new URL(name,import.meta.url),value);
const spec=JSON.parse(read('draft-v5.json'));
spec.version=6;
spec.designMeaning='Quatre coins en quarterpipe et quatre départs hauts partagés. Un escalier de quatre marches prolonge la plateforme B, avec hubba, main courante et bank à côté. L’ancien îlot devient un grand tabletop à plateau plein, franchissable en roulant ou en sautant. Le centre conserve rail, ledge et espace d’approche. Étude pour le jeu sans échelle de construction.';
spec.stairs={id:'M',name:'Les Marches des Palmiers',deck:[22,3.8,11,3.2],steps:[25,7,4,3.6],count:4,bank:[30.5,7,2.5,3.6],hubba:[24.4,7,.45,3.6],handrail:[29.6,7,0,3.6],connection:'Même plateforme haute que B ; accès par le deck, descente vers le centre.'};
spec.sharedElements=spec.sharedElements.filter(e=>e.id!=='P');
spec.sharedElements.push({id:'P',name:'La Grande Vague · grand tabletop',box:[36.5,21,12,6],launch:[36.5,21,2.5,6],table:[39,21,7,6],landing:[46,21,2.5,6],detail:'Plateau plein entre décollage et réception. On peut rouler dessus, jouer les banks latéraux ou traverser le plateau en sautant.'});
spec.sharedElements.push({id:'M',name:'Les Marches des Palmiers',box:[25,7,4,3.6],detail:'Quatre marches avec hubba, main courante et un bank adjacent.'});
for(const c of spec.cards){
 c.path=c.path.replaceAll('39.5 24','37.75 24').replaceAll('44.5 24','47.25 24').replaceAll('38 24','36.5 24').replaceAll('46 24','48.5 24').replaceAll('46 22.2','48.5 21.2').replaceAll('42 22.2','42 21.2').replaceAll('38 22.2','36.5 21.2');
 for(const e of c.events){if(e.place==='Bank de P'){e.point[0]=e.point[0]===39.5?37.75:47.25;e.place='Bank du tabletop P';}if(e.place==='Bord de P'){e.point=[42,21.2];e.place='Bord du tabletop P';}}
}
const event=(x,y,type,place)=>({point:[x,y],type,place});
Object.assign(spec.cards.find(c=>c.id===7),{name:'Les Marches des Palmiers',path:'M8.28 7.28 C10.1 5.45 12.3 4.5 15 4.5 L22 4.5 L27 4.5 L27 7 L27 8.8 L27 10.6 C27 14 21 17 24 17 L31 17 L38 17 C43 17 53 24 48.5 24 L47.25 24 L46 24 L39 24 L36.5 24',events:[event(27,8.8,'Kick','Escalier M'),event(31,17,'Slide','Rail R'),event(47.25,24,'Air','Bank du tabletop P')],via:'Deck B, puis marches'});
delete spec.cards.find(c=>c.id===7).carve;
Object.assign(spec.cards.find(c=>c.id===11),{name:'La Grande Vague',path:'M55.72 7.28 L52.32 10.68 C48 15 43 17 38 17 L31 17 L24 17 C18 17 8.2 19 8.2 14 C8.2 10.24 11.24 7.2 15 7.2 C21 7.2 23 10 25 12 C29 15 27 22 30 24 C33 24 35 24 36.5 24 L39 24 L42.5 24 L46 24 L48.5 24',events:[event(31,17,'Slide','Rail R'),event(30,24,'Kick','Flat'),event(42.5,24,'Air','Grand saut P')],jumpDirection:'ouest → est'});
Object.assign(spec.cards.find(c=>c.id===12),{path:'M55.72 36.72 L52.32 33.32 C52 29 53 22 51 19 C49 17 44 17 38 17 L31 17 L24 17 C17 17 8.2 19 8.2 14 C8.2 10.24 11.24 7.2 15 7.2 C19 7.2 22 12 24 12 L30 12 C36 14 47 10 51 18 C54 24 52 24 48.5 24 L46 24 L42.5 24 L39 24 L36.5 24 C33 24 31 27 29 27',events:[event(31,17,'Slide','Rail R'),event(30,12,'Kick','Flat'),event(42.5,24,'Air','Grand saut P')],jumpDirection:'est → ouest'});
// Align two approaches with the larger right bank.
spec.cards.find(c=>c.id===3).path='M55.72 7.28 L52.32 10.68 C49 14 54 24 48.5 24 L47.25 24 L46 24 L39 24 L36.5 24 C33 24 30 23 27 23 C22 23 19.5 29.6 23 29.6 L29.5 29.6 L36 29.6';
spec.cards.find(c=>c.id===4).path='M55.72 36.72 L52.32 33.32 C49 30 54 24 48.5 24 L47.25 24 L46 24 L39 24 L36.5 24 C34 24 32 22 29 22 C25 22 20 25 23 29.6 L29.5 29.6 L36 29.6';
const rect=(x,y,w,h,cls)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;
const line=(a,b,cls,extra='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${cls}" ${extra}/>`;
const label=(x,y,v,cls='map-label')=>`<text x="${x}" y="${y}" class="${cls}">${v}</text>`;
const dot=(x,y,id)=>`<circle cx="${x}" cy="${y}" r=".75" class="spot-disc"/>`+label(x,y+.25,id,'map-label spot-label');
let base=read('park-base-v5.svg-fragment.txt');
const begin=base.indexOf('<rect x="38" y="22" width="8" height="4" class="pad"/>'),end=base.indexOf('<circle cx="31" cy="14.5"');
if(begin<0||end<begin)throw Error('Missing old island geometry');
let jump=rect(36.5,21,12,6,'pad')+rect(36.5,21,2.5,6,'bank')+rect(46,21,2.5,6,'bank')+rect(39,21,7,6,'padtop');
jump+=line([36.5,21.2],[48.5,21.2],'grind-edge')+line([36.8,24],[38.7,24],'slope','marker-end="url(#slope-arrow)"')+line([48.2,24],[46.3,24],'slope','marker-end="url(#slope-arrow)"');
jump+=line([39.2,24],[45.8,24],'flight-line')+label(42.5,22.9,'TABLETOP','map-label jump-label');
base=base.slice(0,begin)+jump+base.slice(end);
base=base.replace('<circle cx="42" cy="27.7" r=".75" class="spot-disc"/><text x="42" y="27.95" class="map-label spot-label">P</text>',dot(42.5,29.5,'P'));
let stairs=rect(22,3.8,11,3.2,'deck')+rect(25,7,4,3.6,'steps')+rect(24.4,7,.45,3.6,'pad')+rect(30.5,7,2.5,3.6,'bank');
for(let i=0;i<=4;i++)stairs+=line([25,7+i*.9],[29,7+i*.9],'step-edge');
stairs+=line([29.6,7],[29.6,10.6],'rail');for(const y of [7,8.8,10.6])stairs+=`<circle cx="29.6" cy="${y}" r=".1" class="support"/>`;
stairs+=line([31.75,7.4],[31.75,10.2],'slope','marker-end="url(#slope-arrow)"')+dot(34.5,8.8,'M');
// The stair terrace adjoins B's existing upper deck, not a new freestanding block.
base=base.replace('<line x1="24" y1="17"',stairs+'<line x1="24" y1="17"');
const styleExtra='.steps{fill:#ede9db;stroke:#789698;stroke-width:.06}.step-edge{stroke:#406571;stroke-width:.07}.flight-line{stroke:#789698;stroke-width:.07;stroke-dasharray:.3 .2}.jump-label{font-size:.65px}';
const oldSvg=read('park-corners-plan-v5.svg'),defs=oldSvg.match(/<defs>[\s\S]*?<\/defs>/)[0],css=oldSvg.match(/<style>([\s\S]*?)<\/style>/)[1]+styleExtra;
const path=(d,cls)=>`<path d="${d}" class="${cls}"/>`;
function route(c){let s=path(c.path,'route-halo')+path(c.path,'route');c.events.forEach((e,i)=>{s+=`<circle cx="${e.point[0]}" cy="${e.point[1]}" r="1.05" class="event"/>`+label(e.point[0],e.point[1]+.3,i+1,'event-label');});if(c.carve)s+=`<circle cx="${c.carve.point[0]}" cy="${c.carve.point[1]}" r=".85" class="carve"/>`+label(c.carve.point[0],c.carve.point[1]+.26,'V','carve-label');return s;}
const txt=(x,y,v,size=17,weight=400)=>`<text x="${x}" y="${y}" fill="#204e5b" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}">${v}</text>`;
let plan=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1320" viewBox="0 0 1800 1320">${defs}<style>${css}</style><rect width="1800" height="1320" fill="#fffdf5"/>${txt(60,60,'LE LAGON — MARCHES ET GRANDE VAGUE',31,700)}${txt(60,93,'DRAFT 06 · QUATRE COINS + UNE TERRASSE AVEC MARCHES + UN GRAND TABLETOP PARTAGÉ',16)}<g transform="translate(65 235) scale(18.2)">${base}</g>`;
plan+=txt(1295,175,'M — LES MARCHES DES PALMIERS',21,700)+txt(1295,215,'Quatre marches reliées à la plateforme B.',16)+txt(1295,245,'Hubba + main courante + bank adjacent.',16)+txt(1295,275,'Plusieurs façons de descendre au centre.',16);
plan+=txt(1295,350,'P — LA GRANDE VAGUE',22,700)+txt(1295,390,'L’îlot devient un grand tabletop.',17)+txt(1295,421,'Un décollage, un plateau et une réception.',16)+txt(1295,452,'On peut rouler dessus ou viser le grand saut.',16)+txt(1295,483,'Approches possibles dans les deux sens.',16);
plan+=txt(1295,530,'PROFIL SCHÉMATIQUE DE P',16,700)+`<path d="M1305 650h25l70-65h180l70 65h25" fill="#d5eceb" stroke="#204e5b" stroke-width="2"/><path d="M1364 615Q1485 465 1618 615" fill="none" stroke="#789698" stroke-width="2" stroke-dasharray="6 5"/>`+txt(1420,678,'plateau plein',16);
plan+=txt(1295,750,'LES ÉLÉMENTS RÉUTILISÉS',21,700)+txt(1295,790,'A / B / C / D — Départs hauts',17)+txt(1295,822,'QA / QB / QC / QD — Quarterpipes de coin',16)+txt(1295,854,'R — Rail bas · L — Ledge long',17);
plan+=txt(1295,930,'12 CARTES, DES LIGNES DIFFÉRENTES',19,700)+txt(1295,970,'4 cartes niveaux 1–2',17)+txt(1295,1002,'6 cartes niveaux 3–5',17)+txt(1295,1034,'2 cartes niveau 6',17)+txt(1295,1080,'07 — Marches, rail, bank',17)+txt(1295,1112,'11 / 12 — Grand saut dans les deux sens',16);
plan+=txt(60,1190,'Les marches réutilisent un départ haut ; le grand saut agrandit l’îlot existant. Les couloirs d’approche restent ouverts.',16)+txt(60,1222,'1 / 2 / 3 : possibilités de tricks · V : virage sans trick · les lignes sont des alternatives, pas des pistes simultanées.',16)+txt(60,1278,'Étude pour le jeu · profil et plan sans échelle de construction.',15)+'</svg>';
write('park-stairs-jump-plan-v6.svg',plan);
let atlas=`<svg xmlns="http://www.w3.org/2000/svg" width="1950" height="2100" viewBox="0 0 1950 2100">${defs}<style>${css}.map-label{font-size:1.35px}.start-text{font-size:1.5px}.event-label{font-size:1.5px}.carve-label{font-size:1.35px}.jump-label{display:none}</style><rect width="1950" height="2100" fill="#fffdf5"/>${txt(40,45,'LE LAGON — DES MARCHES AU GRAND SAUT',28,700)}${txt(40,78,'1 / 2 / 3 : tricks possibles · V : virage sans trick · M : marches · P : grand tabletop',16)}`;
spec.cards.forEach((c,i)=>{const x=35+i%3*640,y=110+Math.floor(i/3)*490;atlas+=`<g transform="translate(${x} ${y})">${txt(0,24,`${String(c.id).padStart(2,'0')}  ${c.name}`,21,700)}${txt(0,51,`Niveaux ${c.level} · départ ${c.start}${c.jumpDirection?' · saut '+c.jumpDirection:''}`,16)}<g transform="translate(35 105) scale(7.6)">${base}${route(c)}</g>${txt(0,474,c.events.map((e,j)=>`${j+1} ${e.type}`).join('  ·  '),16)}</g>`;});
atlas+='</svg>';write('park-stairs-jump-routes-v6.svg',atlas);
write('draft-v6.json',JSON.stringify(spec,null,2)+'\n');write('park-base-v6.svg-fragment.txt',base);
let template=read('park-corners-v5.fragment.html').replaceAll('v5','v6').replaceAll('Le Virage des Dunes','Les Marches des Palmiers').replaceAll('La Grande Traverse','La Grande Vague').replaceAll('Quatre coins en quarterpipe · un bank · trois éléments street partagés','Quatre coins · marches M · grand tabletop P · rail et ledge').replaceAll("m?.version===5","m?.version===6").replaceAll("version:5","version:6").replaceAll('<span>P · Îlot</span>','<span>P · Grand tabletop</span><span>M · Marches</span>').replaceAll("Quatre coins courbes concaves vers le centre, plateformes A à D, bank au sud-ouest, rail R, ledge L et îlot P au centre.","Quatre coins courbes, plateformes A à D, marches M sur le deck des palmiers et grand tabletop P au centre, avec rail R et ledge L.");
template=template.replace('</style>',`#lagoon-corners-v6 .steps{fill:var(--muted);stroke:var(--muted-foreground);stroke-width:.06}#lagoon-corners-v6 .step-edge{stroke:var(--foreground);stroke-width:.07}#lagoon-corners-v6 .flight-line{stroke:var(--muted-foreground);stroke-width:.07;stroke-dasharray:.3 .2}#lagoon-corners-v6 .has-route .jump-label{display:none}</style>`);
template=template.replace("detail.textContent=`Départ ${card.start} · `","detail.textContent=`Départ ${card.start}${card.via?' → marches M':''} · `");
writeFileSync('C:/Users/jeanf/.codex/visualizations/2026/10/25/01a17526-8894-7e62-af4a-1d48fa05beb0/le-lagon-marches-saut.html',template.replace('__PARK_DATA__',JSON.stringify({...spec,baseMarkup:base})));
console.log('V6: stair terrace on B, larger existing island, twelve alternative lines.');
