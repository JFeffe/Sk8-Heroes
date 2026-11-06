// The three marks used on the original cards: board, rail and wing.
export function trophyIcon(){return '<svg class="trophy-icon" viewBox="0 0 40 40" aria-hidden="true"><g stroke="#063e50" stroke-width="2.2" stroke-linejoin="round"><path d="M11 6H3v4a9 9 0 0 0 10 9m16-13h8v4a9 9 0 0 1-10 9" fill="none" stroke-width="5.4"/><path d="M11 6H3v4a9 9 0 0 0 10 9m16-13h8v4a9 9 0 0 1-10 9" fill="none" stroke="#ffc344"/><path d="M9 3h22v9c0 7-4 12-9 13v6h4l5 4v3H9v-3l5-4h4v-6c-5-1-9-6-9-13Z" fill="#ffc344"/></g><path d="M13 7v5c0 3 1 6 3 8" fill="none" stroke="#fff0a5" stroke-width="2" stroke-linecap="round"/></svg>';}
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
