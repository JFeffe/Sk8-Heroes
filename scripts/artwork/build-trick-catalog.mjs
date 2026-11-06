import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {trickKey,presentation} from '../../public/trick-presentation.js';
const fixture=JSON.parse(await readFile(new URL('../../tests/fixtures/theory85-catalog.json',import.meta.url),'utf8'));
export const cards=fixture.cards.map((c,id)=>{
 const key=trickKey(c.name),display=presentation(c.rule),effect=c.effect||'',comboBonus=effect.startsWith('token:')?{kind:'reward',type:effect.split(':')[1]}:effect.startsWith('point:')?{kind:'companion',type:effect.split(':')[1],points:1}:null;
 return {id,key,name:c.name,type:c.type,tier:c.tier,copies:c.copies,points:c.difficultyPoints+(c.cost>=3?2:0),difficultyPoints:c.difficultyPoints,scorePremium:c.cost>=3?2:0,effortBonus:c.cost>=3?2:0,p6:c.p,requirementCode:c.rule,...c.requirement,...display,comboBonus,
  layers:{illustration:`assets/tricks/${key}/01-illustration.webp`,graphics:`assets/tricks/frames/${c.cost}-${effect?'bonus':'plain'}.svg`,information:`assets/tricks/${key}/03-textes-symboles.webp`}};
});
assert.equal(cards.length,41);assert.equal(cards.reduce((n,c)=>n+c.copies,0),85);assert(cards.every(c=>c.symbols.length===c.cost));
await writeFile(new URL('../../public/trick-catalog.js',import.meta.url),'// Generated from the validated 85-card proposal; 3/4-die premiums are +2.\nexport const TRICKS='+JSON.stringify(cards,null,1)+';\n');
console.log(JSON.stringify({unique:cards.length,physical:85,byTier:Object.fromEntries(['base','advanced','epic'].map(tier=>[tier,cards.filter(c=>c.tier===tier).reduce((n,c)=>n+c.copies,0)]))}));
