import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MODULES} from '../public/data.js';
import {moduleCard,moduleCatalog,moduleRoute} from '../public/module-cards.js';
import * as M from '../public/match.js';

const root=new URL('../',import.meta.url),cmd=(m,type,extra={})=>M.dispatch(m,{playerId:M.currentPlayer(m).id,type,...extra});
const cards=m=>[...m.deck,...m.market.cards,...m.players.flatMap(p=>p.game.hand),...m.discard];
function market(){const m=M.newMatch({seed:3031});while(m.phase==='initial')assert(cmd(m,'draft',{cardId:M.currentPlayer(m).game.offer[0]}));assert(M.startModule(m));for(let i=0;i<8;i++){assert(cmd(m,'pass'));assert(cmd(m,'proceed'));}assert(M.advance(m));return m;}
function legacyMarket(picks=0){const m=market(),extra=m.deck.filter(c=>c.tier===m.market.tier).slice(0,4),ids=new Set(extra.map(c=>c.uid));m.deck=m.deck.filter(c=>!ids.has(c.uid));m.market.cards.push(...extra);delete m.market.cardsPerPlayer;for(let i=0;i<picks;i++)assert(cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));return JSON.parse(JSON.stringify(m));}

test('all twelve modules contain exactly three ordered layers in normal and earned states',()=>{
 for(const m of MODULES)for(const earned of [false,true]){
  const html=moduleCard(m,{earned});assert.deepEqual([...html.matchAll(/data-module-layer="(\d)"/g)].map(x=>x[1]),['1','2','3']);assert.equal((html.match(/<img /g)||[]).length,3);
  assert(html.includes(m.layers.illustration));assert(html.includes(m.layers.graphics));assert(html.includes(m.layers.information));assert(html.includes('1re place : '+m.pv+' PV · 2e place : 1 PV'));assert(html.includes('EFFET : '+m.condition));
  assert.equal(html.includes('module-earned-stamp'),earned);assert(!html.includes('lagoon-card-chrome'));
 }
});

test('every module layer exists, matches its version hash and keeps images and text separate',()=>{
 for(const m of MODULES){
  for(const file of Object.values(m.layers)){const url=new URL('public/'+file,root);assert(existsSync(url),file);assert.equal(url.searchParams.get('v'),createHash('sha256').update(readFileSync(url)).digest('hex').slice(0,12));}
  const source=new URL('artwork/cards/modules/le-lagon-v1/'+m.key+'/',root),art=readFileSync(new URL('01-illustration.svg',source),'utf8'),frame=readFileSync(new URL('02-graphisme.svg',source),'utf8'),text=readFileSync(new URL('03-textes-symboles.svg',source),'utf8');
  assert(art.includes('<image '));assert(!/<text\b/.test(art));assert(!/<text\b|<image\b/.test(frame));assert(!/<image\b/.test(text));
  assert(frame.includes('id="module-podium"'));assert(text.includes('id="module-appearance"'));
  assert(text.includes(`id="module-pv-first">${m.pv}</text>`));assert(text.includes('id="module-pv-second">1</text>'));
  assert.equal((text.match(/fill="#ffc344"/g)||[]).length,2);assert(!text.includes('>PV</text>'));
  const metadata=JSON.parse(readFileSync(new URL('card.json',source),'utf8'));for(const key of ['name','pv','needs','rounds','bonus','bonusPoints','condition','layers'])assert.deepEqual(metadata[key],m[key]);assert.deepEqual(metadata.canvas,[900,1300]);assert.deepEqual(metadata.textResolution,[2016,2816]);
 }
});

test('module and trick frames share their canvas, score and badge anchors',()=>{
 const modules=JSON.parse(readFileSync(new URL('artwork/cards/modules/le-lagon-v1/manifest.json',root),'utf8')),tricks=JSON.parse(readFileSync(new URL('artwork/cards/tricks/layer-templates-v1/specification.json',root),'utf8'));
 assert.equal(modules.cards,12);assert.deepEqual(modules.canvas,[tricks.size.width,tricks.size.height]);assert.deepEqual(modules.alignment.score,tricks.alignment.score);assert.deepEqual(modules.alignment.badge,tricks.alignment.badge);assert.equal(new Set(MODULES.map(m=>m.layers.graphics)).size,3);
});

test('the gallery and both route previews render all module faces with three layers',()=>{
 const gallery=moduleCatalog(),route=moduleRoute(M.newMatch({seed:3032}));assert.equal((gallery.match(/data-module-layer=/g)||[]).length,36);assert.equal((route.match(/data-module-layer=/g)||[]).length,36);
 for(const file of ['public/index.html','public/modules.html'])assert(readFileSync(new URL(file,root),'utf8').includes('href="module-layers.css"'));
});

test('old eight-card recovery drafts resume with one card per remaining player, preserving every card and confirmed choice',()=>{
 for(const picks of [0,1,2,3]){
  const raw=legacyMarket(picks),expected=raw.market.cards.slice(0,4-picks).map(c=>c.uid),hands=structuredClone(raw.players.map(p=>p.game.hand)),banks=structuredClone(raw.players.map(p=>p.game.bank)),rng=raw.rngState,revision=raw.revision;
  const restored=M.restore(raw);assert.equal(restored.market.cards.length,4-picks);assert.equal(restored.market.tokens.length,4-picks);assert.equal(restored.market.cardsPerPlayer,1);assert.deepEqual(restored.market.cards.map(c=>c.uid),expected);assert.deepEqual(restored.players.map(p=>p.game.hand),hands);assert.deepEqual(restored.players.map(p=>p.game.bank),banks);assert.equal(restored.rngState,rng);assert.equal(restored.revision,revision+1);assert.equal(cards(restored).length,85);assert.equal(new Set(cards(restored).map(c=>c.uid)).size,85);
  const saved=JSON.stringify(restored);assert.equal(JSON.stringify(M.restore(JSON.parse(saved))),saved);
 }
});

test('a new draft keeps unchosen offers when a lower-level card is taken and the game resumes',()=>{
 let m=market();while(m.phase==='recovery')assert(cmd(m,'draft-pair',{cardId:m.market.cards[0].uid,tokenId:m.market.tokens[0].id}));assert(M.startModule(m));for(let i=0;i<8;i++){assert(cmd(m,'pass'));assert(cmd(m,'proceed'));}assert(M.advance(m));
 const offered=m.market.cards.map(c=>c.uid);assert.equal(offered.length,4);assert(cmd(m,'draft-pair',{cardId:m.market.reserve[0].uid,tokenId:m.market.tokens[0].id}));assert.equal(m.market.tokens.length,3);
 m=M.restore(JSON.parse(JSON.stringify(m)));assert.deepEqual(m.market.cards.map(c=>c.uid),offered);assert.equal(cards(m).length,85);
});
