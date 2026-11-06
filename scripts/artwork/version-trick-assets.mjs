import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {TRICKS} from '../../public/trick-catalog.js';

export async function versionTrickAssets(){
 const root=new URL('../../',import.meta.url),hashes=new Map();
 for(const c of TRICKS){
  for(const [name,url]of Object.entries(c.layers)){
   const file=url.split('?')[0];
   if(!hashes.has(file))hashes.set(file,createHash('sha256').update(await readFile(new URL('public/'+file,root))).digest('hex').slice(0,12));
   c.layers[name]=file+'?v='+hashes.get(file);
  }
  const metadata=new URL('artwork/cards/tricks/deck-v1/'+c.key+'/card.json',root),record=JSON.parse(await readFile(metadata,'utf8'));record.layers=c.layers;await writeFile(metadata,JSON.stringify(record,null,2));
 }
 await writeFile(new URL('public/trick-catalog.js',root),'// Generated from the approved catalog. Rebuild with scripts/artwork/build-trick-catalog.mjs.\nexport const TRICKS='+JSON.stringify(TRICKS,null,2)+';\n');
 const file=new URL('artwork/cards/tricks/deck-v1/manifest.json',root),manifest=JSON.parse(await readFile(file,'utf8'));for(const c of manifest.cards)c.layers=TRICKS[c.id].layers;await writeFile(file,JSON.stringify(manifest,null,2));
 return hashes.size;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Versioned '+await versionTrickAssets()+' card assets.');
