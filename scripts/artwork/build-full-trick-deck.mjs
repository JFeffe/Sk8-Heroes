import assert from 'node:assert/strict';
import {readFile,writeFile as writeFileOnce,mkdir,access} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {TRICKS} from '../../public/trick-catalog.js';
import {createCardTemplate} from './trick-card-template.mjs';
import {versionTrickAssets} from './version-trick-assets.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),output=path.join(root,'artwork/cards/tricks/deck-v1'),publicFolder=path.join(root,'public/assets/tricks');
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp'),template=createCardTemplate(sharp),{svg,graphics,information,sockets}=template;
// Synced Windows folders can briefly lock an output while it is being indexed.
async function writeFile(...args){
 for(let attempt=0;;attempt++)try{return await writeFileOnce(...args);}catch(error){
  if(attempt===4||!['EBUSY','EPERM','UNKNOWN'].includes(error.code))throw error;
  await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));
 }
}
const missing=[];for(const c of TRICKS)try{await access(path.join(output,'illustrations',c.key+'.png'));}catch{missing.push(c.name);}
assert.equal(missing.length,0,'Missing illustrations: '+missing.join(', '));
await mkdir(path.join(publicFolder,'frames'),{recursive:true});
for(const tier of ['base','advanced','epic'])for(const cost of [2,3,4])for(const bonus of [false,true])await writeFile(path.join(publicFolder,'frames',tier+'-'+cost+'-'+(bonus?'bonus':'plain')+'.svg'),svg(graphics({tier,cost,effect:bonus?'template':''}),`Cadre ${cost} dés`));
const tierLabel={base:'BASE',advanced:'AVANCÉ',epic:'ÉPIQUE'},manifest=[];
for(const c of TRICKS){
 c.layers.graphics=`assets/tricks/frames/${c.tier}-${c.cost}-${c.comboBonus?'bonus':'plain'}.svg`;
 const target=path.join(publicFolder,c.key),authoring=path.join(output,c.key);await mkdir(target,{recursive:true});await mkdir(authoring,{recursive:true});
 const master=await readFile(path.join(output,'illustrations',c.key+'.png'));
 const card={...c,printedPoints:c.points,p:c.p6,effect:c.comboBonus?.kind==='reward'?'token:'+c.comboBonus.type:c.comboBonus?.kind==='companion'?'point:'+c.comboBonus.type:'',tierLabel:tierLabel[c.tier]};
 const art=`<defs><clipPath id="card-shape"><rect width="900" height="1300" rx="65"/></clipPath></defs><image width="900" height="1300" preserveAspectRatio="xMidYMid slice" clip-path="url(#card-shape)" href="data:image/png;base64,${master.toString('base64')}"/>`;
 const graph=graphics(card),info=await information(card),bodies=[art,graph,info],names=['01-illustration','02-graphisme','03-textes-symboles'];
 assert(!/<text\b|<image\b/.test(graph));assert(!/<image\b/.test(info));
 const raster=[];
 for(let i=0;i<3;i++){const source=svg(bodies[i],names[i]);await writeFile(path.join(authoring,names[i]+'.svg'),source);raster.push(await sharp(Buffer.from(source)).png().toBuffer());}
 await writeFile(path.join(target,'01-illustration.webp'),await sharp(raster[0]).webp({quality:88}).toBuffer());
 const textWebp=await sharp(Buffer.from(svg(info)),{density:144}).webp({lossless:true,effort:4}).toBuffer();await writeFile(path.join(target,'03-textes-symboles.webp'),textWebp);
 const meta=await sharp(textWebp).metadata();assert.equal(meta.width,2016);assert.equal(meta.height,2816);assert(meta.hasAlpha);
 const assembled=await sharp(raster[0]).composite([{input:raster[1]},{input:raster[2]}]).png().toBuffer();await writeFile(path.join(authoring,'carte-assemblee.png'),assembled);
 await writeFile(path.join(authoring,'card.json'),JSON.stringify({...card,sockets:sockets(c.cost),layerSize:[1008,1408],trimMm:[63,88],layerOrder:names},null,2));
 manifest.push({id:c.id,key:c.key,name:c.name,type:c.type,tier:c.tier,copies:c.copies,cost:c.cost,points:c.points,layers:c.layers,textResolution:[2016,2816],sockets:sockets(c.cost)});
 if(manifest.length%8===0)console.log(JSON.stringify({built:manifest.length,total:41}));
}
await writeFile(path.join(output,'manifest.json'),JSON.stringify({unique:41,physical:85,templateVersion:1,templateRevision:4,canvas:[900,1300],trimMm:[63,88],rasterSize:[1008,1408],cards:manifest},null,2));
const groups=['kick','slide','air'];
for(const type of groups){
 const cards=TRICKS.filter(c=>c.type===type),columns=4,thumbWidth=240,thumbHeight=Math.round(240*88/63),rows=Math.ceil(cards.length/columns),width=columns*260+20,height=rows*(thumbHeight+55)+70;
 const entries=[];for(const [i,c]of cards.entries()){const input=await sharp(await readFile(path.join(output,c.key,'carte-assemblee.png'))).resize(thumbWidth,thumbHeight).png().toBuffer();entries.push({input,left:20+(i%columns)*260,top:60+Math.floor(i/columns)*(thumbHeight+55)});}
 const sheet=await sharp({create:{width,height,channels:4,background:'#faf5e6'}}).composite(entries).png().toBuffer();await writeFile(path.join(output,'collection-'+type+'.png'),sheet);
}
await versionTrickAssets();
console.log(JSON.stringify({built:41,physical:85,frames:18,webText:'2x transparent lossless WebP',output}));
