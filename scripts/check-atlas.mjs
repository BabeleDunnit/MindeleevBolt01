import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {pathToFileURL} from "node:url";
const data=JSON.parse(await readFile("public/phenotype-atlas.json","utf8"));
assert(data.stats.recipesAttempted>=250,"insufficient candidate generation");
assert(data.stats.eligible>=20,"too few valid meshes for a pilot");
assert(data.stats.provisionalForms>=5,"not enough provisional geometric species");
assert(data.forms.length>=5&&data.forms.length<=36,"invalid shortlist");
const ids=new Set(),seen=new Set();
for(const species of data.forms){
 assert(!ids.has(species.id),"duplicate species id");ids.add(species.id);
 assert(Array.isArray(species.signature)&&species.signature.length===3);
 assert(species.signature.every(x=>Number.isFinite(x)&&x>=0));
 assert(species.recipes.includes(species.primary));
 assert(species.recipes.length===species.aliases,"alias counter wrong");
 assert(species.vertices>=4&&species.vertices<=65);
 for(const recipe of species.recipes){assert(!seen.has(recipe),"one recipe assigned to multiple species");seen.add(recipe);}
}
const dir=await mkdtemp(join(tmpdir(),"atlas-solver-"));
try{
 const out=join(dir,"planner.mjs");
 await build({entryPoints:["src/experiments/synthesisPlanner.ts"],outfile:out,tsconfig:"tsconfig.app.json",
  platform:"node",format:"esm",bundle:true,logLevel:"warning"});
 const {synthesisPlan,SYNTHESIS_PRESETS}=await import(pathToFileURL(out).href);
 const sample=SYNTHESIS_PRESETS.find(x=>x.id==="six");
 const found=synthesisPlan(sample.dna,["adkC"],3,5000);
 // Palette is a genetic constraint; an atlas recipe with palette 00 is not directly
 // equivalent to an inventory carrying palette 05. Test a matching target instead.
 const achievable=synthesisPlan(sample.dna,["adk05C"],3,5000);
 assert.equal(achievable.status,"found","fuse should reconstruct adk05C");
 assert(achievable.steps.length===2,"expected two fusions from three operators");
 const immediate=synthesisPlan(["a05C"],["aC"],3,100);
 assert(immediate.status==="found"&&immediate.steps.length===0,"phenotype ignores palette");
 const impossible=synthesisPlan(["T"],["dC"],1,100);
 assert(impossible.status!=="found","seed mutation isn't available");
 console.log(JSON.stringify({validation:"PASS",sampleStatus:found.status,forms:data.forms.length,recipesSeen:seen.size,stats:data.stats}));
}finally{await rm(dir,{recursive:true,force:true});}
