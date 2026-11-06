// A stable tie-break from visible information, independent of the dice stream.
// Lower levels sometimes choose a near-best option; they never change a roll.
function preference(g,salt){
 const visible=[salt,g.skaterId,g.module,g.attempt,g.phase,...g.route,...g.hand.map(c=>c.uid),...(g.offer||[]),...g.landed.map(e=>e.card)].join('|');
 let hash=2166136261;for(let i=0;i<visible.length;i++)hash=Math.imul(hash^visible.charCodeAt(i),16777619);
 hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d);hash^=hash>>>15;
 return (hash>>>0)/2**32;
}
export function chooseNearBest(g,ranked,policy,salt='card'){
 if(!ranked.length||!policy.variety)return ranked[0]||null;
 const best=ranked[0].value,window=Math.max(policy.regret,Math.abs(best)*policy.relativeRegret);
 const pool=ranked.slice(1,4).filter(x=>Number.isFinite(x.value)&&x.value>=best-window);
 const choice=preference(g,salt);if(!pool.length||choice>=policy.variety)return ranked[0];
 return pool[Math.min(pool.length-1,Math.floor(choice/policy.variety*pool.length))];
}
