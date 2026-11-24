import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";
const root=await mkdtemp(join(process.cwd(),".periodic-test-"));
async function load(path,name,ui=false){
 const outfile=join(root,name+".mjs");
 await build({entryPoints:[path],outfile,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return import(pathToFileURL(outfile).href);
}
try{
 const [num,cat,ui,prior,life,geometry,conway,primes]=await Promise.all([
  load("src/polytron/politronicNumber.ts","number"),
  load("src/polytron/periodicCatalog.ts","catalog"),
  load("src/experiments/PolytronPeriodicLab.tsx","ui",true),
  load("src/polytron/mapping.ts","existing"),
  load("src/polytron/mindeleevLife.ts","life"),
  load("src/polytron/polytron.ts","geometry"),
  load("src/polyhedronisme/polyhedronisme.ts","conway"),
  load("src/polytron/primeManifestations.ts","prime-manifestations")
 ]);
 assert.equal(primes.PRIME_MANIFESTATION_COUNT,72);
 assert.equal(primes.PRIME_MANIFESTATIONS.length,72);
 assert.equal(primes.PRIME_MANIFESTATIONS[0].prime,2);
 assert.equal(primes.PRIME_MANIFESTATIONS[71].prime,359);
 assert.equal(primes.LARGEST_PRIME_MANIFESTATION,359);
 assert.equal(primes.PRIME_CATALOG_PERIODS,72);
 const distinct=new Set();
 for(const item of primes.PRIME_MANIFESTATIONS){
  assert.equal(item.index,distinct.size+1);
  assert(!distinct.has(item.prime),"All selected prime polytronic numbers must differ");
  distinct.add(item.prime);
  assert(item.prime>=2);
  for(let divisor=2;divisor*divisor<=item.prime;divisor++)
   assert.notEqual(item.prime%divisor,0,
    "Not a prime: "+item.prime);
  assert.equal(item.dna,num.dnaFromPolitronNumber(item.prime));
  assert.equal(item.group,((item.prime-1)%5)+1);
  assert.equal(item.period,Math.floor((item.prime-1)/5)+1);
  assert.equal(item.groupCode,num.PERIODIC_SEEDS[item.group-1]);
  assert.equal(item.energy,life.intrinsicEnergy(item.prime,0));
  assert.equal(primes.polytronPeriodicUrl(item.prime),
   "?experiment=polytron-periodic&polytron="+item.prime);
  assert.equal(ui.periodicNumberFromSearch("?experiment=polytron-periodic&polytron="+item.prime),
   item.prime,"Every prime must open by direct URL on its canonical periodic cell");
 }
 for(const invalid of ["","?polytron=0","?polytron=-2","?polytron=abc",
  "?polytron=10001","?polytron=2.5","?polytron=NaN","?polytron=01"]){
  assert.equal(ui.periodicNumberFromSearch(invalid),null,
   "Invalid URL must never focus an unrelated periodic cell: "+invalid);
 }
 assert.equal(ui.periodicNumberFromSearch("?polytron=359"),359);
 assert.equal(ui.periodicNumberFromSearch("?polytron=10000"),10000);
 const primeUiSource=await readFile("src/experiments/PrimeManifestationsLab.tsx","utf8");
 const appSource=await readFile("src/App.tsx","utf8");
 const periodicSource=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 assert(appSource.includes('experiment") === "polytron-primes"')&&
  appSource.includes("<PrimeManifestationsLab />"),
  "The prime reference table must be available as a dedicated experiment URL");
 assert(primeUiSource.includes("PRIME_MANIFESTATIONS.map(item=>")&&
  primeUiSource.includes("SharedPeriodic3D")&&
  primeUiSource.includes('data-polytron-viewport=""')&&
  primeUiSource.includes("polytronPeriodicUrl(item.prime)")&&
  primeUiSource.includes("prime-lab-table"),
  "Every entry must show the real periodic 3D preview and an individual deep link");
 assert(periodicSource.includes("periodicNumberFromSearch(window.location.search)")&&
  periodicSource.includes('scrollIntoView({behavior:"smooth",block:"center"})')&&
  periodicSource.includes('deepUrl.searchParams.set("polytron",number.toString())'),
  "The existing periodic lookup must support URL focus and shareable number searches");

 assert.deepEqual([...num.PERIODIC_OPERATORS],[...prior.OPERATORS]);
 assert.deepEqual([...num.PERIODIC_SEEDS],["T","C","O","D","I"]);
 for(let n=1;n<=10000;n++){
  const dna=num.dnaFromPolitronNumber(n);
  assert.equal(num.politronNumberFromDNA(dna),BigInt(n),"roundtrip "+n);
  assert(!/\d/.test(dna),"DNA must be palette-free");
 }
 const alpha=prior.OPERATORS;
 const expected=["T","C","O","D","I",...["T","C","O","D","I"].map(seed=>alpha[0]+seed),
  ...["T","C","O","D","I"].map(seed=>alpha[1]+seed)];
 expected.forEach((dna,i)=>assert.equal(num.dnaFromPolitronNumber(i+1),dna));
 assert.equal(num.rowIndexToOps(0n),"");
 assert.equal(num.rowIndexToOps(1n),alpha[0]);
 assert.equal(num.rowIndexToOps(1n+BigInt(alpha.length)),alpha[0]+alpha[0]);
 const giant=alpha.join("").repeat(2)+"I";
 assert.equal(num.dnaFromPolitronNumber(num.politronNumberFromDNA(giant)),giant,
  "A chain longer than 4 must remain precisely reversible");
 for(const invalid of ["a02T","09I","g3O","tA","","aZ","Dk"]){
  assert.throws(()=>num.politronNumberFromDNA(invalid),"Invalid bare ConwayDNA "+invalid);
 }
 assert.throws(()=>num.dnaFromPolitronNumber(0));
 const table=new cat.PeriodicCatalog();
 table.appendRows(3);
 assert.equal(table.entries.length,15);
 for(let i=0;i<table.entries.length;i++){
  const e=table.entries[i];
  assert.equal(e.number,i+1);
  assert.equal(e.dna,num.dnaFromPolitronNumber(i+1));
  assert.equal(e.row,Math.floor(i/5));
  assert.equal(e.col,i%5);
  assert(e.equivalents.every(p=>p<e.number),"Equivalents must only refer to predecessors");
 }
 const first=table.entries.slice(0,5);
 assert(first.every(e=>e.status==="ready"));
 assert(first.every(e=>e.shapeStatus==="measured"),"All Platonic seeds must receive ShapeDNA");
 const dC=table.entries.find(e=>e.dna==="dC");
 const dO=table.entries.find(e=>e.dna==="dO");
 assert(dC&&dO);
 assert(dC.equivalents.includes(3),"Dual cube must point to previous octahedron #3");
 assert(dO.equivalents.includes(2),"Dual octahedron must point to previous cube #2");
 const before=table.entries.map(e=>({number:e.number,dna:e.dna}));
 table.appendRows(1);
 assert.deepEqual(table.entries.slice(0,15).map(e=>({number:e.number,dna:e.dna})),before);
 // Validate every cell in the default 100 periods, including entries whose
 // geometries cannot be rendered. Numeric energy is shared with Life logic.
 for(let n=1;n<=500;n++){
  const group=((n-1)%5)+1,period=Math.floor((n-1)/5)+1;
  const expected=2+(period-1)+(group-1);
  assert.equal(life.intrinsicEnergy(n,0),expected,
   "Mindeleev Life/periodic energy mismatch at #"+n);
  const entry={...first[0],number:n,row:period-1,col:group-1,
   seed:num.PERIODIC_SEEDS[group-1],
   dna:num.dnaFromPolitronNumber(n),renderable:n%17!==0,
   faceClassIds:undefined,faceTypeCount:undefined,equivalents:[]};
  const cell=renderToString(React.createElement(ui.PeriodicCell,{
   entry,showEquivalent:false,showSpectrum:false,palette:0
  }));
  assert(cell.includes('data-intrinsic-energy="'+expected+'"'),
   "Card #"+n+" must display energy "+expected);
  assert(cell.includes('Intrinsic Energy'),
   "Card #"+n+" must explicitly label intrinsic energy");
  assert(cell.includes('aria-label="Intrinsic Energy: '+expected+' units"'),
   "Card #"+n+" must announce the correct energy accessibly");
  if(entry.renderable){
   assert.equal((cell.match(/data-polytron-viewport=/g)||[]).length,4,
    "Each renderable cell needs the same 3D polyhedron and three flattened views");
   for(const kind of ["solid","flat-x","flat-y","flat-z"])
    assert(cell.includes('data-view-kind="'+kind+'"'),
     "Card #"+n+" missing "+kind+" projection");
  }else{
   assert(!cell.includes("data-polytron-viewport="),
    "Unrenderable cells must not schedule invalid WebGL draws");
  }
  for(const axis of ["X","Y","Z"])
   assert(cell.includes("Flattened along "+axis),
    "Each card must identify the three static 2D projections");
 }
 for(const [n,expected] of [[1,2],[5,6],[6,3],[10,7],[11,4],[250,55],[500,105],[10000,2005]]){
  assert.equal(life.intrinsicEnergy(n,0),expected,"Boundary energy #"+n);
 }
  // The D seed must be the SAME regular solid, but aligned to the three
  // orthogonal XYZ two-fold symmetry axes. Projection along each compressed
  // axis must be exactly symmetric about both remaining screen axes.
  const dodeca=geometry.dnaToPoly("D");
  assert.equal(dodeca.vertices.length,20);
  assert.equal(dodeca.faces.length,12);
  const dodecaEdges=conway.edgesOf(dodeca);
  assert.equal(dodecaEdges.length,30);
  const lengths=dodecaEdges.map(([a,b])=>
   Math.hypot(...dodeca.vertices[a].map((v,j)=>v-dodeca.vertices[b][j])));
  assert(Math.max(...lengths)-Math.min(...lengths)<1e-8,
   "The exact golden-ratio seed must retain equal-length dodecahedron edges");
  const coordKey=values=>values.map(value=>Math.round(value*1e8)).join(",");
  for(let axis=0;axis<3;axis++){
   const [a,b]=[0,1,2].filter(i=>i!==axis);
   const outline=new Set(dodeca.vertices.map(p=>coordKey([p[a],p[b]])));
   assert.equal(outline.size,12,"Unexpected dodecahedron axial projection");
   for(const p of dodeca.vertices){
    assert(outline.has(coordKey([-p[a],p[b]]))&&
     outline.has(coordKey([p[a],-p[b]])),
     "D projection must be mirror-symmetric on BOTH screen axes, axis "+axis);
   }
  }
  // Every retained pentagon must remain planar, with its original winding.
  for(const f of dodeca.faces){
   assert.equal(f.length,5);
   const p=dodeca.vertices[f[0]],q=dodeca.vertices[f[1]],
    r=dodeca.vertices[f[2]];
   const u=p.map((v,i)=>q[i]-v),v=p.map((v,i)=>r[i]-v);
   const normal=[u[1]*v[2]-u[2]*v[1],
    u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   const centre=f.reduce((acc,i)=>acc.map((n,k)=>n+dodeca.vertices[i][k]/5),
    [0,0,0]);
   assert(normal.reduce((sum,n,i)=>sum+n*centre[i],0)>0,
    "D face winding must remain outward");
   for(const index of f){
    const distance=normal.reduce((sum,n,j)=>sum+n*(dodeca.vertices[index][j]-p[j]),0);
    assert(Math.abs(distance)<1e-8,"The dodecahedron faces must stay planar");
   }
  }
  console.log("PERIODIC D AXES",JSON.stringify({
   vertices:dodeca.vertices.length,faces:dodeca.faces.length,
   edges:dodecaEdges.length,projectedSymmetry:["X","Y","Z"]
  }));
 // The icosahedron now uses exact golden-ratio coordinates in the same
 // two-fold-axis frame as D. Its original face indices/winding stay intact.
 const icosa=geometry.dnaToPoly("I");
 assert.equal(icosa.vertices.length,12);
 assert.equal(icosa.faces.length,20);
 const icosaEdges=conway.edgesOf(icosa);
 assert.equal(icosaEdges.length,30);
 const icosaLengths=icosaEdges.map(([a,b])=>
  Math.hypot(...icosa.vertices[a].map((v,j)=>v-icosa.vertices[b][j])));
 assert(Math.max(...icosaLengths)-Math.min(...icosaLengths)<1e-8,
  "I must have exact equal-length edges, not rounded pentagonal rings");
 const projectionCounts=[];
 for(let axis=0;axis<3;axis++){
  const [a,b]=[0,1,2].filter(i=>i!==axis);
  const outline=new Set(icosa.vertices.map(p=>coordKey([p[a],p[b]])));
  projectionCounts.push(outline.size);
  assert.equal(outline.size,8,"Unexpected icosahedron axial projection");
  for(const p of icosa.vertices)
   assert(outline.has(coordKey([-p[a],p[b]]))&&
    outline.has(coordKey([p[a],-p[b]])),
    "I projection must be mirror-symmetric on both axes, view "+axis);
 }
 for(const f of icosa.faces){
  assert.equal(f.length,3);
  const [p,q,r]=f.map(index=>icosa.vertices[index]);
  const u=p.map((v,i)=>q[i]-v),v=p.map((x,i)=>r[i]-x);
  const normal=[u[1]*v[2]-u[2]*v[1],
   u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const centre=p.map((x,i)=>(x+q[i]+r[i])/3);
  assert(normal.reduce((sum,n,i)=>sum+n*centre[i],0)>0,
   "I must retain outward face winding after seed reorientation");
 }
 // Normalized dual-face centroids match the OTHER Platonic seed exactly.
 // This is stronger than mere symmetry: I and D share one canonical frame.
 const unit=p=>p.map(x=>x/Math.hypot(...p));
 const matches=(actual,reference,label)=>{
  assert.equal(actual.length,reference.length,label+" cardinality");
  const unmatched=[...reference];
  for(const p of actual){
   const i=unmatched.findIndex(q=>
    Math.hypot(...p.map((x,k)=>x-q[k]))<1e-8);
   assert(i>=0,label+": missing corresponding vertex");
   unmatched.splice(i,1);
  }
  assert.equal(unmatched.length,0,label+": unexpected vertices");
 };
 matches(conway.faceCenters(dodeca).map(unit),icosa.vertices.map(unit),
  "D face centres -> I vertices");
 matches(conway.faceCenters(icosa).map(unit),dodeca.vertices.map(unit),
  "I face centres -> D vertices");
 for(const [dual,base] of [["dD",icosa],["dI",dodeca]]){
  const result=geometry.dnaToPoly(dual);
  matches(result.vertices.map(unit),base.vertices.map(unit),
   "Conway dual "+dual+" must share the exact canonical frame");
 }
 console.log("PERIODIC I/D DUAL AXES",JSON.stringify({
  icosaVertices:icosa.vertices.length,icosaFaces:icosa.faces.length,
  icosaEdges:icosaEdges.length,axialProjections:projectionCounts,
  duality:"both directions",dodeca:"unchanged"
 }));
 // duO (#168) exposed the privileged-diagonal defect in the old 3D fan.
 // The canonical mesher must use centroid triangles for every 3D renderer,
 // independently of face starting index or winding.
 assert.equal(num.dnaFromPolitronNumber(168),"duO");
 const duO=geometry.dnaToPoly("duO");
 const edgeIncidence=new Map();
 for(const face of duO.faces){
  assert(face.length>=3,"Every duO face must be a polygon");
  for(let i=0;i<face.length;i++){
   const a=face[i],b=face[(i+1)%face.length];
   const key=Math.min(a,b)+"/"+Math.max(a,b);
   edgeIncidence.set(key,(edgeIncidence.get(key)??0)+1);
  }
 }
 assert([...edgeIncidence.values()].every(count=>count===2),
  "duO topology must be closed, without missing polygons or dangling edges");
 const triangleKey=t=>t.map(v=>v.map(c=>Math.round(c*1e5)/1e5).join(","))
  .sort().join("|");
 const triangleSignature=triangles=>triangles.map(triangleKey).sort();
 const centers=conway.faceCenters(duO);
 let polygonTriangles=0,oldFanTriangles=0;
 for(let fi=0;fi<duO.faces.length;fi++){
  const face=duO.faces[fi],center=centers[fi];
  const triangles=geometry.triangulateConwayFace(duO.vertices,face,center);
  const expected=face.length===3?1:face.length;
  assert.equal(triangles.length,expected,
   "Every polygon boundary edge must get exactly one centroid triangle");
  const turned=[...face.slice(1),face[0]];
  const reversed=[...face].reverse();
  assert.deepEqual(triangleSignature(triangles),
   triangleSignature(geometry.triangulateConwayFace(duO.vertices,turned,center)),
   "Cyclic reindexing must not change a face's surface: duO face "+fi);
  assert.deepEqual(triangleSignature(triangles),
   triangleSignature(geometry.triangulateConwayFace(duO.vertices,reversed,center)),
   "Reversing a face must preserve its undirected surface: duO face "+fi);
  polygonTriangles+=expected;
  oldFanTriangles+=face.length-2;
 }
 assert.equal(polygonTriangles,96,"duO must have 96 symmetric triangles");
 assert.equal(oldFanTriangles,60,"The old triangulation was a 60-triangle fan");
 const duOGeometry=geometry.polytronGeometry("duO");
 try{
  const expectedVertices=polygonTriangles*3;
  const position=duOGeometry.solid.getAttribute("position");
  assert.equal(position.count,expectedVertices,
   "The canonical WebGL solid must contain every symmetric triangle");
  assert.equal(duOGeometry.edges.getAttribute("position").count,
   duO.faces.reduce((sum,face)=>sum+2*face.length,0),
   "All original Conway face boundaries must remain unchanged");
  let offset=0;
  for(let fi=0;fi<duO.faces.length;fi++){
   const triangles=geometry.triangulateConwayFace(duO.vertices,
    duO.faces[fi],centers[fi]);
   for(const triangle of triangles)for(const vertex of triangle){
    assert(Math.abs(position.getX(offset)-vertex[0])<1e-6&&
     Math.abs(position.getY(offset)-vertex[1])<1e-6&&
     Math.abs(position.getZ(offset)-vertex[2])<1e-6,
     "The rendered mesh must use the ONE canonical face triangulation");
    offset++;
   }
  }
  assert.equal(offset,expectedVertices);
  console.log("PERIODIC duO GEOMETRY",JSON.stringify({
   vertices:duO.vertices.length,faces:duO.faces.length,
   triangles:polygonTriangles,previousFanTriangles:oldFanTriangles,
   closedEdges:edgeIncidence.size
  }));
 }finally{duOGeometry.solid.dispose();duOGeometry.edges.dispose();}
 // Representative Conway seeds and operators must share this surface rule.
 for(const dna of ["T","C","O","D","I","aC","dO","gD","pC","kT","qO","duO"]){
  const poly=geometry.dnaToPoly(dna),geo=geometry.polytronGeometry(dna);
  try{
   const expected=poly.faces.reduce((sum,f)=>sum+(f.length===3?1:f.length),0);
   assert.equal(geo.solid.getAttribute("position").count,expected*3,
    dna+" must use the canonical centroid surface everywhere");
   for(const n of geo.solid.getAttribute("position").array)
    assert(Number.isFinite(n),dna+" must not contain invalid vertices");
  }finally{geo.solid.dispose();geo.edges.dispose();}
 }
 assert.equal(ui.PERIODIC_FLAT_FACTOR,.05);
 for(const [kind,expected] of [
  ["solid",{x:1,y:1,z:1}],
  ["flat-x",{x:.05,y:1,z:1}],
  ["flat-y",{x:1,y:.05,z:1}],
  ["flat-z",{x:1,y:1,z:.05}]
 ])assert.deepEqual(ui.periodicViewScale(kind,1),expected,
  kind+" must compress exactly one local Polytron axis");
 assert.equal(ui.PERIODIC_SOLID_CAMERA_ZOOM,1.4,
  "3D preview should be another ~17% larger via perspective camera distance");
 assert.equal(ui.PERIODIC_SOLID_CAMERA_LIFT,.24,
  "The 3D camera should be lowered slightly so its object appears higher");
 const markup=renderToString(React.createElement(ui.default));
 for(const required of ["Periodic Table of Polytrons",
  "Periods to enumerate","Chromatica · 144 gradients","Original palettes","3D rotation","Equivalents",
  "ShapeDNA","Find Polytronic Number or ConwayDNA","Ruber","Chrysos"]){
  assert(markup.includes(required),"Missing UI "+required);
 }
 for(const required of ["Groups →","↓ Periods","Tetrahedra",
  "Cubes","Octahedra","Dodecahedra",
  "Icosahedra","Periods generated:",
  "Intrinsic Energy for each Polytron","The Chromatica contribution is fixed at 0"]){
  assert(markup.includes(required),"Missing periodic table terminology "+required);
 }
 assert(markup.includes('aria-expanded="true"')&&
  markup.includes('aria-controls="periodic-palette-panel"')&&
  markup.includes("Hide palettes"),
  "The Chromatica header needs an accessible palette collapse toggle");
 const src=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 for(const phrase of [
  "new THREE.OrthographicCamera","periodicViewScale(kind,geo.scale)",
  "camera.position.set(3,2.1,6.5).divideScalar(PERIODIC_SOLID_CAMERA_ZOOM)",
  "camera.position.y-=PERIODIC_SOLID_CAMERA_LIFT",
  "camera.lookAt(0,-PERIODIC_SOLID_CAMERA_LIFT,0)",
  'kind==="flat-x"','kind==="flat-y"','kind==="solid"',
  "new THREE.MeshBasicMaterial","polygonOffset:true",
  "polygonOffsetFactor:1","polygonOffsetUnits:1",
  "depthTest:true,depthWrite:false",
  'mesh.material=kind==="solid"?mat:flatMat',
  'edges.material=kind==="solid"?edgeMat:flatEdgeMat',
  "group.rotation.set(0,0,0)","flatCamera.lookAt(0,0,0)",
  'hidden={!palettesOpen}',"localStorage.setItem"
 ])assert(src.includes(phrase),
  "Missing orthographic tile projection or stored palette collapse: "+phrase);
 for(const required of ["THREE.WebGLRenderer","data-polytron-viewport","setScissor",
  "requestAnimationFrame","PALETTE_SETS","polytronGeometry","periodicCatalog.worker.ts"]){
  assert(src.includes(required),"Missing shared 3D implementation "+required);
 }
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "polytron-periodic"'));
 console.log("DUAL EQUIVALENCES",JSON.stringify({dC:dC.equivalents,dO:dO.equivalents}));
 console.log("PASS periodic: all 500 default Polytron cards display canonical intrinsic energy (including nonrenderable), matching Mindeleev Life; numbering and shared 3D unchanged");
}finally{await rm(root,{recursive:true,force:true});}
