import {generateOdds} from './experiments/theory85-runtime.mjs';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Exact distributions for every available dice count, using the live catalog.
const directory=fileURLToPath(new URL('../public/',import.meta.url));
const odds=await generateOdds(directory);
for(const table of Object.values(odds.cards)){
 table.rerollOnly={};table.bothBonuses={};
 for(let n=0;n<=6;n++){
  const p=table.noBonus[n],adjusted=table.adjustOnly[n];
  table.rerollOnly[n]=1-(1-p)**2;
  table.bothBonuses[n]=1-(1-adjusted)**2;
 }
}
await writeFile(new URL('../public/odds.js',import.meta.url),'export const ODDS='+JSON.stringify(odds)+';\n');
console.log('Exact probability tables generated for '+Object.keys(odds.cards).length+' tricks.');
