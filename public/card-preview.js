// Read-only copies of visible cards. No game state or network commands are used.
const cards='.trick-card,.lagoon-module-card,.skater-mat,.park-card';
export function bindCardPreview(root){
 const panel=document.createElement('aside');
 panel.className='card-side-preview';panel.hidden=true;panel.inert=true;
 panel.setAttribute('aria-hidden','true');
 panel.innerHTML='<div class="card-preview-face"></div>';
 document.body.append(panel);
 const face=panel.firstElementChild;
 let pointer=null,focused=null,pressed=false,touch=false,signature='',frame=0;
 function clear(){panel.hidden=true;signature='';face.replaceChildren();}
 function sourceAt(target){
  if(!(target instanceof Element)||!root.contains(target)||target.closest('.backdrop,.drag-ghost,.module-route-peek'))return null;
  return target.closest(cards)||target.closest('[data-action]')?.querySelector(cards)||null;
 }
 function key(card){
  const owner=card.closest('[data-player],[data-viewed-player]');
  return [card.classList.contains('trick-card')?'trick':card.classList.contains('lagoon-module-card')?'module':card.classList.contains('skater-mat')?'skater':'park',
   card.dataset.card||card.dataset.id||card.dataset.moduleId||card.querySelector('[data-preview-name]')?.dataset.previewName||card.getAttribute('aria-label'),
   owner?.dataset.player||owner?.dataset.viewedPlayer,card.dataset.attempt,!!card.closest('.player-hand'),!!card.closest('.archive-tray')].join(':');
 }
 function show(card){
  if(!card||pressed||root.querySelector('.backdrop')){clear();return;}
  const landscape=card.classList.contains('park-card');
  panel.classList.toggle('landscape',landscape);
  const next=key(card)+'|'+card.innerHTML;
  if(next!==signature){
   signature=next;
   const clone=card.cloneNode(true);
   clone.className=card.classList.contains('trick-card')?'trick-card':card.classList.contains('lagoon-module-card')?'lagoon-module-card':card.classList.contains('skater-mat')?'skater-mat poker-card'+(card.classList.contains('advanced-skater')?' advanced-skater':''):'park-card poker-landscape';
   // Keep the skater color, but not hand positions, hit targets or duplicate IDs.
   const rider=card.style.getPropertyValue('--rider');clone.removeAttribute('style');if(rider)clone.style.setProperty('--rider',rider);
   for(const element of [clone,...clone.querySelectorAll('*')]){
    for(const attribute of [...element.attributes])if(attribute.name==='id'||attribute.name==='tabindex'||attribute.name.startsWith('data-')||attribute.name==='autofocus')element.removeAttribute(attribute.name);
    if(element instanceof HTMLImageElement){element.loading='eager';element.draggable=false;}
    if(element.matches('button,input,select,textarea,a,[role="button"]')){element.setAttribute('tabindex','-1');element.removeAttribute('href');}
   }
   face.replaceChildren(clone);
  }
  panel.hidden=false;
 }
 function refresh(){
  cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>{
   if(focused){show([...root.querySelectorAll(cards)].find(card=>key(card)===focused));return;}
   show(pointer?sourceAt(document.elementFromPoint(pointer.x,pointer.y)):null);
  });
 }
 document.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;touch=false;pointer={x:event.clientX,y:event.clientY};focused=null;refresh();});
 document.addEventListener('pointerdown',event=>{touch=event.pointerType==='touch';if(touch){pointer=null;focused=null;}pressed=true;clear();},true);
 document.addEventListener('pointerup',()=>{pressed=false;refresh();});
 document.addEventListener('pointercancel',()=>{pressed=false;pointer=null;clear();});
 document.documentElement.addEventListener('pointerleave',()=>{pointer=null;focused=null;clear();});
 root.addEventListener('focusin',event=>{if(touch)return;const card=sourceAt(event.target);if(card){focused=key(card);show(card);}});
 root.addEventListener('focusout',()=>{focused=null;refresh();});
 window.addEventListener('blur',()=>{pointer=null;focused=null;pressed=false;clear();});
 window.addEventListener('resize',refresh);
 window.addEventListener('scroll',refresh,{passive:true,capture:true});
 document.addEventListener('keydown',event=>{touch=false;if(event.key==='Escape'){pointer=null;focused=null;clear();}});
 // Called after every local or multiplayer render, even if the mouse is still.
 return {refresh};
}
