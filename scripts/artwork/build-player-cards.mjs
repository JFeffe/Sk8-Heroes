import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {SKATERS} from '../../public/skaters.js';
import {trophyIcon} from '../../public/icons.js';
import {SPECIALTIES,specialtyIcon} from '../../public/specialties.js';
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp');
const root=new URL('../../',import.meta.url),folder=new URL('artwork/cards/players/poker-v1/',root);
await mkdir(folder,{recursive:true});
const cream='#fff7df',navy='#063e50';
const text=(x,y,s,size=55,extra='')=>`<text x="${x}" y="${y}" font-family="Impact,Arial Narrow,sans-serif" font-size="${size}" fill="${navy}" ${extra}>${s}</text>`;
const svg=(width,height,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><clipPath id="edge"><rect width="${width}" height="${height}" rx="48"/></clipPath></defs><g clip-path="url(#edge)"><rect width="${width}" height="${height}" fill="${cream}"/>${body}</g></svg>`;
async function save(key,source){await writeFile(new URL(key+'.svg',folder),source);await sharp(Buffer.from(source)).png().toFile(fileURLToPath(new URL(key+'.png',folder)));}
// Portrait artwork occupies a dedicated window so the name never covers the face.
for(const skater of SKATERS){
 const art=(await sharp(await readFile(new URL('public/'+skater.image,root))).png().toBuffer()).toString('base64');
 const body=`<image x="20" y="170" width="968" height="840" preserveAspectRatio="xMidYMin slice" href="data:image/png;base64,${art}"/><path d="M0 0H1008V180H0Z" fill="${navy}"/>${text(60,126,skater.name,100,'style="fill:'+cream+'"')}<rect y="170" width="1008" height="16" fill="${skater.color}"/><rect x="0" y="1008" width="1008" height="400" fill="${cream}"/><path d="M0 1008H1008" stroke="${skater.color}" stroke-width="16"/>${['±1','↻','❄'].map((mark,i)=>`<circle cx="${180+i*324}" cy="1200" r="123" fill="none" stroke="${navy}" stroke-width="5" stroke-dasharray="12 9"/>${text(180+i*324,1229,mark,90,'text-anchor="middle"')}`).join('')}<rect x="12" y="12" width="984" height="1384" rx="40" fill="none" stroke="${cream}" stroke-width="24"/>`;
 await save('skater-'+skater.id,svg(1008,1408,body));
 const power=SPECIALTIES[skater.id],words=power.text.split(' '),lines=[''];
 for(const word of words){if((lines.at(-1)+' '+word).trim().length>43)lines.push(word);else lines[lines.length-1]=(lines.at(-1)+' '+word).trim();}
 const powerIcon=specialtyIcon(skater.id).replace('class="specialty-icon"',`x="58" y="698" width="82" height="82" color="${navy}"`);
 const rules=lines.map((line,i)=>`<text x="58" y="${826+i*39}" font-family="Arial,sans-serif" font-size="35" fill="${navy}">${line}</text>`).join('');
 const advanced=body.replace('height="840"','height="510"')+`<rect x="20" y="684" width="968" height="314" rx="12" fill="${cream}"/>${powerIcon}${text(162,753,power.name,57)}${rules}${text(58,984,power.passive?'PASSIF · TOUTE LA PARTIE':'1 FOIS PAR MODULE · PARMI LES 2 ESSAIS',31)}`;
 await save('skater-'+skater.id+'-advanced',svg(1008,1408,advanced));
 for(const used of [false,true]){
  const fill=used&&!power.passive?'#eeeeee':skater.color,ink=used&&!power.passive?'#222222':skater.ink;
  const symbol=specialtyIcon(skater.id).replace('class="specialty-icon"',`x="90" y="65" width="220" height="220" color="${ink}"`);
  await save('specialty-'+skater.id+(used?'-back':'-front'),svg(400,400,`<circle cx="200" cy="200" r="184" fill="${fill}" stroke="${ink}" stroke-width="12"/>${symbol}<text x="200" y="333" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="30" fill="${ink}">${power.passive?'PASSIF':used?'UTILISÉ':'DISPONIBLE'}</text>`));
 }
}
const art=(await readFile(new URL('artwork/parks/le-lagon/overview/park-overview.png',root))).toString('base64');
const cell=(x,y,w,h,label)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${cream}" fill-opacity=".94" stroke="${navy}" stroke-width="3"/>${text(x+22,y+h*.68,label,h*.58)}`;
const tens=[30,20,10,0].map((n,i)=>cell(56,234+i*177,300,161,String(n).padStart(2,'0'))).join('');
const units=Array.from({length:10},(_,n)=>cell(826+(n%2)*264,234+(4-Math.floor(n/2))*142,250,127,String(n))).join('');
await save('park-le-lagon',svg(1408,1008,`<image width="1408" height="1008" href="data:image/png;base64,${art}"/><rect width="1408" height="186" fill="${navy}" fill-opacity=".96"/>${text(704,132,'LE LAGON',106,'text-anchor="middle" style="fill:'+cream+'"')}${tens}${units}<rect x="12" y="12" width="1384" height="984" rx="40" fill="none" stroke="${cream}" stroke-width="24"/>`));
const trophy=trophyIcon().replace('class="trophy-icon"','x="75" y="75" width="250" height="250"');
await save('trophy-token',svg(400,400,`<circle cx="200" cy="200" r="184" fill="#f0bd4d" stroke="#946217" stroke-width="16"/><circle cx="200" cy="200" r="162" fill="none" stroke="${cream}" stroke-width="5"/>${trophy}`));
await writeFile(new URL('manifest.json',folder),JSON.stringify({trimMm:{skater:[63,88],park:[88,63]},rasterSize:{skater:[1008,1408],park:[1408,1008]},trophyToken:{value:1,suggestedDiameterMm:18},cards:[...SKATERS.map(s=>'skater-'+s.id),'park-le-lagon'],markersPerPlayer:2,scoreTrack:{tens:[30,20,10,0],units:[8,9,6,7,4,5,2,3,0,1],readingOrder:'top-to-bottom, left-to-right'},note:'Trim artwork only; no bleed or imposed print sheets.'},null,2));
await writeFile(new URL('advanced-manifest.json',folder),JSON.stringify({mode:'advanced',trimMm:[63,88],rasterSize:[1008,1408],specialtyTokenDiameterMm:20,reset:'Active powers reset every module; Sol is passive and never flips',skaters:SKATERS.map(s=>({id:s.id,card:'skater-'+s.id+'-advanced',power:SPECIALTIES[s.id],token:{front:'specialty-'+s.id+'-front',back:'specialty-'+s.id+'-back'}}))},null,2));
console.log('Exported 6 Base skaters, 6 Advanced skaters, 6 two-sided specialty tokens, 1 park and 1 trophy token.');
