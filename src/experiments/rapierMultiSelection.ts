import {canPlaceStation,type StationCell} from "./rapierHexGrid";
import type {Axial} from "@/hex/hexGrid";

/** Normal click = replace; Cmd/Ctrl/Shift click = toggle membership. */
export function chooseAgents(current:readonly string[],id:string,additive:boolean):string[]{
 if(!id)return additive?[...current]:[];
 if(!additive)return [id];
 return current.includes(id)?current.filter(x=>x!==id):[...current,id];
}

/** Atomic group drag: preserve each selected transformer’s axial offset. */
export function translateStations(layout:readonly StationCell[],ids:readonly string[],
 anchorId:string,target:Axial):StationCell[]|null{
 const chosen=new Set(ids);
 const anchor=layout.find(p=>p.id===anchorId);
 if(!anchor||!chosen.has(anchorId))return null;
 const dq=target.q-anchor.q,dr=target.r-anchor.r;
 const proposed=layout.map(cell=>chosen.has(cell.id)?
  {...cell,q:cell.q+dq,r:cell.r+dr}:{...cell});
 return proposed.every((cell,i)=>canPlaceStation(proposed.filter((_,j)=>j!==i),cell))?
  proposed:null;
}

/** Used both by selected-delete and Clear Mutatron; preserve other plan fields. */
export function withoutStations(layout:readonly StationCell[],ids:readonly string[]):StationCell[]{
 const remove=new Set(ids);
 return layout.filter(cell=>!remove.has(cell.id)).map(cell=>({...cell}));
}
