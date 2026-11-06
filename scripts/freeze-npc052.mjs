import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'0.5.2');
const directory='tests/fixtures/npc-052',files=['npc.js','npc-strategy.js','npc-difficulty.js','npc-choice.js'];
assert(!existsSync(directory+'/manifest.json'),'Frozen reference already exists');mkdirSync(directory,{recursive:true});const manifest={build:'0.5.2',purpose:'Frozen NPC decisions as a reproducible reference, using the same live game rules and dice.',files:{}};
for(const file of files){const source=readFileSync('public/'+file,'utf8'),copy=source.replace(/from '(\.\/[^']+)'/g,(_,name)=>"from '"+(files.includes(name.slice(2))?name:'../../../public/'+name.slice(2))+"'");writeFileSync(directory+'/'+file,copy);manifest.files[file]={originalSha256:createHash('sha256').update(source).digest('hex'),fixtureSha256:createHash('sha256').update(copy).digest('hex')};}
writeFileSync(directory+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log('Frozen NPC 0.5.2 reference ready.');
