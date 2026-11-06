import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import path from 'node:path';
import {productionHashes} from '../experiments/theory85-runtime.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),folder=path.join(root,'artwork/cards/tricks/layer-templates-v1'),library=process.argv[2]||'sharp',sharp=createRequire(import.meta.url)(library);
const before=await productionHashes(),sha=b=>createHash('sha256').update(b).digest('hex'),names=['01-illustration','02-graphisme','03-textes-symboles'],checks=[];
const specification=JSON.parse(await readFile(path.join(folder,'specification.json'),'utf8')),alignment=specification.alignment,alignmentDetails=[];
async function fieldBounds(source,id){
 const node=source.match(new RegExp('<text\\b[^>]*\\bid="'+id+'"[^>]*>[\\s\\S]*?<\\/text>'))?.[0];assert(node,'Missing text field '+id);
 const rendered=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1300">${node}</svg>`;
 const {data,info}=await sharp(Buffer.from(rendered)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let left=900,top=1300,right=-1,bottom=-1;
 for(let y=0;y<1300;y++)for(let x=0;x<900;x++)if(data[(y*900+x)*info.channels+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 assert(right>=left&&bottom>=top);return {left,top,right,bottom,cx:(left+right)/2,cy:(top+bottom)/2,node};
}
for(const key of ['heelflip','smith-grind','900']){
 const cardFolder=path.join(folder,key),assembled=await readFile(path.join(cardFolder,'carte-assemblee.png'));
 execFileSync(process.execPath,[path.join(folder,'assemble.mjs'),cardFolder,library],{stdio:'pipe'});
 assert.equal(sha(await readFile(path.join(cardFolder,'carte-assemblee.png'))),sha(assembled));
 const definition=JSON.parse(await readFile(path.join(cardFolder,'card.json'),'utf8'));assert.equal(definition.printedPoints,definition.difficultyPoints+(definition.cost>=3?2:0));
 for(const name of names){const meta=await sharp(path.join(cardFolder,name+'.png')).metadata();assert.equal(meta.width,900);assert.equal(meta.height,1300);assert(meta.hasAlpha);}
 checks.push(key+': independent SVG assembler reproduces the three-layer PNG exactly; dimensions, alpha and tested score agree.');
 const source=await readFile(path.join(cardFolder,'03-textes-symboles.svg'),'utf8'),graphic=await readFile(path.join(cardFolder,'02-graphisme.svg'),'utf8');
 assert(source.includes('id="badge-information" transform="'+alignment.badge.transform+'"'));assert(graphic.includes('transform="'+alignment.badge.transform+'"'));
 const [label,chance,heading,number,unit,requirement]=await Promise.all(['badge-label','badge-chance','score-heading','card-score','score-unit','requirement-heading'].map(id=>fieldBounds(source,id)));
 assert(Math.abs(label.cx-alignment.badge.labelX)<=1);assert(Math.abs(chance.cx-alignment.badge.chanceX)<=1);
 assert.equal(label.node.match(/\by="([^"]+)"/)[1],chance.node.match(/\by="([^"]+)"/)[1],'Badge labels must share the same local baseline');
 assert(label.left>=70&&label.right<=267&&chance.left>=289&&chance.right<=430,'Badge text must retain side padding');
 for(const field of [heading,number,unit])assert(Math.abs(field.cx-alignment.score.centerX)<=1);
 assert(Math.abs(heading.cy-alignment.score.headingY)<=1);assert(Math.abs(requirement.cy-heading.cy)<=1);
 const topGap=number.top-alignment.score.bodyTop,bottomGap=alignment.score.bodyBottom-unit.bottom,innerGap=unit.top-number.bottom-1;
 assert(topGap>=8&&bottomGap>=8,JSON.stringify({key,topGap,bottomGap}));assert(Math.abs(topGap-bottomGap)<=2);assert(innerGap>=9);
 const socketNodes=Array.from(source.matchAll(/<text\b[^>]*id="socket-(\d+)"[^>]*>/g));assert.equal(socketNodes.length,definition.cost);
 const size=definition.cost===2?128:definition.cost===3?116:106,gap=definition.cost===2?42:definition.cost===3?32:18,start=alignment.requirement.centerX-(definition.cost*size+(definition.cost-1)*gap)/2;
 for(let i=0;i<definition.cost;i++){const bounds=await fieldBounds(source,'socket-'+i);assert(Math.abs(bounds.cx-(start+i*(size+gap)+size/2))<=1);assert(Math.abs(bounds.cy-alignment.requirement.socketY)<=1);}
 alignmentDetails.push({card:key,badgeBaseline:label.node.match(/\by="([^"]+)"/)[1],badgeRotation:alignment.badge.transform,scoreTopPadding:topGap,scoreBottomPadding:bottomGap,numberUnitGap:innerGap});
 checks.push(key+': rasterized labels, percentages, socket values and score are centered; badge rotation and score padding agree.');
}
const staging=path.join(root,'.local-games/trick-layer-templates-validation');await mkdir(staging,{recursive:true});
for(const name of names){let content=await readFile(path.join(folder,'heelflip',name+'.svg'),'utf8');if(name==='03-textes-symboles'){
 const changed=content.replace(/(<text\b[^>]*id="card-score"[^>]*>)3(<\/text>)/,'$17$2');assert.notEqual(changed,content);content=changed;
}await writeFile(path.join(staging,name+'.svg'),content);}
execFileSync(process.execPath,[path.join(folder,'assemble.mjs'),staging,library],{stdio:'pipe'});
for(const name of names.slice(0,2))assert.equal(sha(await readFile(path.join(staging,name+'.png'))),sha(await readFile(path.join(folder,'heelflip',name+'.png'))));
assert.notEqual(sha(await readFile(path.join(staging,'03-textes-symboles.png'))),sha(await readFile(path.join(folder,'heelflip/03-textes-symboles.png'))));
assert.notEqual(sha(await readFile(path.join(staging,'carte-assemblee.png'))),sha(await readFile(path.join(folder,'heelflip/carte-assemblee.png'))));
checks.push('Editing the score only in an isolated text SVG changes its rendered layer and assembly, while illustration and graphic PNGs stay byte-identical.');
const html=await readFile(path.join(folder,'index.html'),'utf8'),data=JSON.parse(html.match(/<script\b[^>]*id="examples"[^>]*>([\s\S]*?)<\/script>/)[1]),code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.equal(data.length,3);assert(data.every(c=>c.textSvg.startsWith('<svg')));new vm.Script(code,{filename:'trick-layer-preview.js'});
checks.push('Preview card payload parses and its inline JavaScript compiles; no browser/file-policy bypass is used.');
for(const [,ref]of html.split('<script type=')[0].matchAll(/(?:src|href)="([^"]+)"/g))if(!ref.endsWith('.zip'))assert((await readFile(path.resolve(folder,ref))).length>0,ref);
checks.push('Every static preview image and local source link resolves; ZIP is packaged separately after validation.');
assert.deepEqual(await productionHashes(),before);
const result={passed:true,checks,groups:checks.length,browserPreviewVerified:false,browserPreviewLimitation:'Browser URL policy blocks file: navigation. PNG and SVG exports were verified locally; preview JavaScript was compiled without execution.',productionUnchanged:true};
await writeFile(path.join(folder,'alignment-validation.json'),JSON.stringify({passed:true,details:alignmentDetails},null,2));
await writeFile(path.join(folder,'validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
