// Editable architectural-style concept plan. All equipment is drawn in plan;
// no perspective, elevation, hidden side faces or illustrative shadows.
import {readFileSync,writeFileSync} from 'node:fs';

const previous=JSON.parse(readFileSync(new URL('draft-v2.json',import.meta.url),'utf8'));
const scale=18,ox=112,oy=258,W=60,H=48;
const navy='#183c49',muted='#647a80',paper='#fcfcf8',light='#e2e8e7';
const groups={A:{name:'DÉCOUVERTE',levels:'1–2',color:'#148a93',fill:'#f2fafa'},B:{name:'ENCHAÎNEMENT',levels:'3–5',color:'#b67536',fill:'#fcf8f2'},C:{name:'FINALE',levels:'6',color:'#3c5887',fill:'#f3f6fb'}};
const thirds=[{x:2,w:52/3},{x:2+52/3+2,w:52/3},{x:2+104/3+4,w:52/3}];
const zones=[
 {id:1,source:1,group:'A',name:'Le Parvis',x:2,y:35,w:12.5,h:11,parts:'Flat · ledge · petit plan incliné'},
 {id:2,source:2,group:'A',name:'Le Rail des Dunes',x:16.5,y:35,w:12.5,h:11,parts:'Rail bas · flat · petite rampe'},
 {id:3,source:3,group:'A',name:'La Petite Vague',x:31,y:35,w:12.5,h:11,parts:'Plan incliné · ledge latéral · flat'},
 {id:4,source:4,group:'A',name:'L’Îlot',x:45.5,y:35,w:12.5,h:11,parts:'Pad · bords grindables · accès inclinés'},
 {id:5,source:5,group:'B',name:'Le Rail des Embruns',...thirds[0],y:25,h:8,parts:'Rail long · sortie en flat · bank'},
 {id:6,source:6,group:'B',name:'Le Hip du Soleil',...thirds[1],y:25,h:8,parts:'Hip bas · réception · ledge'},
 {id:7,source:7,group:'B',name:'Le Coping Bleu',...thirds[2],y:25,h:8,parts:'Quarter · coping · flat · petit ledge'},
 {id:8,source:8,group:'B',name:'Le Double Quai',...thirds[0],y:15,h:8,parts:'Deux ledges · flat · plan incliné'},
 {id:9,source:10,group:'B',name:'Les Trois Marches',...thirds[1],y:15,h:8,parts:'Trois marches · rail · bank · réception'},
 {id:10,source:11,group:'B',name:'L’Archipel',...thirds[2],y:15,h:8,parts:'Trois pads · bord grindable · accès incliné'},
 {id:11,source:9,group:'C',name:'La Traverse',x:2,y:2,w:27,h:11,parts:'Funbox · plans inclinés · ledge · flat'},
 {id:12,source:12,group:'C',name:'La Mini du Large',x:31,y:2,w:27,h:11,parts:'Demi-lune · flat latéral · ledge de sortie'}
];

const out=[];
const add=s=>out.push(s);
const fmt=n=>Number(n.toFixed(3));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const rect=(x,y,w,h,fill='none',stroke=navy,sw=.065,extra='')=>`<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const line=(x1,y1,x2,y2,stroke=navy,sw=.07,extra='')=>`<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const text=(x,y,s,size=.55,color=navy,extra='')=>`<text x="${fmt(x)}" y="${fmt(y)}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" ${extra}>${esc(s)}</text>`;
const poly=(pts,fill='none',stroke=navy,sw=.065,extra='')=>`<polygon points="${pts.map(p=>p.map(fmt).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
function pad(x,y,w,h){add(rect(x,y,w,h,'#e1e7e4'));add(rect(x+.13,y+.13,w-.26,h-.26,'#f9faf6','#859697',.035));}
function rail(x1,y1,x2,y2){add(line(x1,y1,x2,y2,navy,.16));for(let i=0;i<4;i++){const t=i/3;add(`<circle cx="${x1+(x2-x1)*t}" cy="${y1+(y2-y1)*t}" r=".13" fill="white" stroke="${navy}" stroke-width=".06"/>`);}}
function slopeArrow(x1,y1,x2,y2){add(line(x1,y1,x2,y2,'#6d8c92',.045,'marker-end="url(#rise)"'));}
function bank(x,y,w,h,direction='up'){
 add(rect(x,y,w,h,'url(#bank-hatch)'));
 if(direction==='left'||direction==='right'){
  const high=direction==='right'?x+w:x;add(line(high,y,high,y+h,navy,.12));
  slopeArrow(direction==='right'?x+w*.18:x+w*.82,y+h*.5,direction==='right'?x+w*.82:x+w*.18,y+h*.5);return;
 }
 const top=direction==='up'?y:y+h;
 add(line(x,top,x+w,top,navy,.12));
 const from=direction==='up'?y+h*.82:y+h*.18,to=direction==='up'?y+h*.18:y+h*.82;
 slopeArrow(x+w*.5,from,x+w*.5,to);
}
function quarter(x,y,w,h){
 add(rect(x,y,w,h,'url(#curve-hatch)'));
 add(rect(x,y-.65,w,.65,'#e9ece8'));
 add(line(x,y,x+w,y,navy,.16));
 for(const dx of [.25,.75])slopeArrow(x+w*dx,y+h*.84,x+w*dx,y+h*.16);
 add(text(x+w*.5,y+h*.58,'COURBE',.44,muted,'text-anchor="middle"'));
}
function halfpipe(x,y,len,w){
 const deck=1.3,trans=4,flat=len-2*(deck+trans);
 add(rect(x,y,len,w,'#fff'));
 add(rect(x,y,deck,w,'#e9ece8'));add(rect(x+len-deck,y,deck,w,'#e9ece8'));
 add(rect(x+deck,y,trans,w,'url(#curve-hatch)'));
 add(rect(x+deck+trans+flat,y,trans,w,'url(#curve-hatch)'));
 add(line(x+deck,y,x+deck,y+w,navy,.16));add(line(x+len-deck,y,x+len-deck,y+w,navy,.16));
 add(line(x+deck+trans,y,x+deck+trans,y+w,'#b2bfbf',.045));
 add(line(x+len-deck-trans,y,x+len-deck-trans,y+w,'#b2bfbf',.045));
 for(const fy of [.27,.73]){slopeArrow(x+deck+trans*.82,y+w*fy,x+deck+trans*.2,y+w*fy);slopeArrow(x+len-deck-trans*.82,y+w*fy,x+len-deck-trans*.2,y+w*fy);}
 add(text(x+len/2,y+w/2-.1,'FOND PLAT',.61,navy,'text-anchor="middle"'));
 add(text(x+len/2,y+w/2+.7,'sortie latérale',.43,muted,'text-anchor="middle"'));
}
function hip(x,y,w,h){
 add(poly([[x,y],[x+w,y],[x+w,y+h]],'url(#bank-hatch)'));
 add(poly([[x,y],[x+w,y+h],[x,y+h]],'#e9eeee'));
 add(line(x,y,x+w,y+h,navy,.13));
 slopeArrow(x+w*.74,y+h*.25,x+w*.42,y+h*.42);
 slopeArrow(x+w*.25,y+h*.74,x+w*.44,y+h*.48);
 add(text(x+w*.5,y+h+.7,'HIP',.45,muted,'text-anchor="middle"'));
}
function stairs(x,y,w,h){
 const tread=h/3;add(rect(x,y-.8,w,.8,'#eceee9'));
 add(rect(x,y,w,h,'#f6f5ed'));
 for(let i=1;i<=3;i++)add(line(x,y+tread*i,x+w,y+tread*i,navy,.11));
 rail(x+w*.56,y-.6,x+w*.56,y+h+.65);
 slopeArrow(x+w*.85,y+.35,x+w*.85,y+h-.25);
 add(text(x-.4,y+h*.55,'3',.54,navy,'text-anchor="end"'));
}
function funbox(x,y,w,h){
 const ix=x+2.4,iy=y+1.4,iw=w-4.8,ih=h-2.8;
 add(rect(x,y,w,h,'url(#bank-hatch)'));
 add(poly([[x,y],[ix,iy],[ix+iw,iy],[x+w,y]],'#f0f3ed'));
 add(poly([[x,y+h],[ix,iy+ih],[ix+iw,iy+ih],[x+w,y+h]],'#f0f3ed'));
 add(rect(ix,iy,iw,ih,'#fff'));
 for(const p of [[x,y,ix,iy],[x+w,y,ix+iw,iy],[x,y+h,ix,iy+ih],[x+w,y+h,ix+iw,iy+ih]])add(line(...p,'#8e9f9f',.045));
 add(line(ix,iy,ix+iw,iy,navy,.16));
 slopeArrow(x+.45,y+h/2,ix-.3,y+h/2);slopeArrow(x+w-.45,y+h/2,ix+iw+.3,y+h/2);
 add(text(ix+iw/2,iy+ih*.65,'PLATEAU',.48,muted,'text-anchor="middle"'));
}
function route(points){add(`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#2c8b9b" stroke-width=".075" stroke-dasharray=".28 .23" stroke-linecap="round" marker-end="url(#travel)"/>`);}
function flatLabel(x,y){add(text(x,y,'FLAT',.47,'#789195','text-anchor="middle" letter-spacing=".08"'));}

add(`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1420" viewBox="0 0 1800 1420"><defs>
 <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="#dfe6e4" stroke-width=".6"/></pattern>
 <pattern id="bank-hatch" width=".3" height=".3" patternUnits="userSpaceOnUse"><rect width=".3" height=".3" fill="#f1f5f3"/><path d="M0 .3 .3 0" stroke="#a6b6b5" stroke-width=".025"/></pattern>
 <pattern id="curve-hatch" width=".32" height=".32" patternUnits="userSpaceOnUse"><rect width=".32" height=".32" fill="#edf3f4"/><path d="M0 .08H.32 M0 .24H.32" stroke="#a0b4b8" stroke-width=".025"/></pattern>
 <marker id="rise" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 6 3 0 6" fill="none" stroke="#6d8c92" stroke-width="1"/></marker>
 <marker id="travel" viewBox="0 0 7 7" refX="6" refY="3.5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 7 3.5 0 7Z" fill="#2c8b9b"/></marker>
 </defs><rect width="1800" height="1420" fill="${paper}"/>`);
add(text(70,58,'LE LAGON',38,navy,'font-weight="bold"'));
add(text(70,89,'PLAN D’IMPLANTATION — DRAFT 03',19,muted,'letter-spacing="1.2"'));
add(text(1210,58,'VUE STRICTEMENT DE DESSUS',16,navy,'font-weight="bold"'));
add(text(1210,87,'12 zones · 4 découverte / 6 enchaînement / 2 finales',14,muted));
// Setting is shown only with plan symbols: no sky, horizon or perspective.
add(rect(ox,119,W*scale,57,'#e8f5f8','none',0));
for(let y=133;y<175;y+=15)add(`<path d="M${ox} ${y} ${Array.from({length:18},()=>`q15 -4 30 0t30 0`).join(' ')}" stroke="#b8dce4" stroke-width="1" fill="none"/>`);
add(text(ox+W*scale/2,155,'PLAGE / MER',14,'#3e7988','text-anchor="middle" letter-spacing="2"'));
add(rect(ox,184,W*scale,28,'#f2f1e9','#aab8b4',.8));
add(text(ox+W*scale/2,203,'PROMENADE PIÉTONNE — PALMIERS ET BANCS',11,muted,'text-anchor="middle" letter-spacing="1"'));
for(const px of [150,300,1050,1160]){add(`<circle cx="${px}" cy="198" r="10" fill="${paper}" stroke="#7d9d8a" stroke-width="1"/>`);for(let a=0;a<8;a++){const t=a*Math.PI/4;add(line(px,198,px+Math.cos(t)*8,198+Math.sin(t)*8,'#7d9d8a',.6));}}
// Overall proposed dimensions and north arrow.
add(line(ox,232,ox+W*scale,232,muted,1));
for(const x of [ox,ox+W*scale]){add(line(x,223,x,241,muted,1));add(line(x,243,x,oy-6,'#b7c4c4',.7));}
add(rect(ox+W*scale/2-76,220,152,21,paper,'none',0));
add(text(ox+W*scale/2,235,'60 m — PROVISOIRE',12,muted,'text-anchor="middle"'));
add(line(83,oy,83,oy+H*scale,muted,1));for(const y of [oy,oy+H*scale])add(line(75,y,91,y,muted,1));
add(text(61,oy+H*scale/2,'48 m',12,muted,`text-anchor="middle" transform="rotate(-90 61 ${oy+H*scale/2})"`));
add(`<path d="M1217 192v-55m-8 15 8-15 8 15" stroke="${navy}" stroke-width="1.7" fill="none"/>`);add(text(1217,126,'N',17,navy,'text-anchor="middle" font-weight="bold"'));

add(`<g id="park-plan" transform="translate(${ox} ${oy}) scale(${scale})">`);
add(rect(0,0,W,H,'#fff',navy,.12));
for(let x=0;x<=W;x+=2)add(line(x,0,x,H,'#edf0ee',.025));
for(let y=0;y<=H;y+=2)add(line(0,y,W,y,'#edf0ee',.025));
for(const zone of zones){const g=groups[zone.group];add(`<g id="zone-${String(zone.id).padStart(2,'0')}"><title>${esc(zone.name)} — niveaux ${g.levels}</title>`);add(rect(zone.x,zone.y,zone.w,zone.h,g.fill,g.color,.065,'stroke-dasharray=".32 .24" rx=".3"'));add(`<circle cx="${zone.x+.78}" cy="${zone.y+.8}" r=".58" fill="${g.color}"/>`);add(text(zone.x+.78,zone.y+1.0,String(zone.id).padStart(2,'0'),.52,'white','text-anchor="middle" font-weight="bold"'));add(text(zone.x+1.66,zone.y+1.0,zone.name,.61,g.color,'font-weight="bold"'));add('</g>');}

// Four discovery microzones near the entrance.
bank(3.5,37.1,3.2,2.4);pad(11,38.1,.75,4.7);flatLabel(7.8,43.4);route([[5.3,44.6],[9.6,42.7],[10.3,40],[7.6,40],[5.1,39.1]]);
rail(18.6,39.1,25.5,39.1);bank(24.1,42,3.0,2.2);flatLabel(20.4,44.5);route([[18,38.2],[24.5,38.2],[26.8,40.6],[25.6,43.7]]);
bank(32.7,37.2,5.4,2.8);pad(40.4,40.6,.7,3.6);flatLabel(35.5,43.5);route([[35.5,38.7],[35.5,42.1],[39.8,42.1],[39.8,44.6]]);
pad(48.7,39.1,4.4,2.8);bank(47.1,39.1,1.6,2.8,'right');bank(53.1,39.1,1.6,2.8,'left');flatLabel(51.1,44.1);route([[47.6,43.8],[48,40.7],[52.4,40.7],[54.5,42.5],[55.6,44.6]]);
// Six linking microzones.
rail(4.1,28.0,12.5,28.0);bank(14.8,29.4,2.7,2.1);flatLabel(8.2,31.6);route([[3.4,27.1],[11.7,27.1],[13.7,30.4],[16.1,31.2]]);
hip(23.8,26.9,4.8,3.2);pad(31.1,30.2,5.0,.7);flatLabel(33.2,28.6);route([[23.1,31.3],[26.2,28.7],[30.3,28.7],[31.6,29.7],[35.7,29.7]]);
quarter(42.8,26.8,7.2,2.8);pad(52.1,30.6,4.3,.7);flatLabel(47.6,31.7);route([[45.4,28.8],[45.4,30.7],[50.8,30.7],[52.6,30.0],[56.3,30.0]]);
pad(4.3,17.8,5.0,.8);pad(11.5,20.1,5.0,.8);bank(12.6,16.5,3.0,1.8);flatLabel(7.6,21.8);route([[3.7,17.1],[9.7,17.1],[10.4,19.4],[14.1,19.4],[14.1,17.3]]);
stairs(24.4,17.4,5.0,2.8);bank(32.5,17.6,3.5,2.6);flatLabel(27.0,22.0);route([[25.1,16.8],[25.1,20.9],[30.7,21.7],[34.2,19.4]]);
pad(42.7,17.1,3.2,1.8);pad(48.2,19.8,3.6,1.8);pad(53.5,16.6,2.9,2.5);bank(53.5,19.1,2.9,1.6,'down');flatLabel(46.6,22.0);route([[43.3,20.8],[44.0,18.2],[47.2,19.2],[49.3,21.0],[54.8,21.4],[54.8,18.2]]);
// Two larger finale zones facing the promenade.
funbox(6.5,5.4,10.6,4.8);pad(21.6,5.2,.8,5.7);flatLabel(24.7,9.4);route([[4.3,8.9],[8.2,7.8],[14.5,7.8],[19.7,9.6],[21.0,7.2],[24.9,6.4]]);
halfpipe(34.2,4.2,18.0,6.4);pad(46,11.7,6.1,.65);flatLabel(40.2,12.0);route([[43.2,5.4],[43.2,9.4],[43.2,11.7],[45.2,11.0],[51.9,11.0]]);
// Entry opening; no physical partitions separate the twelve zones.
add(line(28.3,H,31.7,H,'#fff',.28));
add(line(30,H+1.6,30,H-.3,'#2c8b9b',.12,'marker-end="url(#travel)"'));
add('</g>');
add(text(ox+W*scale/2,1172,'ACCÈS PRINCIPAL — CÔTÉ VILLE',13,navy,'text-anchor="middle" font-weight="bold"'));
// Legend and scale bar.
add(text(112,1220,'LÉGENDE DU PLAN',16,navy,'font-weight="bold"'));
add(`<g transform="translate(112 1243) scale(18)">`);pad(0,0,2,.55);rail(5.0,.28,7.2,.28);bank(11.1,-.35,2.2,1.2);add(rect(18.2,-.35,2.2,1.2,'url(#curve-hatch)'));add(rect(25.4,-.35,2.5,1.2,'none','#148a93',.07,'stroke-dasharray=".25 .2"'));route([[33,-.2],[35.3,.6]]);add('</g>');
for(const [x,label] of [[112,'Pad / ledge'],[202,'Rail'],[312,'Plan incliné'],[440,'Transition courbe'],[570,'Zone de carte'],[706,'Ligne possible']])add(text(x,1290,label,11,muted));
add(text(112,1335,'Les pointillés délimitent les cartes, pas des cloisons. Les lignes de roulage sont des exemples.',12,muted));
const bx=920,by=1310;for(let i=0;i<2;i++)add(rect(bx+i*90,by,90,10,i?'white':navy,navy,1));
for(let i=0;i<3;i++){add(line(bx+i*90,by-3,bx+i*90,by+16,navy,1));add(text(bx+i*90,by+32,String(i*5)+' m',11,muted,'text-anchor="middle"'));}
add(text(bx,1370,'Échelle graphique — dimensions de travail',11,muted));

// Right-hand schedule: all twelve zones, grouped 4 / 6 / 2.
add(line(1243,112,1243,1370,'#cbd6d3',1));
let sy=146;
for(const groupId of ['A','B','C']){
 const group=groups[groupId],list=zones.filter(z=>z.group===groupId);
 add(text(1280,sy,`${group.name} · NIVEAUX ${group.levels}`,17,group.color,'font-weight="bold"'));
 add(text(1280,sy+23,`${list.length} cartes dans le paquet`,12,muted));sy+=54;
 for(const z of list){add(`<circle cx="1294" cy="${sy+2}" r="14" fill="${group.color}"/>`);add(text(1294,sy+7,String(z.id).padStart(2,'0'),12,'white','text-anchor="middle" font-weight="bold"'));add(text(1321,sy+6,z.name,17,navy,'font-weight="bold"'));add(text(1321,sy+29,z.parts,12,muted));sy+=60;}
 sy+=23;
}
add(rect(1279,1125,449,224,'#f6f7f1','#aebeba',1));
add(text(1300,1154,'LE LAGON / SK8 HEROES',19,navy,'font-weight="bold"'));
add(line(1300,1171,1705,1171,'#c2cfcb',1));
add(text(1300,1197,'Document : plan d’implantation',14,navy));
add(text(1300,1225,'Révision : D03 — proposition',14,navy));
add(text(1300,1253,'Emprise de travail : 60 × 48 m',14,navy));
add(text(1300,1281,'Cotes et équipements : à ajuster',14,muted));
add(text(1300,1315,'Chaque zone offre Kick, Slide et Air.',13,navy,'font-weight="bold"'));
add(text(70,1394,'PLAN VECTORIEL MODIFIABLE · IMPLANTATION PROPOSÉE',11,muted,'letter-spacing="1"'));
add('</svg>');

writeFileSync(new URL('park-top-plan-v3.svg',import.meta.url),out.join('\n'));
const spec={...previous,version:3,status:'draft — plan de dessus à discuter, non intégré au moteur',planImage:'park-top-plan-v3.png',editablePlan:'park-top-plan-v3.svg',layout:{orientation:'Plage et promenade au nord ; entrée côté ville au sud.',proposedWidthMetres:W,proposedDepthMetres:H,dimensionsStatus:'Emprise provisoire à ajuster',zoneBoundaries:'Repères des douze cartes ; aucune cloison physique.',view:'Projection orthographique de dessus, sans perspective.'},progression:{discovery:{levels:[1,2],draw:2,pool:4},linking:{levels:[3,4,5],draw:3,pool:6},finale:{levels:[6],draw:1,pool:2}},spots:zones.map(z=>{const source=previous.spots.find(s=>s.id===z.source);return {...source,id:z.id,sourceSpotV2:z.source,name:z.name,levels:z.group==='A'?[1,2]:z.group==='B'?[3,4,5]:[6],planBounds:{x:z.x,y:z.y,width:z.w,depth:z.h},equipment:z.parts};}),generation:{mode:'Code-native SVG architectural-style diagram',generator:'draw-top-plan-v3.mjs'}};
writeFileSync(new URL('draft-v3.json',import.meta.url),JSON.stringify(spec,null,2)+'\n');
console.log('Created park-top-plan-v3.svg and draft-v3.json: 4 discovery / 6 linking / 2 finale.');
