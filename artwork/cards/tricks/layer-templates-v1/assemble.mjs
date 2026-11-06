// Assemble existing validated layer files without regenerating their artwork.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import path from 'node:path';
const folder=path.resolve(process.argv[2]||'.');
const sharp=createRequire(import.meta.url)(process.argv[3]||'sharp');
const names=['01-illustration','02-graphisme','03-textes-symboles'],sources=[],buffers=[],hashes={};
for(const name of names){
 const source=await readFile(path.join(folder,name+'.svg'),'utf8');
 const png=await sharp(Buffer.from(source)).png().toBuffer(),metadata=await sharp(png).metadata();
 assert.equal(metadata.width,900);assert.equal(metadata.height,1300);assert(metadata.hasAlpha);
 const body=source.match(/<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/)?.[1];assert(body,'Invalid SVG layer: '+name);
 sources.push(body);buffers.push(png);hashes[name]=createHash('sha256').update(source).digest('hex');
}
const png=await sharp(buffers[0]).composite([{input:buffers[1]},{input:buffers[2]}]).png().toBuffer();
const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="900" height="1300" viewBox="0 0 900 1300">${sources.map((body,i)=>`<g id="layer-${i+1}" data-name="${names[i]}">${body}</g>`).join('')}</svg>`;
for(let i=0;i<names.length;i++)await writeFile(path.join(folder,names[i]+'.png'),buffers[i]);
await writeFile(path.join(folder,'carte-assemblee.png'),png);await writeFile(path.join(folder,'carte-assemblee.svg'),svg);
await writeFile(path.join(folder,'assembly-source-hashes.json'),JSON.stringify({layers:hashes,order:names,size:[900,1300]},null,2));
console.log(JSON.stringify({folder,assembled:'carte-assemblee.png',layers:3}));
