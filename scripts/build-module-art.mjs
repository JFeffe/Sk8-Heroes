import {createRequire} from 'node:module';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {MODULES} from '../public/data.js';

// Pass a Sharp package path when using a bundled runtime instead of node_modules.
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp');
const root=new URL('../',import.meta.url);
const planFile=new URL('artwork/parks/le-lagon/modules/generation-plan.json',root);
const plan=JSON.parse(await readFile(planFile,'utf8'));
let total=0;
for(const module of MODULES){
 const source=new URL(`artwork/parks/le-lagon/modules/${module.key}.png`,root);
 const destination=new URL(`public/${module.image}`,root);
 const bytes=await sharp(await readFile(source)).webp({quality:88}).toBuffer();
 await writeFile(destination,bytes);total+=bytes.length;
 const entry=plan.jobs.find(j=>j.key===module.key);
 entry.source=`artwork/parks/le-lagon/modules/${module.key}.png`;
 entry.publicFile=module.image;entry.bytes=(await stat(destination)).size;
}
plan.mode='builtin';plan.optimization='WebP quality 88; full resolution; no pixel edits';
await writeFile(planFile,JSON.stringify(plan,null,2)+'\n');
console.log(`${MODULES.length} module illustrations, ${(total/1024/1024).toFixed(2)} MB total`);
