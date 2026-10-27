// Executable mathematical checks of the geometry-derived research experiment.
// No special gameplay powers are inferred from a recipe's operator letters.
import {build} from "esbuild";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const temp=await mkdtemp(join(tmpdir(),"phenotype-"));
const failures=[];
const expect=(value,message)=>{if(!value)failures.push(message);};
const approx=(a,b,tol=1e-7)=>Math.abs(a-b)<=tol;
try{
 const out=join(temp,"metrics.mjs");
 await build({entryPoints:["src/experiments/phenotypeMetrics.ts"],outfile:out,bundle:true,tsconfig:"tsconfig.app.json",platform:"node",format:"esm",logLevel:"warning"});
 const {measurePoly,scatter,histogramDistance}=await import(pathToFileURL(out).href);
 const seeds={T:[4,6,4],C:[8,12,6],O:[6,12,8],D:[20,30,12],I:[12,30,20]};
 for(const [dna,[V,E,F]] of Object.entries(seeds)){
  const p=measurePoly(dna,true);
  expect(p.vertices===V&&p.edges===E&&p.faces===F,dna+": incorrect Platonic VEF");
  expect(p.euler===2&&p.closed,dna+": Euler/closed manifold");
  expect(Object.keys(p.edgeIncidenceHistogram).length===1&&p.edgeIncidenceHistogram[2]===E,dna+": edge incidence");
  expect(p.area>0&&p.avgEdge>0&&p.volume>0,dna+": positive geometric measures");
  expect(p.graphSpectrum?.length===Math.min(12,V),dna+": spectrum length");
  expect(approx(p.graphSpectrum?.[0]??99,0,1e-5),dna+": smallest graph eigenvalue");
  for(const input of [0,45,105,270]){
   for(const orientation of [0,75,215]){
    const response=scatter(p,input,orientation);
    expect(approx(response.outgoing,1)&&response.absorbed===0,dna+": nonconservative scattering");
    expect(response.bins.every(x=>x>=-1e-12&&Number.isFinite(x)),dna+": negative/angular energy");
   }
  }
 }
 const cuboct=measurePoly("aC");
 expect(cuboct.vertices===12&&cuboct.edges===24&&cuboct.faces===14,"ambo cube expected cuboctahedron VEF");
 const dual=measurePoly("dC"),octa=measurePoly("O");
 expect(dual.shapeKey===octa.shapeKey,"dual cube/octagon combinatorial descriptor");
 for(const dna of ["aC","aaC","adC","daC","kC","tC","aT","kD"]){
   const p=measurePoly(dna);
   expect(p.euler===2&&p.closed,dna+": topology not closed or bad Euler");
   expect(p.features.every(f=>f.area>0&&f.normal.every(Number.isFinite)),dna+": face area/normal");
 }
 // Palette genotype must have no influence on geometry-only hypotheses.
 const a=measurePoly("aC"),colored=measurePoly("a05C");
 expect(a.shapeKey===colored.shapeKey&&approx(a.area,colored.area),"palette changed physical geometry");
 const ra=scatter(a,35,60),rb=scatter(colored,35,60);
 expect(ra.bins.every((v,i)=>approx(v,rb.bins[i])),"palette changed geometry-only scattering");
 expect(approx(histogramDistance(a,colored),0),"same shape descriptor nonzero");
 const cycled=scatter(a,35,360);
 const original=scatter(a,35,0);
 expect(original.bins.every((v,i)=>approx(v,cycled.bins[i],1e-5)),"full rotation not invariant");
 if(failures.length)throw Error(failures.join("\n"));
 console.log("PASS: 5 Platonic seeds, Euler/closed, VEF, spectra, invariance, 8 Conway forms and 60+ conservation cases.");
}finally{await rm(temp,{recursive:true,force:true});}
