/**
 * Mindeleev formal sketch, Session 12.
 * Run: node research/conway_energy_model.mjs
 * This is NOT the game engine. It proves a restricted consistent representation
 * and verifies budget conservation in accumulator / converter / hybrid trials.
 */
import assert from "node:assert/strict";

const EPS=1e-10;
const almost=(x,y)=>Math.abs(x-y)<EPS;
const I=[[1,0,0],[0,1,0],[0,0,1]];
const D=[[0,1,0],[1,0,0],[0,0,1]];
const A=[[1/2,1/2,0],[1/4,1/4,1],[1/4,1/4,0]];
const mm=(X,Y)=>X.map(row=>Y[0].map((_,j)=>row.reduce((sum,x,k)=>sum+x*Y[k][j],0)));
const mv=(X,v)=>X.map(row=>row.reduce((sum,x,k)=>sum+x*v[k],0));
const approxMat=(X,Y)=>X.every((row,i)=>row.every((value,j)=>almost(value,Y[i][j])));
const total=v=>v.reduce((x,y)=>x+y,0);

assert(approxMat(mm(D,D),I),"dual squared must be identity");
assert(approxMat(mm(A,D),A),"ambo after dual must match ambo");
assert(!approxMat(mm(D,A),mm(A,D)),"operations should not all commute");
assert(!approxMat(mm(A,A),A),"expand = aa must be distinguishable from ambo");

for(const M of [D,A,mm(D,A),mm(A,D),mm(A,A),mm(D,mm(A,D))]){
  for(let c=0;c<3;c++)assert(almost(total(M.map(row=>row[c])),1),"columns must sum to 1");
  assert(M.flat().every(v=>v>=-EPS),"output fractions must be nonnegative");
  for(const input of [[1,0,0],[0,1,0],[0,0,1],[2,3,5]]){
    const out=mv(M,input);
    assert(almost(total(out),total(input)),"total channel energy must be conserved");
    assert(out.every(v=>v>=-EPS));
  }
}
const q=[1,0,0];
assert.deepEqual(mv(mm(D,A),q),[1/4,1/2,1/4]); // first a then d
assert.deepEqual(mv(mm(A,D),q),[1/2,1/4,1/4]); // first d then a
assert.deepEqual(mv(mm(A,A),q),[3/8,7/16,3/16]);

// Accounting model: wallet is the ONLY spendable game currency.
// 'reservoir' and 'potential' represent real inventories, not second wallets.
// 'dissipation' records spent energy instead of secretly destroying it.
const initial=(wallet=10,reservoir=0,potential=0)=>({wallet,reservoir,potential,dissipation:0});
const energyOf=s=>s.wallet+s.reservoir+s.potential+s.dissipation;
function pulse(state,{inject,drawReservoir=0,discharge=0,collect}){
  assert([inject,drawReservoir,discharge,collect].every(x=>Number.isFinite(x)&&x>=0));
  assert(inject<=3,"injection ceiling per turn");
  assert(inject<=state.wallet);
  assert(drawReservoir<=state.reservoir);
  assert(discharge<=state.potential);
  const supply=inject+drawReservoir+discharge;
  assert(collect<=supply,"output cannot exceed injection + depleted inventories");
  const next={
    wallet:state.wallet-inject+collect,
    reservoir:state.reservoir-drawReservoir,
    potential:state.potential-discharge,
    dissipation:state.dissipation+(supply-collect)
  };
  assert(almost(energyOf(state),energyOf(next)));
  return next;
}
const accumulator=pulse(initial(10,0,4),{inject:3,discharge:4,collect:6});
assert.deepEqual(accumulator,{wallet:13,reservoir:0,potential:0,dissipation:1});
const converter=pulse(initial(10,6,0),{inject:3,drawReservoir:6,collect:6});
assert.deepEqual(converter,{wallet:13,reservoir:0,potential:0,dissipation:3});
const hybrid=pulse(initial(10,6,4),{inject:3,drawReservoir:6,discharge:4,collect:10});
assert.deepEqual(hybrid,{wallet:17,reservoir:0,potential:0,dissipation:3});
const depleted=pulse(hybrid,{inject:3,collect:2});
assert.equal(depleted.wallet,16,"no indefinite profits when inventories are depleted");

console.log(JSON.stringify({
  status:"PASS",tests:["dual-dual","ambo-dual","noncommutative","expand-distinct",
    "channel-conservation","accumulator-ledger","converter-ledger","hybrid-ledger","depletion"],
  examples:{
    q,
    dualAfterAmbo:mv(mm(D,A),q),
    amboAfterDual:mv(mm(A,D),q),
    amboTwice:mv(mm(A,A),q),
    accumulator,converter,hybrid,afterDepletion:depleted
  }
},null,2));
