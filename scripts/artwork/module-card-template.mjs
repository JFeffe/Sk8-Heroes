import {createCardTemplate} from './trick-card-template.mjs';
import {appearanceLabel,SECOND_PLACE_PV} from '../../public/module-rules.js';
import {moduleGoalPresentation} from '../../public/module-goals.js';

// Modules use the same canvas, measured lettering, palette and frame as tricks.
export function createModuleTemplate(sharp){
 const shared=createCardTemplate(sharp),{W,H,C,svg,graphics,ink,centeredText,text,icon,alignment}=shared;
 async function fit(cx,cy,value,size,maxWidth=500,color=C.navy,extra=''){
  const bounds=await ink(value,size);if(bounds.width>maxWidth)size=Math.floor(size*maxWidth/bounds.width);
  return centeredText(cx,cy,value,size,color,extra);
 }
 async function title(name){
  let lines=[name],size=102;
  if((await ink(name,82)).width>626){
   const words=name.split(' ');let best=null;
   for(let i=1;i<words.length;i++){const pair=[words.slice(0,i).join(' '),words.slice(i).join(' ')],widths=await Promise.all(pair.map(s=>ink(s,82)));const penalty=Math.max(...widths.map(b=>b.width))+Math.abs(widths[0].width-widths[1].width)*.2;if(!best||penalty<best.penalty)best={pair,penalty};}
   if(best)lines=best.pair;size=82;
  }
  let result='';
  for(const [i,line]of lines.entries()){
   const bounds=await ink(line,size),fitted=bounds.width>626?Math.floor(size*626/bounds.width):size,b=await ink(line,fitted),cy=lines.length===1?105:[74,145][i];
   result+=text(59-b.x,cy-b.y-(b.height-1)/2,line,fitted,C.cream,`id="module-title-${i}"`);
  }
  return result;
 }
 async function symbols(types,cx,cy,{header=false,separator='+'}={}){
  if(!types.length)return fit(cx,cy,'LIBRE',36,140,C.cream);
  const size=header?(types.length===1?97:types.length===2?52:36):types.length===2?80:70,gap=header?(types.length===3?12:22):44,width=types.length*size+(types.length-1)*gap;
  let result='';
  for(const [i,type]of types.entries()){
   const x=cx-width/2+i*(size+gap);result+=icon(type,x,cy-size/2,size,header?C.cream:C.navy);
   if(i<types.length-1)result+=await centeredText(x+size+gap/2,cy,separator,header?24:44,header?C.cream:C.navy);
  }
  return result;
 }
 async function condition(m){
  const goal=moduleGoalPresentation(m);
  const main=goal.icon?icon(goal.icon,205,1024,88,C.navy)+await centeredText(375,1068,goal.title,80,C.navy,'id="module-goal-title"'):await fit(321,1068,goal.title,70,500,C.navy,'id="module-goal-title"');
  return main+await fit(321,1140,goal.caption,31,500,C.navy,'id="module-goal-caption"');
 }
 function trophy(cx,top,size){
  return `<svg x="${cx-size/2}" y="${top}" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
   <g stroke="${C.navy}" stroke-width="2.2" stroke-linejoin="round">
    <path d="M11 6H3v4a9 9 0 0 0 10 9m16-13h8v4a9 9 0 0 1-10 9" fill="none" stroke-width="5.4"/>
    <path d="M11 6H3v4a9 9 0 0 0 10 9m16-13h8v4a9 9 0 0 1-10 9" fill="none" stroke="#ffc344" stroke-width="2.2"/>
    <path d="M9 3h22v9c0 7-4 12-9 13v6h4l5 4v3H9v-3l5-4h4v-6c-5-1-9-6-9-13Z" fill="#ffc344"/>
   </g><path d="M13 7v5c0 3 1 6 3 8" fill="none" stroke="#fff0a5" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
 }
 async function information(m){
  const firstSize=92,firstBottom=1149,firstDigit=await ink(m.pv,firstSize);
  return `<g>${await title(m.name)}${await symbols(m.needs,780,119,{header:true,separator:m.needs.length===2?'+':'·'})}
   <g id="module-appearance" transform="${alignment.badge.transform}">${await fit(250,217,appearanceLabel(m),40,350)}</g>
   ${await fit(321,alignment.requirement.headingY,moduleGoalPresentation(m).heading,35,500,C.navy,'id="module-bonus-heading"')}${await condition(m)}
   <g id="module-podium-information">
    ${await centeredText(alignment.score.centerX,alignment.score.headingY,'POINTS DE VICTOIRE',27,C.cream,'id="module-prize-heading"')}
    ${trophy(688,1026,37)}${trophy(802.5,1069,19)}
    ${await centeredText(688,firstBottom-(firstDigit.height-1)/2,m.pv,firstSize,C.navy,'id="module-pv-first"')}
    ${await centeredText(802.5,1114,SECOND_PLACE_PV,47,C.navy,'id="module-pv-second"')}
   </g>
   ${await centeredText(450,1217,m.park.toUpperCase(),42,C.navy,'id="module-park"')}
  </g>`;
 }
 return {W,H,C,svg,alignment,graphics:()=>graphics({kind:'module'}),information};
}
