/**
 * Build a pilot phenotype atlas OFFLINE from the actual polyhedron meshes.
 * Run: node scripts/build-phenotype-atlas.mjs
 * Output: public/phenotype-atlas.json + public/phenotype-atlas.csv
 *
 * Three separate facts:
 * - topological map signature: rooted face-dart traversal of an oriented map;
 * - provisional geometric equivalence: same topology and normalized distance matrix multiset;
 * - spatio-spectral proximity: Euclidean distance in the same 3 positive,
 *   area-normalized cotangent-FEM eigenvalues.
 *
 * The last is NOT proof of isometry or equivalence.
 */
import {build} from "esbuild";
import {mkdtemp,rm,mkdir,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const tmp=await mkdtemp(join(tmpdir(),"mindeleev-atlas-"));
const seeds=["T","C","O","D","I"];
const operators=["d","a","k","t","g","j","e","n"];
const MAX_VERTEX=65,MODES=3,SHOW=36;
const combos=[""];
for(const a of operators)combos.push(a);
for(const a of operators)for(const b of operators)combos.push(a+b);
const combos3=["dak","adk","kda","gak","aat","tad","kag","jda","akd","dad"];
combos.push(...combos3);
const candidates=[];
const rejected={invalid:0,tooManyVertices:0,invalidMesh:0,spectral:0};

function topologyCode(poly){
 const darts=[],map=new Map();
 for(const face of poly.faces){
  for(let j=0;j<face.length;j++){
   const u=face[j],v=face[(j+1)%face.length],key=u+":"+v;
   if(map.has(key))return null; // inconsistent face orientation or non-manifold edge
   const id=darts.length;map.set(key,id);darts.push({u,v,face:face.length,next:-1,twin:-1});
  }
 }
 let index=0;
 for(const face of poly.faces){
  for(let j=0;j<face.length;j++){darts[index+j].next=index+(j+1)%face.length;}
  index+=face.length;
 }
 for(const d of darts){d.twin=map.get(d.v+":"+d.u)??-1;if(d.twin<0)return null;}
 // Canonical rooted combinatorial-map traversal, including reversed cyclic orientation.
 let best=null;const n=darts.length;
 for(const backwards of [false,true]){
  const next=backwards?(()=>{const prev=new Array(n);for(let i=0;i<n;i++)prev[darts[i].next]=i;return prev;})():darts.map(d=>d.next);
  for(let root=0;root<n;root++){
   const renumber=new Int32Array(n).fill(-1),queue=[root];renumber[root]=0;
   for(let qi=0;qi<queue.length;qi++){
    const d=queue[qi];
    for(const nxt of [next[d],darts[d].twin])if(renumber[nxt]<0){renumber[nxt]=queue.length;queue.push(nxt);}
   }
   if(queue.length!==n)return null;
   const serial=queue.map(d=>String(renumber[next[d]]).padStart(4,"0")+String(renumber[darts[d].twin]).padStart(4,"0")).join("");
   if(best===null||serial<best)best=serial;
  }
 }
 return best;
}
function squaredDistanceSignature(verts){
 const d=[];
 let total=0;
 for(let i=0;i<verts.length;i++)for(let j=i+1;j<verts.length;j++){
  const a=verts[i],b=verts[j],v=(a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;
  d.push(v);total+=v;
 }
 const mean=total/Math.max(1,d.length);
 return d.map(v=>v/mean).sort((a,b)=>a-b);
}
const rmsSignature=(a,b)=>{
 if(a.length!==b.length)return Infinity;
 let sum=0;for(let i=0;i<a.length;i++)sum+=(a[i]-b[i])**2;
 return Math.sqrt(sum/Math.max(1,a.length));
};
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
// Euclidean by user request; all measured against fixed three nonzero-ish modes.
// This is intentionally a low-resolution pilot (tetrahedron only has 3 positive modes).
function farthest(items,n){
 const result=[],remaining=[...items];
 // Stratified seed anchors, NOT a claim that these are globally optimal prototypes.
 for(const seed of seeds){
  const i=remaining.findIndex(v=>v.primary===seed);
  if(i>=0){result.push(remaining[i]);remaining.splice(i,1);}
 }
 while(remaining.length&&result.length<n){
  let bestIndex=0,bestScore=-Infinity;
  for(let i=0;i<remaining.length;i++){
   const p=remaining[i];
   const novelty=Math.min(...result.map(q=>distance(p.signature,q.signature)));
   // Slight preference for coverage, avoid selecting only huge extreme meshes.
   const complexityPenalty=.015*Math.log1p(p.vertices);
   const score=novelty-complexityPenalty;
   if(score>bestScore){bestScore=score;bestIndex=i;}
  }
  result.push(remaining[bestIndex]);remaining.splice(bestIndex,1);
 }
 return result;
}
try{
 const out=join(tmp,"modules");
 await build({entryPoints:["src/experiments/phenotypeMetrics.ts","src/experiments/surfaceShapeDNA.ts"],outdir:out,
  bundle:true,platform:"node",format:"esm",outExtension:{".js":".mjs"},tsconfig:"tsconfig.app.json",logLevel:"warning"});
 const {measurePoly}=await import(pathToFileURL(join(out,"phenotypeMetrics.mjs")).href);
 const {surfaceShapeDNA}=await import(pathToFileURL(join(out,"surfaceShapeDNA.mjs")).href);
 for(const ops of combos)for(const seed of seeds){
  const dna=ops+seed;
  let phen;
  try{phen=measurePoly(dna);}catch{rejected.invalid++;continue;}
  if(!phen.closed||phen.euler!==2||phen.vertices<4){rejected.invalidMesh++;continue;}
  if(phen.vertices>MAX_VERTEX){rejected.tooManyVertices++;continue;}
  const spec=surfaceShapeDNA(phen.poly,MAX_VERTEX,4);
  if(!spec||spec.values.length<4||spec.maxOffDiagonal>5e-4||spec.degenerateTriangles>0){rejected.spectral++;continue;}
  const signature=spec.values.slice(1,1+MODES);
  const topology=topologyCode(phen.poly);
  if(!topology){rejected.invalidMesh++;continue;}
  candidates.push({
   dna,seed,ops,vertices:phen.vertices,edges:phen.edges,faces:phen.faces,
   faceSides:phen.faceSides,vertexDegrees:phen.vertexDegrees,
   shapeKey:phen.shapeKey,signature,poly:phen.poly,
   distances:squaredDistanceSignature(phen.poly.vertices)
  });
 }
 // Group numerically congruent candidates only with matching topological maps.
 // A sorted distance multiset is not a formal congruence proof: mark as provisional.
 const groups=[];
 for(const p of candidates){
  // Expensive rooted-map isomorphism is computed ONLY for geometrically-close
  // candidates, never for the thousands of clearly different mesh pairs.
  let g=null;
  for(const candidate of groups){
   if(candidate.shapeKey!==p.shapeKey||rmsSignature(candidate.distances,p.distances)>=.002)continue;
   const pCode=p.topology??(p.topology=topologyCode(p.poly));
   const gCode=candidate.topology??(candidate.topology=topologyCode(candidate.members[0].poly));
   if(pCode!==null&&gCode!==null&&pCode===gCode){g=candidate;break;}
  }
  if(!g){g={shapeKey:p.shapeKey,topology:null,distances:p.distances,recipes:[],members:[]};groups.push(g);}
  g.recipes.push(p.dna);g.members.push(p);
 }
 const base=groups.map(g=>{
  g.members.sort((a,b)=>a.ops.length-b.ops.length||a.dna.localeCompare(b.dna));
  const p=g.members[0];
  return {primary:p.dna,seed:p.seed,vertices:p.vertices,edges:p.edges,faces:p.faces,
    faceSides:p.faceSides,vertexDegrees:p.vertexDegrees,
    signature:p.signature.map(x=>Number(x.toFixed(7))),
    recipes:g.recipes.sort((a,b)=>a.length-b.length||a.localeCompare(b)),
    aliases:g.recipes.length,shapeKey:p.shapeKey
  };
 });
 base.sort((a,b)=>a.vertices-b.vertices||a.primary.localeCompare(b.primary));
 // Use stable IDs tied to the signature + combinatorics, not array position.
 // Hash does NOT substitute for an exact geometry canonicalization.
 const hash=str=>{let h=2166136261;for(const ch of str){h=Math.imul(h^ch.charCodeAt(0),16777619);}return (h>>>0).toString(36);};
 const seen=new Set();
 for(const p of base){
  let key=hash(p.shapeKey+"|"+p.signature.join(",")+"|"+p.primary),id="form-"+key,i=1;
  while(seen.has(id))id="form-"+key+"-"+i++;
  p.id=id;seen.add(id);
 }
 const selected=farthest(base,Math.min(SHOW,base.length));
 const scores=selected.map(p=>({...p,nearestDistance:Math.min(...selected.filter(q=>q!==p).map(q=>distance(p.signature,q.signature)),0x7fffffff)}));
 const results={
  version:1,generatedAt:"CI-build",method:"cotangent FEM, lumped mass, 3 positive area-normalized eigenvalues",
  selection:"seed anchors then max-min in 3D Shape-DNA with small mesh complexity tie-bias",
  equivalence:"topological rooted-dart canonical map + RMS normalized pairwise squared distances < 0.002 (provisional)",
  knobs:{operators,seeds,depth:2,extraWords:combos3,maxVertices:MAX_VERTEX,spectralModes:MODES,selectedMax:SHOW},
  stats:{recipesAttempted:combos.length*seeds.length,eligible:candidates.length,provisionalForms:base.length,selected:scores.length,rejected},
  forms:scores
 };
 if(!scores.length)throw Error("Empty phenotype atlas");
 if(!scores.some(x=>x.primary==="T")||!scores.some(x=>x.primary==="C"))throw Error("Missing Platonic anchors");
 for(const x of scores){
  if(x.signature.length!==MODES||x.signature.some(v=>!Number.isFinite(v)))throw Error("Invalid spectrum "+x.primary);
  if(!x.recipes.includes(x.primary))throw Error("Missing canonical recipe");
 }
 await mkdir("public",{recursive:true});
 await writeFile("public/phenotype-atlas.json",JSON.stringify(results));
 const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
 await writeFile("public/phenotype-atlas.csv",[
  ["species_id","canonical_recipe","aliases","V","E","F","lambda1","lambda2","lambda3","other_recipes"].map(quote).join(","),
  ...scores.map(x=>[x.id,x.primary,x.aliases,x.vertices,x.edges,x.faces,...x.signature,x.recipes.join(" ")].map(quote).join(","))
 ].join("\n"));
 console.log("Phenotype Atlas:",JSON.stringify(results.stats));
 console.log("Aliases:",base.filter(p=>p.recipes.length>1).slice(0,12).map(p=>p.primary+":"+p.recipes.join(",")));
 console.log("Sample:",scores.slice(0,10).map(p=>p.primary));
}finally{await rm(tmp,{recursive:true,force:true});}
