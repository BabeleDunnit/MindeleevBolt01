/**
 * Planar Rapier transformer grid. Axial coordinates are the only source of
 * truth for fixed-station placement; travelers remain free in world XZ.
 * Two small hexes correspond to one ring-1 position in Sprint 32.
 */
import {axialToPixel,pixelToAxial,hexDistance,hexesUpToRing,
 ringIdxToAxial,hexCorners,type Axial} from "@/hex/hexGrid";

export type StationCell={id:string;q:number;r:number};
export const HEX_RADIUS=45*.84/22/2;
export const GRID_MAX_RING=5;
export const DEFAULT_STATION_LAYOUT:StationCell[]=Array.from({length:6},(_,i)=>({
 id:"P"+String(i+1).padStart(2,"0"),
 ...ringIdxToAxial({ring:2,idx:i*2})
}));

export const stationWorld=(cell:Pick<StationCell,"q"|"r">)=>{
 const point=axialToPixel(cell,HEX_RADIUS);
 return {x:point.x,z:point.y};
};
export const worldStationCell=(x:number,z:number):Axial=>
 pixelToAxial(x,z,HEX_RADIUS);
export const stationCellKey=(cell:Pick<StationCell,"q"|"r">)=>cell.q+","+cell.r;
export const isEditableCell=(cell:Axial):boolean=>
 Number.isInteger(cell.q)&&Number.isInteger(cell.r)&&
 hexDistance(cell)>0&&hexDistance(cell)<=GRID_MAX_RING;
export const canPlaceStation=(layout:StationCell[],cell:Axial,ignoreId?:string):boolean=>
 isEditableCell(cell)&&!layout.some(p=>p.id!==ignoreId&&p.q===cell.q&&p.r===cell.r);
export const nextStationId=(layout:StationCell[]):string=>{
 const highest=layout.reduce((max,p)=>Math.max(max,Number(p.id.replace(/^P/,""))||0),0);
 return "P"+String(highest+1).padStart(2,"0");
};
export const visibleHexGrid=()=>Array.from(hexesUpToRing(GRID_MAX_RING),item=>({
 ...item.axial,centre:stationWorld(item.axial),
 corners:hexCorners(stationWorld(item.axial).x,stationWorld(item.axial).z,HEX_RADIUS)
}));
