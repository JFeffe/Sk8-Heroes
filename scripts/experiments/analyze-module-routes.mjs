import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {root,productionHashes} from './theory85-runtime.mjs';
const read=name=>readFile(path.join(root,'tests',name),'utf8').then(JSON.parse);
const proposal=await read('fixtures/theory85-modules-v1.json'),functional=await read('theory85-module-validation-results.json'),ordinary=await read('theory85-module-routes-results.json'),probe=await read('theory85-module-probe-results.json');
const roles=['balanced','two','three','four'];
const rows=Object.entries(probe.cohorts).map(([key,c])=>{
 const finals={};for(const r of c.matchResults){const id=r.route.at(-1),f=finals[id]??={games:0,credits:Object.fromEntries(roles.map(p=>[p,0]))};f.games++;for(const p of r.final)f.credits[p]+=1/r.final.length;}
 assert(c.marketSizes.every(n=>n===8));assert.equal(c.attempts,c.sessions*48);
 return {key,games:c.sessions,matchWins:Object.fromEntries(roles.map(p=>[p,c.byProfile[p].matchWins/c.sessions])),finals,cost4Selected:c.byCost[4].selected,cost4Banked:c.byCost[4].banked,falls:c.falls/c.attempts,three:c.three/c.attempts,score:c.points/c.attempts};
});
const summary={theoretical:true,proposalVersion:1,modules:proposal.modules,ordinaryDiagnostic:Object.entries(ordinary.cohorts).map(([key,c])=>({key,games:c.sessions,cost4Selected:c.byCost[4].selected})),probe:{games:rows.reduce((s,r)=>s+r.games,0),method:probe.methodology.controllers,rows},functional,productionUnchanged:probe.productionUnchanged&&ordinary.productionUnchanged,productionHashes:await productionHashes()};
assert(summary.productionUnchanged);await writeFile(path.join(root,'tests/theory85-module-summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary.probe,null,2));
const pct=x=>(100*x).toFixed(1).replace('.',',')+' %',esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const type={kick:'Kick',slide:'Slide',air:'Air'};
const opening=m=>m.needs.length===2?m.needs.map(t=>type[t]).join(' + '):m.needs.length===1?type[m.needs[0]]:'Libre';
const table=proposal.modules.slice().sort((a,b)=>a.stage-b.stage||a.id-b.id).map(m=>`<tr><th>${esc(m.name)}</th><td>${m.rounds[0]}${m.rounds.length>1?'–'+m.rounds.at(-1):''}</td><td>${opening(m)}</td><td>${m.pv}</td><td>${esc(m.condition)}</td></tr>`).join('');
const statistics=rows.map(r=>`<tr><th>${r.key}</th><td>${r.games}</td><td>${r.cost4Selected}</td>${roles.map(p=>`<td>${pct(r.matchWins[p])}</td>`).join('')}<td>${pct(r.finals[11].credits.four/r.finals[11].games)}</td></tr>`).join('');
const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Le Lagon — modules proposés pour les 85 cartes</title><style>body{margin:0;background:#f4f4e9;color:#193e3d;font:16px/1.55 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:32px 24px 64px}h1{font-size:32px;line-height:1.15}h2{font-size:23px;margin-top:34px}table{border-collapse:collapse;width:100%;background:#fffdf4;font-size:14px}th,td{text-align:left;padding:10px;border-bottom:1px solid #c8d9ce}thead{background:#dce9de}section{overflow:auto}.note{background:#fff1d3;padding:14px 18px;border-left:4px solid #d99b53}li{margin:8px 0}small{color:#5d736d}</style><main><p>SK8 HEROES · ÉTUDE THÉORIQUE · 1er novembre 2026</p><h1>Le Lagon : objectifs des 12 modules</h1>
<p>Version à 85 cartes. Deux modules de manches 1–2, trois de manches 3–5, une finale ; les six sont visibles dès le départ. Deux essais par joueur, classement au meilleur essai conservé. PV et plafond de trois tricks inchangés. Aucun changement dans le jeu jouable.</p>
<section><table><thead><tr><th>Module</th><th>Manches</th><th>Départ obligatoire</th><th>PV</th><th>Condition du bonus +2</th></tr></thead><tbody>${table}</tbody></table></section>
<p>Sur les modules à deux types, les deux premiers tricks doivent couvrir ces types, dans l’ordre choisi. Le troisième est libre. Les conditions de bonus sont facultatives et ne rapportent +2 qu’une fois par séquence conservée. Les modules affichant trois types autorisent un départ libre.</p>
<h2>Modifications ciblées</h2><ul><li>Quai bas : Slide → Kick introduit la transition entre deux familles.</li><li>Tour de l’Îlot : Kick → Air donne un ordre différent du Coping Bleu.</li><li>Embruns : deux tricks à trois dés offrent une route propre aux cartes coûteuses.</li><li>Grande Vague : les six dés doivent être posés. Les voies 2+2+2, 3+3, 4+2 et 2+4 peuvent recevoir le bonus ; une seule grosse figure ne le donne plus automatiquement.</li></ul>
<h2>Vérifications</h2><ul>${functional.details.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>
<h2>Essai ciblé des quatre dés</h2><p class="note">Le premier contrôleur de draft n’a choisi aucune carte à quatre dés dans les 1 200 parties ordinaires de cette variante. Ces parties ne permettent donc pas de juger leur équilibre. Un deuxième essai utilise un profil choisissant explicitement une carte à quatre dés jouable s’il possède au moins un ±1 et une relance. Le classement des cartes utilise les chances observées dans les essais contrôlés, jamais les jets futurs. C’est un test de viabilité de stratégie, pas une preuve d’optimalité humaine.</p>
<p>Ancien et nouveau catalogue de modules sont comparés avec les mêmes graines. Four2 signifie une prime +2 pour quatre dés, Four4 une prime +4. La prime à trois dés reste +2. Les préférences changent les décisions, jamais les règles de jets ou de score.</p>
<section><table><thead><tr><th>Variante</th><th>Parties</th><th>4 dés joués</th><th>Adaptatif</th><th>Préf. 2</th><th>Préf. 3</th><th>Préf. 4</th><th>Préf. 4, finale Grande Vague</th></tr></thead><tbody>${statistics}</tbody></table></section>
<p><small>Les victoires ex æquo sont réparties en fractions dans ces pourcentages. Les parties utilisent les PV complets pour les ex æquo, comme le jeu. Les résultats restent dépendants des heuristiques ; les simulations ne remplacent pas une validation par des joueurs.</small></p>
<p>Les primes testées et les nouvelles conditions restent dans une copie isolée du moteur. Données : theory85-module-probe-results.json et theory85-module-summary.json. Catalogue : fixtures/theory85-modules-v1.json.</p></main></html>`;
await writeFile(path.join(root,'tests/theory85-module-report.html'),html);
