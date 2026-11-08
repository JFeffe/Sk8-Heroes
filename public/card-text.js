import {typeIcon} from './icons.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Keep the words as well as the component symbols, including in accessible text.
export function cardTextParts(value){
 const pattern=/(?<![\p{L}\p{N}])(?:kick|slide|air|relances?|gels?|gelé|gelés|jetons?|dés?|étoiles?)(?![\p{L}\p{N}])/giu;
 const parts=[];let start=0;
 for(const match of value.matchAll(pattern)){
  if(match.index>start)parts.push({text:value.slice(start,match.index)});
  const word=match[0],key=word.toLowerCase();
  const icon=['kick','slide','air'].includes(key)?key:key==='±1'?'adjust':/^(relance|↻)/.test(key)?'reroll':/^(gel|❄)/.test(key)?'freeze':/^(étoile|★)/.test(key)?'star':/^dé/.test(key)?'die':'token';
  parts.push({text:word,icon});start=match.index+word.length;
 }
 if(start<value.length)parts.push({text:value.slice(start)});
 return parts;
}
export function componentIcon(kind){
 if(['kick','slide','air'].includes(kind))return typeIcon(kind).replace('class="type-icon', 'class="component-icon type-icon');
 const marks={adjust:'±1',reroll:'↻',freeze:'❄',star:'★'};
 const body=kind==='die'?'<rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="1.8"/><circle cx="16" cy="16" r="1.8"/>':kind==='token'?'<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor"/>':`<text x="12" y="18" text-anchor="middle" font-family="Segoe UI Symbol,Arial,sans-serif" font-size="${kind==='adjust'?15:21}">${marks[kind]||''}</text>`;
 return `<svg class="component-icon component-${kind}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${body}</svg>`;
}
export function cardText(value){return cardTextParts(value).map(p=>p.icon?`<span class="card-text-component">${componentIcon(p.icon)}${esc(p.text)}</span>`:esc(p.text)).join('');}
