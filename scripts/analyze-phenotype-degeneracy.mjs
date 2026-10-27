import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const forms=["T","C","O","D","I","dC","aC","aaC","adC","daC","kC","tC","aT","dT","kD","gT","aI","kI","aD","tD","ddC","daT","adT"];
const dir=await mkdtemp(join("/tmp/","mindeleev-duplicates-"));
try{
 await build({entryPoints:["src/experiments/phenotypeMetrics.ts","src/experiments/surfaceShapeDNA.ts"],
  outdir:dir,entryNames:"[name]",outExtension:{".js":".mjs"},bundle:true,platform:"node",format:"esm",
  tsconfig:"tsconfig.app.json",logLevel:"warning"});
 const {measurePoly,angularResponseDistance}=await import(pathToFileURL(join(dir,"phenotypeMetrics.mjs")).href);
 const {surfaceShapeDNA,spectrumDistance}=await import(pathToFileURL(join(dir,"surfaceShapeDNA.mjs")).href);
 const phenotypes=[],skipped=[];
 for(const dna of forms){
  try{
   const p=measurePoly(dna),s=surfaceShapeDNA(p.poly);
   phenotypes.push({dna,phenotype:p,spectrum:s});
  }catch(error){skipped.push({dna,error:String(error)});}
 }
 const pairs=[];
 for(let i=0;i<phenotypes.length;i++)for(let j=i+1;j<phenotypes.length;j++){
  const a=phenotypes[i],b=phenotypes[j];
  pairs.push({
   pair:[a.dna,b.dna],
   sameDescriptor:a.phenotype.shapeKey===b.phenotype.shapeKey,
   angular:Number(angularResponseDistance(a.phenotype,b.phenotype).toFixed(6)),
   spectral:a.spectrum&&b.spectrum?Number(spectrumDistance(a.spectrum,b.spectrum).toFixed(6)):null
  });
 }
 const nearAngular=pairs.filter(p=>p.angular<.07).sort((a,b)=>a.angular-b.angular);
 const sameDescriptor=pairs.filter(p=>p.sameDescriptor);
 const nearSpectral=pairs.filter(p=>p.spectral!==null&&p.spectral<.07).sort((a,b)=>a.spectral-b.spectral);
 const angularSimilarSpectralDifferent=pairs.filter(p=>p.angular<.15&&p.spectral!==null&&p.spectral>.1)
    .sort((a,b)=>b.spectral-a.spectral);
 console.log(JSON.stringify({
  scanned:phenotypes.length, skipped,
  nPairs:pairs.length,nearAngularCount:nearAngular.length,
  nearAngular:nearAngular.slice(0,18),
  sameDescriptor:sameDescriptor.slice(0,15),
  nearSpectral:nearSpectral.slice(0,12),
  angularSimilarSpectralDifferent:angularSimilarSpectralDifferent.slice(0,18)
 },null,2));
 if(!pairs.length)throw Error("No comparisons");
 if(!sameDescriptor.some(p=>p.pair.includes("ddC")&&p.pair.includes("C")))throw Error("dual involution signature failed");
 const same=pairs.find(p=>p.pair.includes("ddC")&&p.pair.includes("C"));
 if(same&&same.spectral!==null&&same.spectral>.035)throw Error("dual involution surface spectrum failed");
}finally{await rm(dir,{recursive:true,force:true});}
