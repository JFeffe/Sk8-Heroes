import {getSkater} from '../public/skaters.js';

export function riderChoices(room){
 return room.riderChoices??Object.fromEntries(room.match.players.filter(p=>p.kind==='human').map(p=>[p.id,p.skaterId]));
}
export function lobbyReady(room){return room.match.players.filter(p=>p.kind==='human').every(p=>getSkater(riderChoices(room)[p.id]));}
// Called inside the room's serial transaction. Human reservations, rather than
// the NPC placeholders used by the engine, determine availability.
export function reserveRider(room,playerId,skaterId){
 const skater=getSkater(skaterId),player=room.match.players.find(p=>p.id===playerId&&p.kind==='human');
 if(room.started||!skater||!player)return false;
 const choices=riderChoices(room);
 if(Object.entries(choices).some(([id,choice])=>id!==playerId&&choice===skaterId))return false;
 const other=room.match.players.find(p=>p.id!==playerId&&p.skaterId===skaterId),old=getSkater(player.skaterId);
 if(other){other.skaterId=old.id;other.color=old.color;other.game.skaterId=old.id;if(other.kind==='npc')other.game.name=old.name;}
 player.skaterId=skater.id;player.color=skater.color;player.game.skaterId=skater.id;
 room.riderChoices={...choices,[playerId]:skater.id};return true;
}
