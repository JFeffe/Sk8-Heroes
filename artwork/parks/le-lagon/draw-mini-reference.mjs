// Exact orthographic projection of a low mini-ramp, for illustration reference.
import {writeFileSync} from 'node:fs';
const radius=2.2,height=1.1,width=6,length=12;
const run=Math.sqrt(2*radius*height-height*height),left=4-run,right=8+run;
const z=u=>u<left||u>right?height:u<4?radius-Math.sqrt(radius*radius-(u-4)**2):u<=8?0:radius-Math.sqrt(radius*radius-(u-8)**2);
const project=(u,v,w)=>[700+(u-6)*55-(v-3)*45,420+(u-6)*20+(v-3)*24-w*90];
const point=p=>p.map(n=>n.toFixed(2)).join(',');
const polygon=(points,fill,stroke='#123e49',sw=1)=>`<polygon points="${points.map(point).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const line=(a,b,color='#123e49',sw=3)=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
const samples=[0,left,...Array.from({length:25},(_,i)=>left+(4-left)*i/24),4,8,...Array.from({length:25},(_,i)=>8+(right-8)*i/24),right,length].filter((v,i,a)=>!i||v>a[i-1]+1e-8);
const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="840" viewBox="0 0 1400 840"><rect width="1400" height="840" rx="26" fill="#fff6df"/><text x="70" y="68" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="#073f4e">MINI-RAMPE — GÉOMÉTRIE DE RÉFÉRENCE</text><text x="70" y="103" font-family="Arial,sans-serif" font-size="18" fill="#456d6c">Deux courbes opposées · fond plat · decks à même hauteur · copings parallèles</text>`];
parts.push(polygon([[180,540],[890,795],[1240,560],[520,300]],'#194c4e0d','none',0));
const side=v=>[...samples.map(u=>project(u,v,z(u))),project(length,v,-.15),project(0,v,-.15)];
parts.push(polygon(side(0),'#b3d8cd'));
parts.push(polygon([project(0,0,-.15),project(0,width,-.15),project(0,width,height),project(0,0,height)],'#318d91'));
const faces=[];
for(let i=0;i<samples.length-1;i++)for(let j=0;j<6;j++){
 const a=samples[i],b=samples[i+1],v=j*width/6,t=(a+b)/2;
 faces.push({depth:4050*t+4950*(v+.5)+2220*(z(a)+z(b))/2,points:[project(a,v,z(a)),project(b,v,z(b)),project(b,v+1,z(b)),project(a,v+1,z(a))],fill:t<left||t>right?'#f8e9c6':t<4?'#f0dfb6':t>8?'#e9d6ac':'#f7e9ca'});
}
faces.sort((a,b)=>a.depth-b.depth).forEach(f=>parts.push(polygon(f.points,f.fill,'#c9b88d',.55)));
parts.push(polygon(side(width),'#73c8bd','#123e49',2));
parts.push(polygon([project(length,0,-.15),project(length,width,-.15),project(length,width,height),project(length,0,height)],'#54b7b0'));
for(const u of [left,right])parts.push(line(project(u,0,height+.02),project(u,width,height+.02),'#073f4e',5));
parts.push(`<polyline points="${samples.map(u=>point(project(u,width,z(u)))).join(' ')}" fill="none" stroke="#123e49" stroke-width="2"/>`);
// A true side section makes the geometry independent of an artistic rendering.
const profile=samples.map(u=>[150+u*85,762-z(u)*73]);
parts.push(`<text x="70" y="631" font-family="Arial,sans-serif" font-size="19" font-weight="bold" fill="#073f4e">COUPE LATÉRALE</text><polyline points="${profile.map(point).join(' ')}" fill="none" stroke="#ed7939" stroke-width="5" stroke-linejoin="round"/>`);
parts.push(`<text x="637" y="806" font-family="Arial,sans-serif" font-size="16" fill="#456d6c">fond plat</text></svg>`);
const svg=parts.join('');
writeFileSync(new URL('mini-ramp-reference.svg',import.meta.url),svg);
