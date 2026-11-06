export const viewedPlayer=(match,requestedId,viewerId=match.viewerId||'p0')=>match.players.find(p=>p.id===requestedId)||(match.phase==='playing'?match.players[match.active]:null)||match.players.find(p=>p.id===viewerId)||match.players[0];
export const viewingOwnTable=(match,requestedId,viewerId=match.viewerId||'p0')=>viewedPlayer(match,requestedId,viewerId).id===viewerId;
export const canControlTable=(match,requestedId,viewerId=match.viewerId||'p0')=>match.phase==='playing'&&viewingOwnTable(match,requestedId,viewerId)&&match.players[match.active]?.id===viewerId;

// Manual focus is pinned until the viewer explicitly returns to auto-view.
export function syncTableView(match,view={},paused=false){
 const revision=[match.phase,match.module,match.active,match.revision].join(':');
 const playerId=match.players.some(p=>p.id===view.playerId)?view.playerId:null;
 return {playerId,revision,paused,displayedId:viewedPlayer(match,playerId).id};
}
