// One organic park, four raised starts, four shared central elements, 12 cards.
import {writeFileSync} from 'node:fs';
const starts=[
 {id:'A',name:'Les Dunes',kind:'Plateforme haute + descente droite',point:[11,31.5],exit:[18.5,31.5],deck:[8,29,6,5],ramp:[14,29,4,5],direction:'right'},
 {id:'B',name:'Les Palmiers',kind:'Plateforme haute + quarter',point:[13.5,8.5],exit:[13.5,14.5],deck:[10,7,7,3],ramp:[10,10,7,4],direction:'down'},
 {id:'C',name:'Le Large',kind:'Plateforme haute + plan incliné',point:[49,9],exit:[41.5,9],deck:[46,7,6,4],ramp:[42,7,4,4],direction:'left'},
 {id:'D',name:'Le Soleil',kind:'Plateforme haute + quarter',point:[47.5,32.5],exit:[47.5,26.5],deck:[44,31,7,3],ramp:[44,27,7,4],direction:'up'}
];
const event=(x,y,type,place)=>({point:[x,y],type,place});
const cards=[
 {id:1,name:'Le Quai bas',level:'1–2',start:'A',focus:[30,31],path:'M11 31.5 L18.5 31.5 C21 31.5 23 31.35 25 31.35 L30 31.35 L35 31.35 C37 31.35 38 31 40 30 C44 28 47.5 23.5 47.5 26.5 L47.5 29.4',events:[event(30,31.35,'Slide','Ledge L'),event(40,30,'Kick','Flat'),event(47.5,29.4,'Air','Quarter D')]},
 {id:2,name:'Le Rail des Dunes',level:'1–2',start:'B',focus:[28,17],path:'M13.5 8.5 L13.5 14.5 C13.5 17 18 17 23 17 L28 17 L34 17 C39 17 40 20 40 22 C40 24 39 25 37.4 25',events:[event(28,17,'Slide','Rail R'),event(40,22,'Kick','Flat'),event(37.4,25,'Air','Bank de P')]},
 {id:3,name:'La Petite Vague',level:'1–2',start:'C',focus:[46.5,21],path:'M49 9 L41.5 9 C39 9 39.5 12 42 15 C44 17 46.5 18 46.5 21 C46.5 23.2 42 23.15 38 23.15 L34.5 23.15 L31 23.15 C27 23.15 25 24 23 24',events:[event(46.5,21,'Air','Hip H'),event(34.5,23.15,'Slide','Bord de P'),event(23,24,'Kick','Flat')]},
 {id:4,name:'L’Îlot',level:'1–2',start:'D',focus:[34.5,25],path:'M47.5 32.5 L47.5 26.5 C47 25 42 25 38 25 L37.4 25 L31 25 C27 25 25 24 23 24 C20 24 21 31.35 25 31.35 L30 31.35',events:[event(37.4,25,'Air','Bank de P'),event(23,24,'Kick','Flat'),event(30,31.35,'Slide','Ledge L')]},
 {id:5,name:'Le Double Quai',level:'3–5',start:'A',focus:[34.5,25],path:'M11 31.5 L18.5 31.5 C22 31.5 23 31.35 25 31.35 L30 31.35 L35 31.35 C39.5 31.35 43 25 38 25 L37.4 25 L31 25 C27 25 25 24 23 23',events:[event(30,31.35,'Slide','Ledge L'),event(37.4,25,'Air','Bank de P'),event(23,23,'Kick','Flat')]},
 {id:6,name:'Le Retour du Rail',level:'3–5',start:'A',focus:[28,17],path:'M11 31.5 L18.5 31.5 C21 31.5 21.5 28 22 25 C22.4 22 20.5 17 23 17 L28 17 L34 17 C39.5 17 43 25 38 25 L37.4 25',events:[event(22,25,'Kick','Flat'),event(28,17,'Slide','Rail R'),event(37.4,25,'Air','Bank de P')]},
 {id:7,name:'Le Hip du Soleil',level:'3–5',start:'B',focus:[46.5,21],path:'M13.5 8.5 L13.5 14.5 C16 14.5 18 11.5 24 11.5 C33 11.5 41 13 46.5 19 L46.5 21 C47 25 44 30 40 31.35 L30 31.35 L25 31.35 C22 31.35 21 29 21 26',events:[event(46.5,21,'Air','Hip H'),event(30,31.35,'Slide','Ledge L'),event(21,26,'Kick','Flat')]},
 {id:8,name:'Le Tour de l’Îlot',level:'3–5',start:'B',focus:[34.5,25],path:'M13.5 8.5 L13.5 14.5 C14 20 24 25 31 25 L32.2 25 L38 25 C40 27 39 31.35 35 31.35 L30 31.35 L25 31.35 C22 34 33 37 40 35',events:[event(32.2,25,'Air','Bank de P'),event(30,31.35,'Slide','Ledge L'),event(40,35,'Kick','Flat')]},
 {id:9,name:'Le Coping Bleu',level:'3–5',start:'C',focus:[47.5,29],path:'M49 9 L41.5 9 C39 9 40 13 44 16 C46 17 46.5 18 46.5 21 C46.5 23.2 43 24 40 25 C40 27 47.5 24.5 47.5 27 L47.5 31 L50 31',events:[event(46.5,21,'Air','Hip H'),event(40,25,'Kick','Flat'),event(50,31,'Slide','Coping D')]},
 {id:10,name:'Les Embruns',level:'3–5',start:'D',focus:[30,31],path:'M47.5 32.5 L47.5 26.5 C45 24 40 27 40 30 C39 31 37 31.35 35 31.35 L30 31.35 L25 31.35 C20 31 17 24 13.5 14.5 L13.5 12',events:[event(40,30,'Kick','Flat'),event(30,31.35,'Slide','Ledge L'),event(13.5,12,'Air','Quarter B')]},
 {id:11,name:'La Grande Traverse',level:'6',start:'C',focus:[28,17],path:'M49 9 L41.5 9 C39 9 37.5 12 37.5 14.5 C37.5 17 35 17 34 17 L28 17 L23 17 C19 17 19 22 23 24 C26 25 28 25 31 25 L32.2 25 L38 25',events:[event(28,17,'Slide','Rail R'),event(23,24,'Kick','Flat'),event(32.2,25,'Air','Bank de P')]},
 {id:12,name:'La Boucle du Lagon',level:'6',start:'D',focus:[28,17],path:'M47.5 32.5 L47.5 26.5 L46.5 23 C46.5 22 46.5 21.5 46.5 21 C46.5 17 41 17 34 17 L28 17 L23 17 C17 17 17 23 20 27 C23 31 25 35 30 36',events:[event(46.5,21,'Air','Hip H'),event(28,17,'Slide','Rail R'),event(20,27,'Kick','Flat')]}
];
const outline='M6 8 C14 1 24 2 31 4 C42 0 54 3 57 11 C62 18 59 27 55 32 C51 38 45 42 36 42 C26 46 13 41 8 35 C1 32 0 24 3 18 C2 13 3 10 6 8 Z';
const css=`.floor{fill:#f7f7ef;stroke:#214b54;stroke-width:.16}.land{fill:#eaf0e4}.sea{fill:#e2f3f6}.shore{stroke:#90bfc9;fill:none;stroke-width:.08}.walk{stroke:#c9d3c6;fill:none;stroke-width:1.5}.deck{fill:#e2e7dd;stroke:#254d55;stroke-width:.1}.bank{fill:url(#bank-hatch);stroke:#496b71;stroke-width:.065}.curve{fill:url(#curve-hatch);stroke:#496b71;stroke-width:.065}.pad{fill:#dbe6e1;stroke:#244e58;stroke-width:.09}.padtop{fill:#f5f7ef;stroke:#718e90;stroke-width:.04}.coping{stroke:#214b54;stroke-width:.16}.rail{stroke:#214b54;stroke-width:.17}.support{fill:#f7f7ef;stroke:#214b54;stroke-width:.07}.slope{stroke:#6b888e;stroke-width:.055;fill:none}.map-label{fill:#254d55;font:500 .75px Arial,sans-serif;text-anchor:middle}.start-disc{fill:#fbf5dc;stroke:#9f7427;stroke-width:.1}.start-text{fill:#614d23;font:700 .83px Arial,sans-serif;text-anchor:middle}.spot-disc{fill:#f7faf5;stroke:#607f84;stroke-width:.07}.route-halo{fill:none;stroke:#fffdf4;stroke-width:.30;stroke-linecap:round;stroke-linejoin:round}.route{fill:none;stroke:#167e91;stroke-width:.15;stroke-linecap:round;stroke-linejoin:round;marker-end:url(#route-arrow)}.event{fill:#fffdf4;stroke:#167e91;stroke-width:.08}.event-label{fill:#0d5969;font:700 .64px Arial,sans-serif;text-anchor:middle}.view-cone{fill:#167e91;fill-opacity:.09;stroke:none}.view-axis{stroke:#167e91;stroke-width:.06;stroke-dasharray:.24 .22;fill:none}.tree{fill:#dce9d6;stroke:#8aab8a;stroke-width:.06}`;
const defs=`<defs><pattern id="bank-hatch" width=".35" height=".35" patternUnits="userSpaceOnUse"><rect width=".35" height=".35" fill="#eef0e7"/><path d="M0 .35 .35 0" stroke="#a8bab9" stroke-width=".03"/></pattern><pattern id="curve-hatch" width=".35" height=".35" patternUnits="userSpaceOnUse"><rect width=".35" height=".35" fill="#e8f0ed"/><path d="M0 .12H.35 M0 .28H.35" stroke="#a8bab9" stroke-width=".03"/></pattern><marker id="route-arrow" viewBox="0 0 7 7" refX="6" refY="3.5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 7 3.5 0 7Z" fill="#167e91"/></marker><marker id="slope-arrow" viewBox="0 0 7 7" refX="6" refY="3.5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 7 3.5 0 7" fill="none" stroke="#6b888e" stroke-width="1"/></marker></defs>`;
const r=(x,y,w,h,cls,other='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" ${other}/>`;
const l=(x1,y1,x2,y2,cls,other='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" ${other}/>`;
const t=(x,y,s,cls='map-label')=>`<text x="${x}" y="${y}" class="${cls}">${s}</text>`;
function baseMap(){let b=`<path class="sea" d="M0 -4H60V0Q45 3 30 0T0 0Z"/><path class="shore" d="M0 0Q15 -2 30 0T60 0"/><path class="walk" d="M5 4 Q18 -.7 31 1 Q47 -1 55 5"/>`;
 for(const [x,y]of [[5,7],[8,3],[21,1],[37,-.2],[55,5],[58,29],[49,39],[9,37]])b+=`<circle class="tree" cx="${x}" cy="${y}" r=".8"/>`;
 b+=`<path class="floor" d="${outline}"/>`;
 for(const s of starts){const [x,y,w,h]=s.ramp;b+=r(...s.deck,'deck')+r(x,y,w,h,s.kind.includes('quarter')?'curve':'bank');
  if(s.direction==='right'||s.direction==='left'){const xx=s.direction==='right'?x:x+w;b+=l(xx,y,xx,y+h,'coping');b+=l(s.direction==='right'?x+.6:x+w-.6,y+h/2,s.direction==='right'?x+w-.6:x+.6,y+h/2,'slope','marker-end="url(#slope-arrow)"');}
  else{const yy=s.direction==='down'?y:y+h;b+=l(x,yy,x+w,yy,'coping');b+=l(x+w/2,s.direction==='down'?y+.6:y+h-.6,x+w/2,s.direction==='down'?y+h-.6:y+.6,'slope','marker-end="url(#slope-arrow)"');}
  b+=`<circle class="start-disc" cx="${s.point[0]}" cy="${s.point[1]}" r=".82"/>${t(s.point[0],s.point[1]+.3,s.id,'start-text')}`;
 }
 b+=l(23,17,34,17,'rail');for(let i=0;i<4;i++)b+=`<circle class="support" cx="${23+i*11/3}" cy="17" r=".13"/>`;
 b+=r(25,31,10,.75,'pad')+r(25.13,31.13,9.74,.49,'padtop');
 b+=r(31,23,7,4,'pad')+r(31,23,1.2,4,'bank')+r(36.8,23,1.2,4,'bank')+r(32.2,23,4.6,4,'padtop');
 b+=l(31.25,25,32,25,'slope','marker-end="url(#slope-arrow)"')+l(37.75,25,37,25,'slope','marker-end="url(#slope-arrow)"');
 b+=`<path class="bank" d="M44 19H49V23H44Z"/><path class="coping" fill="none" d="M44 19 49 23"/>`;
 for(const [id,x,y]of [['R',28.5,15.5],['L',30,33.2],['P',34.5,28.7],['H',50.5,21]])b+=`<circle class="spot-disc" cx="${x}" cy="${y}" r=".67"/>${t(x,y+.26,id)}`;
 b+=t(20,22.5,'FLAT')+t(39,35.5,'FLAT');return b;}
function routeMap(card,view=true){let b='';const start=starts.find(s=>s.id===card.start),[sx,sy]=start.point;
 if(view){const a=Math.atan2(card.focus[1]-sy,card.focus[0]-sx),d=8,da=.15;const p=[sx+d*Math.cos(a-da),sy+d*Math.sin(a-da)],q=[sx+d*Math.cos(a+da),sy+d*Math.sin(a+da)];b+=`<path class="view-cone" d="M${sx} ${sy} L${p} A${d} ${d} 0 0 1 ${q}Z"/><path class="view-axis" d="M${sx} ${sy} L${card.focus}"/>`;}
 b+=`<path class="route-halo" d="${card.path}"/><path class="route" d="${card.path}"/>`;
 card.events.forEach((e,i)=>{b+=`<circle class="event" cx="${e.point[0]}" cy="${e.point[1]}" r=".9"/>${t(e.point[0],e.point[1]+.4,i+1,'event-label')}`;});return b;}
const spec={version:4,status:'draft — implantation et lignes à discuter',parkId:'lagoon',name:'Le Lagon',principle:'Les cartes représentent des lignes et des angles de vue, pas des zones séparées. Les équipements et les départs sont partagés.',outline,starts,sharedElements:[{id:'R',name:'Rail bas',position:[23,17,11,0]},{id:'L',name:'Ledge long',position:[25,31,10,.75]},{id:'P',name:'Îlot',position:[31,23,7,4],detail:'Pad avec deux accès inclinés et bords grindables'},{id:'H',name:'Hip bas',position:[44,19,5,4]}],cards,progression:{discovery:{pool:4,draw:2,levels:[1,2]},linking:{pool:6,draw:3,levels:[3,4,5]},finale:{pool:2,draw:1,levels:[6]}},routeMeaning:'Descente initiale pour prendre de l’élan, puis trois possibilités de tricks. Le joueur choisit ses cartes ; les trois points sont des exemples, pas une séquence imposée.',cameraMeaning:'Le cône indique un axe de cadrage proposé pour l’illustration, depuis la plateforme de départ.'};
writeFileSync(new URL('draft-v4.json',import.meta.url),JSON.stringify(spec,null,2)+'\n');
writeFileSync(new URL('park-base-v4.svg-fragment.txt',import.meta.url),baseMap());
function txt(x,y,value,size=16,weight=400,color='#264d56'){return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}">${value}</text>`;}
let overview=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1240" viewBox="0 0 1800 1240">${defs}<style>${css}</style><rect width="1800" height="1240" fill="#fcfcf7"/>${txt(70,63,'LE LAGON — DÉPARTS ET ÉQUIPEMENTS PARTAGÉS',31,700)}${txt(70,97,'PLAN DE DESSUS · DRAFT 04 · 12 CARTES / 4 DÉPARTS / 4 ÉQUIPEMENTS CENTRAUX',16)}<g transform="translate(90 235) scale(19.3)">${baseMap()}</g>`;
overview+=txt(515,170,'PLAGE / MER',17,400,'#4a8896');
overview+=`<path d="M650 1130v-65m-8 15 8-15 8 15" stroke="#214b54" stroke-width="2" fill="none"/>${txt(528,1160,'ACCÈS CÔTÉ VILLE',16,700)}`;
overview+=txt(1310,172,'DÉPARTS HAUTS',21,700);
starts.forEach((s,i)=>{const y=220+i*95;overview+=txt(1310,y,`${s.id} — ${s.name}`,20,700)+txt(1310,y+29,s.kind,15);});
overview+=txt(1310,662,'ÉQUIPEMENTS PARTAGÉS',21,700);
for(const [i,s]of spec.sharedElements.entries())overview+=txt(1310,711+i*50,`${s.id} — ${s.name}`,18,500);
overview+=txt(1310,955,'4 cartes de niveaux 1–2',17)+txt(1310,985,'6 cartes de niveaux 3–5',17)+txt(1310,1015,'2 cartes de niveau 6',17);
overview+=txt(70,1205,'Les mêmes départs et équipements sont réutilisés par plusieurs cartes ; les tracés détaillés sont sur la planche des 12 lignes.',15)+ '</svg>';
writeFileSync(new URL('park-shared-plan-v4.svg',import.meta.url),overview);
let atlas=`<svg xmlns="http://www.w3.org/2000/svg" width="1950" height="1960" viewBox="0 0 1950 1960">${defs}<style>${css}.map-label{font-size:1.4px}.start-text{font-size:1.5px}.event-label{font-size:1.4px}</style><rect width="1950" height="1960" fill="#fcfcf7"/>${txt(42,45,'LE LAGON — LES 12 LIGNES',28,700)}${txt(42,76,'Même park · tracés alternatifs · 1/2/3 : possibilités de tricks · cône : axe de vue proposé',16)}`;
for(const [i,c]of cards.entries()){const x=38+(i%3)*640,y=112+Math.floor(i/3)*455;atlas+=`<g transform="translate(${x} ${y})">${txt(0,22,`${String(c.id).padStart(2,'0')}  ${c.name}`,20,700)}${txt(0,49,`Niveaux ${c.level} · départ ${c.start}`,15)}<g transform="translate(65 88) scale(7.3)">${baseMap()}${routeMap(c)}</g>${txt(0,439,c.events.map((e,j)=>`${j+1} ${e.type}`).join('  ·  '),15)}</g>`;}
atlas+='</svg>';writeFileSync(new URL('park-routes-v4.svg',import.meta.url),atlas);
console.log('Created shared park, 12 routes, overview and atlas.');
