/**
 * Sprint 35 · Periodic Polytron numbering.
 *
 * Identical, stable alphabet order to the original hex catalog, but NO
 * palette dimension: 5 consecutive polytronic numbers per Conway word.
 * Empty word at row 0, followed by every word of length 1, then 2, ...
 *
 * bigint is intentional: the Conway language is unbounded. JavaScript
 * Number arithmetic would silently make long DNA non-reversible.
 */
import {OPERATORS,SEEDS} from "@/polytron/mapping";

export const PERIODIC_OPERATORS=OPERATORS;
export const PERIODIC_SEEDS=SEEDS;
const RADIX=BigInt(OPERATORS.length);
const WIDTH=BigInt(SEEDS.length);
export type BaseSeed=(typeof SEEDS)[number];

export function opsToRowIndex(ops:string):bigint{
 if(!/^[a-z]*$/.test(ops))throw new Error("ConwayDNA: operatori non validi");
 let offset=0n;
 for(let depth=0;depth<ops.length;depth++)offset+=RADIX**BigInt(depth);
 let rank=0n;
 for(const op of ops){
  const digit=OPERATORS.indexOf(op as (typeof OPERATORS)[number]);
  if(digit<0)throw new Error("Operatore Conway non supportato: "+op);
  rank=rank*RADIX+BigInt(digit);
 }
 return offset+rank;
}
export function rowIndexToOps(index:bigint|number):string{
 let rest=typeof index==="bigint"?index:BigInt(index);
 if(rest<0n)throw new Error("Indice di riga negativo");
 let depth=0,block=1n;
 while(rest>=block){
  rest-=block;
  block*=BigInt(OPERATORS.length);
  depth++;
 }
 const output=new Array<string>(depth);
 for(let i=depth-1;i>=0;i--){
  output[i]=OPERATORS[Number(rest%RADIX)];
  rest/=RADIX;
 }
 return output.join("");
}
export function politronNumberFromDNA(dna:string):bigint{
 const match=dna.match(/^([a-z]*)([TCODI])$/);
 // Accept exactly the bare Conway alphabet + one Platonic seed.
 if(!match||dna.includes(" "))throw new Error("Richiesto ConwayDNA senza palette: "+dna);
 const index=SEEDS.indexOf(match[2] as BaseSeed);
 if(index<0)throw new Error("Poliedro base non valido: "+dna);
 return opsToRowIndex(match[1])*WIDTH+BigInt(index)+1n;
}
export function dnaFromPolitronNumber(number:bigint|number):string{
 const n=typeof number==="bigint"?number:BigInt(number);
 if(n<1n)throw new Error("Numero politronico deve essere positivo");
 const zero=n-1n;
 const row=zero/WIDTH,seed=SEEDS[Number(zero%WIDTH)];
 return rowIndexToOps(row)+seed;
}
export function periodicRow(index:bigint|number){
 const row=typeof index==="bigint"?index:BigInt(index);
 const ops=rowIndexToOps(row);
 return SEEDS.map((seed,i)=>({number:row*WIDTH+BigInt(i)+1n,
  row,ops,seed,dna:ops+seed}));
}
