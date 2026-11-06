import test from 'node:test';
import assert from 'node:assert/strict';
import {PatchNotesState} from '../public/patch-notes-state.js';
const browser=()=>({value:null,getItem(){return this.value;},setItem(key,value){this.value=value;}});
test('unread contours remain until viewed notes are closed, and persist in this browser only',()=>{
 const storage=browser(),state=new PatchNotesState(storage);assert(state.unread('0.2.1'));
 state.open();state.viewed('0.2.1');assert(state.unread('0.2.1'));assert.equal(storage.value,null);
 state.open();state.close();assert(!state.unread('0.2.1'));assert(!new PatchNotesState(storage).unread('0.2.1'));
 assert(new PatchNotesState(browser()).unread('0.2.1'));assert(state.unread('0.2.0'));
});
test('opening without viewing a release does not mark it read; new releases remain unread',()=>{
 const storage=browser(),state=new PatchNotesState(storage);state.open();state.close();assert(state.unread('0.2.1'));
 state.viewed('0.2.1');state.close();assert(state.unread('0.2.1'));
 state.open();state.viewed('0.2.0');state.close();assert(new PatchNotesState(storage).unread('0.2.1'));
});
test('blocked or malformed browser storage never prevents reading patch notes',()=>{
 for(const storage of [{getItem(){return '{';},setItem(){}},{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}]){
  const state=new PatchNotesState(storage);state.open();state.viewed('0.2.1');state.close();assert(!state.unread('0.2.1'));
 }
});
