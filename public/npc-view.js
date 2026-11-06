// The controller receives its own visible cards, dice and resources, plus the
// public route and shared market. The hidden deck and random source stay out.
export function npcGameView(g){
 const keys=['name','phase','competitive','skaterId','route','module','attempt','attempts','secured','earned','landed','dice','pending','frozen','used','sequenceReward','active','rolls','reason','sequences','hand','bank','reuseRoll','heldLastRoll','moduleTrace','offer','bonusOffer'];
 const view=Object.fromEntries(keys.filter(key=>g[key]!==undefined).map(key=>[key,g[key]]));
 view.deck=g.phase==='initial'?g.offer.map(uid=>g.deck.find(c=>c.uid===uid)).filter(Boolean):[];
 view.draftCards=g.competitive&&g.phase==='draft'?[...g.draftCards]:[];
 view.draftTokens=g.competitive&&g.phase==='draft'?[...g.draftTokens]:[];
 return structuredClone(view);
}
