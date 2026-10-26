import {axialToPixel,hexesUpToRing} from "@/hex/hexGrid";
import {recipeToInt} from "@/polytron/mapping";

export type Phase="fluid"|"crystal";
export type Particle={id:string;dna:string;x:number;y:number;vx:number;vy:number;sink?:string};
export type World={phase:Phase;nodes:Particle[];energy:number;steps:number;actions:number};
export type Result={ok:true;world:World;explanation:string}|{ok:false;reason:string};
export const SINKS=Array.from(hexesUpToRing(2)).map(c=>{
 const p=axialToPixel(c.axial,45);return {key:c.ring+":"+c.idx,ring:c.ring,x:p.x,y:p.y,axial:c.axial};
});
const POS=new Map(SINKS.map(s=>[s.key,s]));
export const PRESETS=[
 {name:"01 · Primo legame",hint:"Cristallizza, fondi a05C con d05C e osserva il nuovo equilibrio.",xy:[[-65,-32],[0,8],[-98,91],[112,65]]},
 {name:"02 · Campo perturbato",hint:"Stesse ricette, posizioni diverse: confronta simulazione, impulsi e cattura.",xy:[[-129,-75],[118,107],[-33,101],[98,-101]]}
];
export function initial(index=0):World{
 const p=PRESETS[index]||PRESETS[0],dna=["a05C","d05C","adk02D","k02D"];
 return {phase:"fluid",energy:10,steps:0,actions:0,nodes:dna.map((d,i)=>({id:"ABCD"[i],dna:d,x:p.xy[i][0],y:p.xy[i][1],vx:0,vy:0}))};
}
export function parts(dna:string){const m=/^([a-z]*)(\d{2})?([TOCID])$/.exec(dna);
 if(!m)throw new Error("DNA invalido");return {ops:m[1],palette:Number(m[2]||0),seed:m[3]};}
export function makeDNA(ops:string,palette:number,seed:string){
 const dna=ops+(palette===0?"":String(palette).padStart(2,"0"))+seed;recipeToInt(dna);return dna;
}
const RADII:Record<string,number>={T:78,C:106,O:122,D:140,I:157};
export function desiredDistance(a:Particle,b:Particle){
 const x=parts(a.dna),y=parts(b.dna);
 return (x.palette===y.palette?64:124)+(x.seed===y.seed?0:12)+7*Math.abs(x.ops.length-y.ops.length);
}
export function stress(w:World){
 let sum=0;for(let i=0;i<w.nodes.length;i++)for(let j=i+1;j<w.nodes.length;j++){
  const a=w.nodes[i],b=w.nodes[j];sum+=Math.pow(Math.hypot(a.x-b.x,a.y-b.y)-desiredDistance(a,b),2);
 }
 for(const p of w.nodes)sum+=Math.pow(Math.hypot(p.x,p.y)-RADII[parts(p.dna).seed],2)*0.18;
 return Math.round(sum/100);
}
function tick(nodes:Particle[]):Particle[]{
 const fx=nodes.map(()=>0),fy=nodes.map(()=>0),dt=0.05;
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
  const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,dist=Math.max(.001,Math.hypot(dx,dy));
  const force=Math.max(-10,Math.min(10,(dist-desiredDistance(a,b))*.072));
  fx[i]+=dx/dist*force;fy[i]+=dy/dist*force;fx[j]-=dx/dist*force;fy[j]-=dy/dist*force;
 }
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i],r=Math.max(.001,Math.hypot(n.x,n.y)),force=Math.max(-8,Math.min(8,(r-RADII[parts(n.dna).seed])*.042));
  fx[i]-=n.x/r*force;fy[i]-=n.y/r*force;
 }
 return nodes.map((n,i)=>{
  const mass=1+parts(n.dna).ops.length*.17;
  const vx=Math.max(-65,Math.min(65,(n.vx+fx[i]/mass*dt)*.978));
  const vy=Math.max(-65,Math.min(65,(n.vy+fy[i]/mass*dt)*.978));
  return {...n,vx,vy,x:Math.max(-195,Math.min(195,n.x+vx*dt)),y:Math.max(-195,Math.min(195,n.y+vy*dt))};
 });
}
export function advance(w:World,n:number):World{
 if(w.phase!=="fluid"||!Number.isInteger(n)||n<1||n>480)return w;
 let nodes=w.nodes.map(p=>({...p}));for(let i=0;i<n;i++)nodes=tick(nodes);
 return {...w,nodes,steps:w.steps+n};
}
export function quantize(nodes:Particle[]):Record<string,string>{
 if(nodes.length>6||nodes.length>SINKS.length)throw new Error("Massimo sei particelle.");
 const ordered=[...nodes].sort((a,b)=>a.id.localeCompare(b.id));
 type Entry={cost:number;path:number[]};
 let dp=new Map<number,Entry>([[0,{cost:0,path:Array(ordered.length).fill(-1)}]]);
 for(let s=0;s<SINKS.length;s++){
  const next=new Map(dp);
  for(const [mask,entry] of dp)for(let i=0;i<ordered.length;i++){
   if(mask&(1<<i))continue;
   const p=ordered[i],site=SINKS[s],cost=entry.cost+(p.x-site.x)**2+(p.y-site.y)**2;
   const newMask=mask|(1<<i),prev=next.get(newMask);
   if(!prev||cost<prev.cost-1e-8){const path=entry.path.slice();path[i]=s;next.set(newMask,{cost,path});}
  }dp=next;
 }
 const best=dp.get((1<<ordered.length)-1);if(!best)throw new Error("Assegnazione impossibile.");
 const mapping:Record<string,string>={};
 ordered.forEach((p,i)=>mapping[p.id]=SINKS[best.path[i]].key);
 return mapping;
}
export function crystallize(w:World):World{
 if(w.phase!=="fluid")return w;
 const assignment=quantize(w.nodes);
 return {...w,phase:"crystal",actions:w.actions+1,nodes:w.nodes.map(p=>{
  const sink=POS.get(assignment[p.id])!;return {...p,x:sink.x,y:sink.y,vx:0,vy:0,sink:sink.key};
 })};
}
export function release(w:World):World{
 if(w.phase!=="crystal")return w;
 return {...w,phase:"fluid",actions:w.actions+1,nodes:w.nodes.map(p=>({...p,sink:undefined,vx:0,vy:0}))};
}
export function neighbors(a:string,b:string){
 const x=POS.get(a),y=POS.get(b);if(!x||!y)return false;
 const dq=x.axial.q-y.axial.q,dr=x.axial.r-y.axial.r;
 return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))===1;
}
const fail=(reason:string):Result=>({ok:false,reason});
export function impulse(w:World,id:string,dx:number,dy:number):Result{
 if(w.phase!=="fluid")return fail("Impulso disponibile soltanto in fase fluida.");
 if(w.energy<1)return fail("Serve 1 ENERGY.");
 if(!w.nodes.some(p=>p.id===id))return fail("Seleziona prima un Polytrone.");
 if(Math.hypot(dx,dy)<.5)return fail("Direzione non valida.");
 const len=Math.hypot(dx,dy);
 return {ok:true,world:{...w,energy:w.energy-1,actions:w.actions+1,nodes:w.nodes.map(p=>p.id===id?{...p,vx:p.vx+45*dx/len,vy:p.vy+45*dy/len}:p)},explanation:"Impulso a "+id+": −1 ENERGY. La simulazione avanza solo su comando."};
}
export function fuse(w:World,idA:string,idB:string):Result{
 if(w.phase!=="crystal")return fail("Cristallizza prima di fondere.");
 const a=w.nodes.find(p=>p.id===idA),b=w.nodes.find(p=>p.id===idB);
 if(!a||!b||a.id===b.id)return fail("Seleziona due Polytroni distinti nell'ordine desiderato.");
 if(!a.sink||!b.sink||!neighbors(a.sink,b.sink))return fail("Serve adiacenza fra sink.");
 const x=parts(a.dna),y=parts(b.dna);
 if(x.seed!==y.seed||x.palette!==y.palette)return fail("In questo test la fusione richiede seme e palette identici.");
 if(x.ops.length+y.ops.length>4)return fail("DNA risultante oltre quattro operatori.");
 if(w.energy<2)return fail("Servono 2 ENERGY.");
 const dna=makeDNA(x.ops+y.ops,x.palette,x.seed);
 return {ok:true,world:{...w,energy:w.energy-2,actions:w.actions+1,nodes:w.nodes.filter(p=>p.id!==b.id).map(p=>p.id===a.id?{...p,dna}:p)},explanation:a.dna+" + "+b.dna+" → "+dna+" (−2 ENERGY)."};
}
export function split(w:World,id:string,destination:string,cut:number):Result{
 if(w.phase!=="crystal")return fail("Cristallizza prima di scindere.");
 const p=w.nodes.find(n=>n.id===id);
 if(!p||!p.sink)return fail("Seleziona il Polytrone sorgente.");
 if(!neighbors(p.sink,destination))return fail("La destinazione dev'essere un sink adiacente.");
 if(w.nodes.some(n=>n.sink===destination))return fail("Sink di destinazione occupato.");
 if(w.nodes.length>=6)return fail("Limite sperimentale: sei Polytroni.");
 if(w.energy<2)return fail("Servono 2 ENERGY.");
 const x=parts(p.dna);
 if(!Number.isInteger(cut)||cut<1||cut>=x.ops.length)return fail("Seleziona un punto di taglio interno valido.");
 const a=makeDNA(x.ops.slice(0,cut),x.palette,x.seed),b=makeDNA(x.ops.slice(cut),x.palette,x.seed);
 const dest=POS.get(destination)!;
 const used=new Set(w.nodes.map(n=>n.id)),newId="EFGHIJKLMNOPQRSTUVWXYZ".split("").find(c=>!used.has(c))!;
 return {ok:true,world:{...w,energy:w.energy-2,actions:w.actions+1,nodes:[...w.nodes.map(n=>n.id===id?{...n,dna:a}:n),{id:newId,dna:b,x:dest.x,y:dest.y,vx:0,vy:0,sink:destination}]},explanation:p.dna+" → "+a+" + "+b+" (−2 ENERGY)."};
}
export function won(w:World){return w.nodes.some(n=>n.dna==="ad05C");}
export function selfTests():string[]{
 const errors:string[]=[],w=initial(),q=quantize(w.nodes),qReverse=quantize([...w.nodes].reverse());
 if(JSON.stringify(q)!==JSON.stringify(qReverse))errors.push("assignment/order");
 if(new Set(Object.values(q)).size!==w.nodes.length)errors.push("assignment/collision");
 const c=crystallize(w);
 if(c.phase!=="crystal"||release(c).phase!=="fluid")errors.push("phase");
 if(advance(c,30)!==c||advance(w,30).steps!==30)errors.push("step");
 if(stress(w)<0)errors.push("stress");
 const i=impulse(w,"A",1,0);if(!i.ok||i.world.energy!==9)errors.push("impulse");
 const example:World={...w,nodes:[{...w.nodes[0],x:0,y:0},{...w.nodes[1],x:67.5,y:0}]};
 const f=fuse(crystallize(example),"A","B");
 if(!f.ok||f.world.nodes[0].dna!=="ad05C")errors.push("fuse");
 return errors;
}
