// The three marks used on the original cards: board, rail and wing.
const paths={
 kick:'<path fill="currentColor" stroke="none" d="M4 12 18 6c4-2 7 3 3 5L7 17c-4 2-7-3-3-5Z"/><circle cx="8" cy="20" r="1.6" fill="currentColor" stroke="none"/><circle cx="20" cy="14" r="1.6" fill="currentColor" stroke="none"/>',
 slide:'<path d="m3 10 18-5M6 10v10m12-13v9M3 20h6m6-4h6"/>',
 air:'<path fill="currentColor" stroke="none" d="M3 10C8 5 17 6 22 2c-1 6-7 8-13 9 4 0 8-1 12-3-2 5-7 7-12 7 3 1 6 0 9-1-2 4-6 5-10 4l-1 5-4-2 2-6Z"/>'
};
export function typeIcon(type){return `<svg class="type-icon type-${type}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${type}"><title>${type}</title>${paths[type]||''}</svg>`;}
export function bonusLabel(c,icons=true){
 const b=c.comboBonus;if(!b)return '';
 const type=t=>icons?typeIcon(t):t;
 if(b.kind==='companion')return `+${b.points} si autre ${type(b.type)}`;
 if(b.kind==='variety')return `+${b.points} si ${['kick','slide','air'].map(type).join(' ')}`;
 return `+1 ${b.type==='adjust'?'±1':b.type==='freeze'?'❄':'↻'} fin du module`;
}
