import {POKER,CARD_SIDE,CARD_VIEW_WIDTH} from '../../public/card-format.js';
import assert from 'node:assert/strict';
import {TRICKS} from '../../public/trick-catalog.js';
import {printedOdds,printedPercent} from '../../public/physical-table.js';
import {typeIcon} from '../../public/icons.js';
export function createCardTemplate(sharp){
const W=900,H=1300,C={cream:'#fff7df',navy:'#063e50',aqua:'#31c4c3',pale:'#a6e2da',orange:'#ff742b'};
const alignment={badge:{transform:'rotate(-1.3 250 217)',labelX:169,chanceX:358,centerY:217,fontSize:40},requirement:{centerX:321,headingY:994.5,socketY:1073},score:{centerX:733,headingY:994.5,bodyTop:1019,bodyBottom:1166,numberSize:118,unitSize:25,gap:10}};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const svg=(body,title='')=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${POKER.widthPx}" height="${POKER.heightPx}" viewBox="${-CARD_SIDE} 0 ${CARD_VIEW_WIDTH} ${H}" role="img"><title>${esc(title)}</title>${body}<rect x="${-CARD_SIDE}" y="0" width="${CARD_SIDE}" height="${H}" fill="${C.cream}"/><rect x="900" y="0" width="${CARD_SIDE}" height="${H}" fill="${C.cream}"/></svg>`;
const text=(x,y,value,size=36,fill=C.navy,extra='')=>`<text x="${x}" y="${y}" fill="${fill}" ${extra.includes('font-family=')?'':'font-family="Impact,Arial Narrow,sans-serif"'} font-size="${size}" font-weight="400" ${extra}>${esc(value)}</text>`;
function roundRect(x,y,w,h,r){return `M${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x+r}Q${x} ${y+h} ${x} ${y+h-r}V${y+r}Q${x} ${y} ${x+r} ${y}Z`;}
function sockets(cost){const size=cost===2?128:cost===3?116:106,gap=cost===2?42:cost===3?32:18,start=alignment.requirement.centerX-(cost*size+(cost-1)*gap)/2;return Array.from({length:cost},(_,i)=>({x:start+i*(size+gap),y:1025,size,height:96}));}
// Use rendered ink bounds rather than a guessed SVG baseline. This keeps
// different numerals and socket symbols visually centered in the same frame.
const inkCache=new Map();
async function ink(value,size){
 const key=size+':'+value;if(inkCache.has(key))return inkCache.get(key);
 const probe=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="300">${text(100,200,value,size,'white')}</svg>`;
 const {data,info}=await sharp(Buffer.from(probe)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=-1,bottom=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 assert(right>=left&&bottom>=top);const result={x:left-100,y:top-200,width:right-left+1,height:bottom-top+1};inkCache.set(key,result);return result;
}
async function centeredText(cx,cy,value,size,fill=C.navy,extra='',capAlign=false){
 const bounds=await ink(value,size),vertical=capAlign?await ink('H',size):bounds;
 return text(cx-bounds.x-(bounds.width-1)/2,cy-vertical.y-(vertical.height-1)/2,value,size,fill,extra);
}
function speckles(seed,count,box,color,opacity){let result='';for(let i=0;i<count;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const a=seed/2**32;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const b=seed/2**32;result+=`<circle cx="${(box[0]+a*box[2]).toFixed(1)}" cy="${(box[1]+b*box[3]).toFixed(1)}" r="${(.6+a*1.8).toFixed(1)}" fill="${color}" opacity="${opacity}"/>`;}return result;}
function graphics(card){
 const slots=card.kind==='module'?'':sockets(card.cost).map(s=>`<rect x="${s.x}" y="${s.y}" width="${s.size}" height="${s.height}" rx="16" fill="${C.cream}" fill-opacity=".96" stroke="${C.cream}" stroke-width="5"/>`).join('');
 return `<defs><clipPath id="inside"><rect x="28" y="28" width="844" height="1244" rx="40"/></clipPath><clipPath id="score-cap"><rect x="612" y="970" width="242" height="196" rx="23"/></clipPath></defs>
 <g clip-path="url(#inside)">
 <path d="M28 30H872V169C762 214 673 175 596 177C432 158 290 220 28 184Z" fill="${C.navy}" fill-opacity=".97"/>
 <path d="M27 185C255 222 418 166 588 179C711 186 758 214 877 165" fill="none" stroke="${C.cream}" stroke-width="12"/>
 <path d="M27 195C255 231 418 176 588 189C711 196 758 225 877 175" fill="none" stroke="${C.aqua}" stroke-width="8"/>
 ${speckles(11,165,[30,30,840,162],C.cream,.15)}
 ${card.kind==='module'?`<path d="M82 183L412 176Q457 176 445 211L435 239Q430 250 407 251L79 259Q47 259 51 231L56 208Q58 185 82 183Z" fill="${[C.orange,'#3688dc','#9663bf'][card.stage??0]}" stroke="${C.cream}" stroke-width="8"/>`:`<rect x="55" y="205" width="235" height="${70+[6,4,3,2].filter(n=>n>=card.cost).length*43}" rx="15" fill="${C.cream}" stroke="${C.navy}" stroke-width="3"/><path d="M70 205H275Q290 205 290 220V239H55V220Q55 205 70 205" fill="${C.orange}"/>${[6,4,3,2].filter(n=>n>=card.cost).map((n,i)=>`<path d="M67 ${240+(i+1)*43}H278" stroke="${C.navy}" stroke-opacity=".18"/>`).join('')}<rect x="690" y="205" width="171" height="54" rx="12" fill="${({base:C.orange,advanced:'#3688dc',epic:'#9663bf'})[card.tier]||C.orange}" stroke="${C.cream}" stroke-width="5"/>`}
 <circle cx="780" cy="119" r="79" fill="${C.navy}" stroke="${C.cream}" stroke-width="10"/>
 <path d="M713 74A79 79 0 0 1 859 127" fill="none" stroke="${C.aqua}" stroke-width="5"/>
 <path d="M28 1170C223 1139 354 1192 502 1178C652 1164 750 1130 872 1165V1273H28Z" fill="${C.pale}" fill-opacity=".96"/>
 <path d="M28 1182C106 1195 135 1249 240 1265C394 1290 574 1235 710 1250C772 1257 831 1244 872 1215V1273H28Z" fill="${C.navy}"/>
 <path d="M28 1229C133 1201 164 1297 306 1275C421 1258 480 1250 590 1266C722 1284 805 1197 873 1200" stroke="${C.cream}" stroke-width="11" fill="none"/>
 <path d="M28 1213C131 1189 193 1273 300 1257C413 1240 507 1255 613 1247C746 1237 802 1173 873 1187" stroke="${C.aqua}" stroke-width="13" fill="none"/>
 ${speckles(53,125,[30,1170,840,103],C.navy,.11)}
 <rect x="35" y="959" width="830" height="218" rx="34" fill="${C.cream}"/>
 <rect x="45" y="970" width="552" height="196" rx="23" fill="${C.orange}" fill-opacity=".96"/>
 ${speckles(71,105,[50,978,540,181],C.cream,.17)}
 ${card.kind==='module'?`<g id="module-podium">
 <g clip-path="url(#score-cap)">
  <rect x="612" y="970" width="242" height="196" fill="${C.orange}"/>
  <rect x="612" y="970" width="242" height="49" fill="${C.navy}"/>
 </g>
 <rect x="612" y="970" width="242" height="196" rx="23" fill="none" stroke="${C.navy}" stroke-width="4"/>
 </g>`:`<rect x="612" y="970" width="242" height="196" rx="23" fill="${C.cream}" stroke="${C.navy}" stroke-width="4"/>
 <rect x="612" y="970" width="242" height="49" fill="${C.navy}" clip-path="url(#score-cap)"/>`}
 ${slots}
 ${card.kind==='module'?`<rect x="275" y="1186" width="350" height="61" rx="28" fill="${C.cream}" fill-opacity=".78"/>`:card.effect?`<rect x="150" y="1186" width="600" height="61" rx="28" fill="${C.cream}" fill-opacity=".72"/>`:''}
 </g><path d="${roundRect(0,0,W,H,65)} ${roundRect(28,28,844,1244,40)}" fill="${C.cream}" fill-rule="evenodd"/>`;
}
function icon(type,x,y,size,color=C.cream){return `<g color="${color}">${typeIcon(type).replace('<svg ',`<svg x="${x}" y="${y}" width="${size}" height="${size}" `)}</g>`;}
function freezeToken(x,y){let branches='';for(let i=0;i<6;i++)branches+=`<g transform="rotate(${i*60})"><path d="M0 0V-19M0-11L-6-15M0-11L6-15" fill="none" stroke="${C.cream}" stroke-width="3.2" stroke-linecap="round"/></g>`;return `<g transform="translate(${x} ${y})"><circle r="30" fill="${C.navy}" stroke="${C.aqua}" stroke-width="4"/><circle r="24" fill="none" stroke="${C.cream}" stroke-opacity=".65" stroke-width="1.5"/>${branches}</g>`;}
function tokenSymbol(type,x,y){
 if(type==='freeze')return freezeToken(x,y);
 const mark=type==='adjust'?text(0,12,'±1',31,C.cream,'text-anchor="middle"'):'<path d="M-17-6A19 19 0 1 1-14 13M-17-6V-20M-17-6H-3" fill="none" stroke="'+C.cream+'" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
 return `<g transform="translate(${x} ${y})"><circle r="30" fill="${C.navy}" stroke="${C.aqua}" stroke-width="4"/>${mark}</g>`;
}
async function information(card){
 const chance=(card.p*100).toFixed(card.p>.99&&card.p<1?1:card.p>.9?0:1).replace('.',',');let titleSize=card.name.length>10?89:102;
 const titleBounds=await ink(card.name,titleSize);if(titleBounds.width>626)titleSize=Math.floor(titleSize*626/titleBounds.width);
 const slotText=(await Promise.all(sockets(card.cost).map((s,i)=>centeredText(s.x+s.size/2,alignment.requirement.socketY,card.symbols[i],card.cost===4?62:card.symbols[i].length>2?49:68,C.navy,`id="socket-${i}"`)))).join('');
 const rows=printedOdds(card.id===undefined?{...card,id:TRICKS.find(c=>c.name===card.name).id}:card);
 const badge=`<g id="badge-information">${await centeredText(172.5,223,'DÉS / CHANCE',26)}${(await Promise.all(rows.map(async(row,i)=>`${await centeredText(92,261+i*43,String(row.dice),31)}${await centeredText(210,261+i*43,printedPercent(row.probability),31)}`))).join('')}${await centeredText(172.5,257+rows.length*43,'SANS JOKER / BONUS',18)}${await centeredText(775.5,232,card.tierLabel,32,card.tier==='base'?C.navy:C.cream,'id="badge-label"')}</g>`;

 const digit=await ink(card.printedPoints,alignment.score.numberSize),unit=await ink('PTS',alignment.score.unitSize);
 const groupHeight=digit.height+alignment.score.gap+unit.height,groupTop=alignment.score.bodyTop+(alignment.score.bodyBottom-alignment.score.bodyTop-groupHeight)/2;
 const score=await centeredText(alignment.score.centerX,groupTop+(digit.height-1)/2,card.printedPoints,alignment.score.numberSize,C.navy,'id="card-score"');
 const units=await centeredText(alignment.score.centerX,groupTop+digit.height+alignment.score.gap+(unit.height-1)/2,'PTS',alignment.score.unitSize,C.navy,'id="score-unit"');
 let bonus='';
 if(card.effect?.startsWith('token:'))bonus=text(188,1234,'+1',51)+tokenSymbol(card.effect.split(':')[1],286,1218)+text(341,1231,'FIN DU MODULE',35);
 else if(card.effect?.startsWith('point:'))bonus=text(254,1233,'+1 si autre',43)+icon(card.effect.split(':')[1],585,1191,56,C.navy);
 return `<g>${text(59,141,card.name,titleSize,C.cream,'id="card-title"')}${icon(card.type,731,69,97)}
 ${badge}
 ${await centeredText(alignment.requirement.centerX,alignment.requirement.headingY,'COMBINAISON',35,C.navy,'id="requirement-heading"')}${slotText}
 ${text(alignment.requirement.centerX,1152,card.rule,card.rule.length>31?27:29,C.navy,'text-anchor="middle" font-family="Arial Narrow,Segoe UI,sans-serif"')}
 ${await centeredText(alignment.score.centerX,alignment.score.headingY,'SCORE',35,C.cream,'id="score-heading"')}<g id="score-information">${score}${units}</g>${bonus}</g>`;
}
return {W,H,C,alignment,svg,sockets,graphics,information,ink,centeredText,text,icon};
}
