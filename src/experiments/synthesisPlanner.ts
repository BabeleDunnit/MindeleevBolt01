/**
 * A deliberately bounded synthesis-route explorer.
 * Reproduces *genetic* rules from Sprint 09: fusion concatenates two operator
 * strings if seed/palette match, fission splits a string at an internal point.
 * This is NOT a complete boardgame solver (no adjacency, sink, ENERGY budget,
 * drag, or mutable individual roster). "not found" means only "not found
 * within the explored bounded search".
 */
export const SYNTHESIS_PRESETS=[
 {id:"intro",label:"Scenario 01 · quattro individui",dna:["a05C","d05C","adk02D","k02D"]},
 {id:"six",label:"Scenario 03 · sei individui",dna:["a05C","d05C","k05C","ad02D","k02D","a02D"]},
 {id:"eight",label:"Scenario 04 · otto individui",dna:["a05C","d05C","adk05C","a02D","d02D","k02D","ad04T","k04T"]}
];
export type Step={action:"fusione"|"fissione";before:string[];after:string[];label:string};
export type Plan={status:"found"|"not-found"|"limited";recipe?:string;steps:Step[];visited:number;cost:number;note:string};
const parse=(dna:string)=>{
 const m=/^([a-z]*)(\d{2})?([TOCID])$/.exec(dna);
 if(!m)throw Error("DNA non valido: "+dna);
 return {ops:m[1],palette:m[2]??"",seed:m[3]};
};
const encode=(ops:string,palette:string,seed:string)=>ops+palette+seed;
const normalize=(x:string[])=>[...x].sort();
const key=(x:string[])=>normalize(x).join("|");
const phenotype=(dna:string)=>{const x=parse(dna);return x.ops+x.seed;};

export function synthesisPlan(initial:readonly string[],aliases:readonly string[],maxDepth=4,maxVisited=4500):Plan{
 const targets=new Set(aliases.map(phenotype));
 if(!targets.size)return {status:"not-found",steps:[],visited:0,cost:0,note:"Nessuna ricetta disponibile."};
 const start=normalize([...initial]);
 const queue:[string[],Step[]][]=[[start,[]]];
 const visited=new Set([key(start)]);
 const match=(state:string[])=>state.find(d=>targets.has(phenotype(d)));
 let index=0;
 for(;index<queue.length&&index<maxVisited;index++){
  const [inventory,steps]=queue[index],found=match(inventory);
  if(found)return {status:"found",recipe:found,steps,visited:visited.size,cost:steps.length*2,
    note:"Raggiungibilità genetica soltanto: il costo non include spostamenti, adiacenza o vincoli fisici sulla scacchiera."};
  if(steps.length>=maxDepth)continue;
  const next=(state:string[],step:Step)=>{
   const sorted=normalize(state),k=key(sorted);
   if(!visited.has(k)){visited.add(k);queue.push([sorted,[...steps,step]]);}
  };
  for(let i=0;i<inventory.length;i++){
   const a=parse(inventory[i]);
   for(let cut=1;cut<a.ops.length;cut++){
    const p=encode(a.ops.slice(0,cut),a.palette,a.seed);
    const q=encode(a.ops.slice(cut),a.palette,a.seed);
    next([...inventory.slice(0,i),...inventory.slice(i+1),p,q],
      {action:"fissione",before:[inventory[i]],after:[p,q],label:inventory[i]+" → "+p+" + "+q});
   }
   for(let j=0;j<inventory.length;j++){
    if(i===j)continue; // order matters
    const b=parse(inventory[j]);
    if(a.seed!==b.seed||a.palette!==b.palette)continue;
    const ops=a.ops+b.ops;
    if(ops.length===0||ops.length>4)continue;
    const merged=encode(ops,a.palette,a.seed);
    const rest=inventory.filter((_,k)=>k!==i&&k!==j);
    next([...rest,merged],{action:"fusione",before:[inventory[i],inventory[j]],
      after:[merged],label:inventory[i]+" + "+inventory[j]+" → "+merged});
   }
  }
 }
 const limited=index>=maxVisited;
 return {status:limited?"limited":"not-found",steps:[],visited:visited.size,cost:0,
  note:limited?"Esplorazione interrotta al limite: non è una prova di impossibilità.":
   "Nessuna ricetta trovata entro "+maxDepth+" operazioni genetiche; non significa che sia impossibile con altre risorse o mutazioni."};
}
