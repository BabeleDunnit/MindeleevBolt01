import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import React from "react";
import {renderToString} from "react-dom/server";

const temp=await mkdtemp(join(process.cwd(),".life-test-"));
async function load(entry,name,ui=false){
 const out=join(temp,name+".mjs");
 await build({entryPoints:[entry],outfile:out,bundle:true,format:"esm",platform:"node",
  packages:"external",tsconfig:"tsconfig.app.json",logLevel:"warning",
  loader:{".css":"empty"},
  ...(ui?{define:{"import.meta.env.BASE_URL":JSON.stringify("/MindeleevBolt01/")}}:{})});
 return await import(pathToFileURL(out).href);
}
try{
 const life=await load("src/polytron/mindeleevLife.ts","engine");
 const palette=await load("src/polytron/gradientPalettes.ts","chromatica");
 const ui=await load("src/experiments/MindeleevLifeLab.tsx","ui",true);
 assert.equal(life.allHexes(6).length,127);
 assert.equal(life.allHexes(0).length,1);
 assert.equal(new Set(life.allHexes().map(({q,r})=>life.hexKey(q,r))).size,127);
 assert.equal(life.HEX_DIRECTIONS.length,6);
 assert(life.HEX_DIRECTIONS.every(({q,r})=>life.hexRing(q,r)===1));
 assert.equal(life.GROUP_CODES.join(""),"TCODI");
 for(let n=1;n<=1000;n++){
  assert.equal(life.groupOf(n),life.groupOf(n+5));
  assert.equal(life.periodOf(n+5),life.periodOf(n)+1);
  assert.equal(life.groupOf(n),((n-1)%5)+1);
  assert.equal(n,5*(life.periodOf(n)-1)+life.groupOf(n));
 }
 assert.equal(life.groupOf(5),5);
 assert.equal(life.groupOf(6),1);
 assert.equal(life.periodOf(250),50);
 // Budget and energy share EXACTLY the same formula.
 assert.equal(life.intrinsicEnergy(1,0),2);
 assert.equal(life.intrinsicEnergy(6,0),3);
 assert.equal(life.intrinsicEnergy(2,0),3);
 assert.equal(life.intrinsicEnergy(11,0),4);
 assert.equal(life.intrinsicEnergy(11,2),6);
 assert.equal(life.recoveryEnergy(11,2),3);
 assert.equal(life.paletteEnergyBonus(8.5),0);
 assert.equal(life.paletteEnergyBonus(20),1);
 assert.equal(life.paletteEnergyBonus(60),3);
 assert.equal(life.paletteEnergyBonus(100),3);
 assert.throws(()=>life.intrinsicEnergy(0,0));
 assert.throws(()=>life.paletteEnergyBonus(-1));

 const nucleus=life.makeLifePreset("nucleus");
 assert.equal(nucleus.size,3);
 assert.equal(nucleus.get("0,0"),undefined);
 assert.deepEqual(life.neighboursOf(nucleus,0,0).sort((a,b)=>a-b),[1,2,6]);
 assert.equal(life.startingBalance(nucleus,0),life.STARTING_ENERGY-8);
 const before=[...nucleus];
 const p=life.calculateLife(nucleus,0);
 assert.deepEqual([...nucleus],before,"The generation must NOT mutate the input board");
 const center=p.predictions.get("0,0");
 assert.equal(center.outcome,"birth");
 assert.equal(center.next,11);
 assert.equal(center.neighbours.length,3);
 assert.equal(center.sumEnergy,8);
 assert.equal(center.requiredEnergy,8);
 assert.equal(center.candidate,11);
 assert.equal(center.parent,6);
 const centerLedger=life.lifeEnergyLedger(nucleus,p,"0,0",0);
 assert.equal(centerLedger.currentEnergy,0);
 assert.equal(centerLedger.projectedEnergy,4);
 assert.equal(centerLedger.candidate,11);
 assert.equal(centerLedger.candidateEnergy,4);
 assert.equal(centerLedger.neighbourTotal,8);
 assert.equal(centerLedger.requiredEnergy,8);
 assert.equal(centerLedger.surplus,0);
 assert.equal(centerLedger.deficit,0);
 assert.equal(centerLedger.actualEnergyCeded,0,
  "Birth counts neighbour energy without actually debiting it");
 assert.equal(centerLedger.returnedToTreasury,0);
 assert.deepEqual(centerLedger.neighbourContributions.map(x=>x.energy).sort(),
  [2,3,3],"Each of the three neighbours needs a visible energy entry");
 const donor=life.lifeEnergyLedger(nucleus,p,"1,0",0);
 assert.equal(donor.occupant,1);
 assert.equal(donor.currentEnergy,2);
 assert.equal(donor.projectedEnergy,0);
 assert.equal(donor.returnedToTreasury,1);
 assert.equal(donor.manualRecovery,1);
 assert.equal(centerLedger.manualRecovery,0);
 assert.equal(donor.actualEnergyCeded,0);
 assert.deepEqual(donor.supportedBirths,[{key:"0,0",number:11,potential:2}]);
 assert.equal([...p.predictions.keys()].reduce((sum,key)=>
  sum+life.lifeEnergyLedger(nucleus,p,key,0).returnedToTreasury,0),p.recovery,
  "The inspector's local treasury credits must sum to the exact turn refund");
 assert.equal(p.next.get("0,0"),11);
 assert.equal(p.born.length,1);
 assert.equal(p.born[0].n,11);
 assert(p.departed.length>0);
 const later=life.calculateLife(p.next,0);
 assert.equal(later.predictions.get("0,0").outcome,"depart",
  "Newly born polytrons may die in a later tick, not during their birth");

 // All 3 neighbours from distinct groups: no birth.
 const different=new Map([["1,0",1],["-1,0",2],["0,1",3]]);
 const diff=life.calculateLife(different,0).predictions.get("0,0");
 assert.equal(diff.outcome,"no-majority");
 assert.equal(diff.next,undefined);

 // Same group but insufficient local energy: the birth must be blocked.
 const poor=new Map([["1,0",1],["-1,0",201],["0,1",2]]);
 const blocked=life.calculateLife(poor,0).predictions.get("0,0");
 assert.equal(blocked.outcome,"no-energy");
 assert(blocked.requiredEnergy>blocked.sumEnergy);
 assert.equal(blocked.next,undefined);
 assert.equal(blocked.candidate,206);
 const poorPlan=life.calculateLife(poor,0);
 const poorLedger=life.lifeEnergyLedger(poor,poorPlan,"0,0",0);
 assert.equal(poorLedger.candidate,206);
 assert.equal(poorLedger.requiredEnergy,blocked.requiredEnergy);
 assert.equal(poorLedger.neighbourTotal,blocked.sumEnergy);
 assert.equal(poorLedger.deficit,blocked.requiredEnergy-blocked.sumEnergy);
 assert.equal(poorLedger.projectedEnergy,0);
 assert.equal(poorLedger.actualEnergyCeded,0);
 assert.throws(()=>life.lifeEnergyLedger(poor,poorPlan,"99,99",0));
 const diffLedger=life.lifeEnergyLedger(different,life.calculateLife(different,0),"0,0",0);
 assert.equal(diffLedger.candidate,undefined);
 assert.equal(diffLedger.requiredEnergy,0);
 assert.equal(diffLedger.neighbourContributions.length,3);

 // Survival at exactly 2 or 3 occupied neighbours, regardless of direction.
 for(const count of [0,1,2,3,4,5,6]){
  const board=new Map([["0,0",10]]);
  life.HEX_DIRECTIONS.slice(0,count).forEach((d,i)=>board.set(life.hexKey(d.q,d.r),1+i));
  const result=life.calculateLife(board,0).predictions.get("0,0");
  assert.equal(result.outcome,count===2||count===3?"survive":"depart");
 }
 // A ring of 6 is stable: each site has 2 neighbours and the centre has 6.
 const ring=life.makeLifePreset("ring");
 const ringNext=life.calculateLife(ring,1);
 assert.equal(ring.size,6);
 assert.equal(ringNext.born.length,0);
 assert.equal(ringNext.departed.length,0);
 assert.equal(ringNext.survivors,6);
 assert.deepEqual([...ringNext.next].sort(),[...ring].sort());

 // Check all 144 palettes, with same immutable identity, and bounded bonuses.
 for(const pair of palette.ALL_GRADIENTS){
  const bonus=life.paletteEnergyBonus(palette.perceptualDistance(
   pair.primary.hex,pair.secondary.hex));
  assert(bonus>=0&&bonus<=3);
  const trial=life.calculateLife(nucleus,bonus);
  assert.equal(trial.predictions.get("0,0").outcome,"birth");
  assert.equal(trial.predictions.get("0,0").next,11);
  assert.equal(life.startingBalance(nucleus,bonus),100-(8+3*bonus));
  const audit=life.lifeEnergyLedger(nucleus,trial,"0,0",bonus);
  assert.equal(audit.neighbourTotal,trial.predictions.get("0,0").sumEnergy);
  assert.equal(audit.requiredEnergy,trial.predictions.get("0,0").requiredEnergy);
  assert.equal(audit.actualEnergyCeded,0);
 }
 const markup=renderToString(React.createElement(ui.default));
 for(const label of ["Mindeleev","AUTOMI CELLULARI","La prossima generazione",
  "Sintesi +5","Anello stabile","Costellazione","Tabula rasa",
  "Richiama","Sposta","Recupera","Esamina","Avanza di una generazione",
  "Tavola periodica","CONWAYDNA","ENERGIA DISPONIBILE","Bonus energia",
  "Sopravvivenza · S23","Calcolo simultaneo","Ruber","Chrysos",
  "Sintesi prevista","11","127 celle",
  "Bilancio energetico locale","Energia attuale","Energia prossimo turno",
  "Energia ceduta","Restituita al budget",
  "Energia dai 3 vicini","Soglia richiesta","Energia dei vicini",
  "0 unità","non cedono energia","Se usi «Recupera» adesso"]){
  assert(markup.includes(label),"Missing accessible Life UI content: "+label);
 }
 assert(markup.includes("Energia attuale")&&markup.includes("Energia ceduta"),
  "Selected-cell inspector must reveal exact energy values");
 const uiSource=await readFile("src/experiments/MindeleevLifeLab.tsx","utf8");
 for(const feature of ["onPointerEnter","onPointerMove","onFocus",
  'role="tooltip"',"lifeEnergyLedger(game.board,plan,selectedKey,bonus)",
  "LifeEnergyPanel cell={hoverCell}"]){
  assert(uiSource.includes(feature),"Hover and keyboard energy tooltip missing "+feature);
 }
 assert.equal((markup.match(/role="button"/g)??[]).length,127,
  "All 127 hexagonal cells must be interactive and keyboard accessible");
 const app=await readFile("src/App.tsx","utf8");
 assert(app.includes('experiment") === "mindeleev-life"'));
 const periodic=await readFile("src/experiments/PolytronPeriodicLab.tsx","utf8");
 assert(periodic.includes('"?experiment=mindeleev-life"'),
  "The periodic table must link back to the new gameplay prototype");
 console.log("LIFE NUCLEUS",JSON.stringify({input:[...nucleus],births:p.born,
  departures:p.departed,refund:p.recovery}));
 console.log("PASS Sprint41: local energy ledger for 127 cells; actual transfers 0, summable refunds, visible neighbour contributions, candidate deficits, hover and selected inspector; Sprint40 rules unchanged");
}finally{await rm(temp,{recursive:true,force:true});}
