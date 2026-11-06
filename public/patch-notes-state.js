const KEY='sk8-seen-patch-notes-v1';
export class PatchNotesState{
 constructor(storage){this.storage=storage;this.seen=new Set();this.pending=new Set();this.opened=false;try{const saved=JSON.parse(storage.getItem(KEY));if(Array.isArray(saved))this.seen=new Set(saved.filter(v=>typeof v==='string'));}catch{}}
 unread(version){return !this.seen.has(version);}
 open(){if(this.opened)return;this.opened=true;this.pending.clear();}
 viewed(version){if(this.opened)this.pending.add(version);}
 close(){if(!this.opened)return;for(const version of this.pending)this.seen.add(version);this.opened=false;this.pending.clear();try{this.storage.setItem(KEY,JSON.stringify([...this.seen]));}catch{}}
}
