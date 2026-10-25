const rows = [
['Kickflip','kick',6,3,'',5],['Pop Shuvit','kick',5,2,'kick',4],['Heelflip','kick',7,4,'',3],['Frontside Flip','kick',7,3,'air',3],
['360 Flip','kick',8,5,'',3],['Laser Flip','kick',8,4,'variety',2],['Hardflip','kick',9,7,'',2],['Impossible','kick',10,8,'exact',2],
['Inward Heelflip','kick',9,6,'boost',2],['50-50 Grind','slide',6,3,'',5],['Boardslide','slide',5,2,'kick',4],['FS Boardslide','slide',7,4,'',3],
['Noseslide','slide',7,3,'air',3],['Lipslide','slide',8,5,'',3],['Smith Grind','slide',8,4,'slide',2],['Bluntslide','slide',10,9,'',2],
['Feeble Grind','slide',9,6,'reroll',2],['Crooked Grind','slide',9,6,'one',2],['180°','air',6,3,'',8],['360°','air',10,9,'',6],
['540°','air',14,13,'',2],['720°','air',18,18,'',2],['900°','air',22,24,'',1],['1080°','air',26,32,'solo',1]];
export const TRICKS=rows.map(([name,type,difficulty,points,effect,copies],id)=>({id,name,type,difficulty,points,effect,copies,sheet:Math.floor(id/4)+1,cell:id%4}));
export const MODULES=[
{id:0,name:'Le Flat',stage:0,needs:['kick'],min:2,pv:2,reward:'reroll',art:1},
{id:1,name:'Rail bas',stage:0,needs:['slide'],min:2,pv:2,reward:'boost',art:0},
{id:2,name:'Petite rampe',stage:0,needs:['air'],min:3,pv:2,reward:'reroll',art:3},
{id:3,name:'Place du bord de mer',stage:0,needs:[],min:3,pv:2,reward:'choice',art:2},
{id:4,name:'Rail et sortie',stage:1,needs:['slide','kick'],min:8,pv:3,reward:'upgrade',art:1},
{id:5,name:'Rampe et réception',stage:1,needs:['air','kick'],min:8,pv:3,reward:'boost',art:2},
{id:6,name:'Rampe et coping',stage:1,needs:['air','slide'],min:8,pv:3,reward:'reroll',art:2},
{id:7,name:'Double ledge',stage:1,needs:['slide','slide'],min:8,pv:3,reward:'upgrade',art:0},
{id:8,name:'La grande ligne',stage:2,needs:['kick','slide','air'],min:14,pv:4,reward:null,art:2},
{id:9,name:'La ligne street',stage:2,needs:['kick','kick','slide'],min:14,pv:4,reward:null,art:2},
{id:10,name:'Le parcours libre',stage:2,needs:[],min:16,pv:4,reward:null,art:2,minCards:2},
{id:11,name:'La grande rampe',stage:2,needs:['air'],min:18,pv:4,reward:null,art:3}];
export const STAGES=['Découverte','Enchaînement','Finale'];
export const EFFECTS={kick:'+1 pts · autre Kick',air:'+2 pts · Air',slide:'+2 pts · autre Slide',variety:'+2 pts · 3 types',exact:'+2 pts · total exact',boost:'+1 bonus +2',reroll:'+1 relance',one:'+2 pts · 1 dé',solo:'Se joue seul'};
export const makeDeck=()=>TRICKS.flatMap(t=>Array.from({length:t.copies},(_,n)=>({...t,uid:`${t.id}-${n}`,upgraded:false})));
