/**
 * Dedicated worker for incremental Conway enumeration and geometric matching.
 * Rendering never blocks on Polyhedronisme generation or O(V²) comparisons.
 */
import {PeriodicCatalog,MAX_CATALOG_ROWS} from "@/polytron/periodicCatalog";
const catalog=new PeriodicCatalog();
let targetRows=0,scheduled=false;
type Request={kind:"target";rows:number};
type Response={kind:"rows";entries:ReturnType<PeriodicCatalog["appendRow"]>;
 generatedRows:number;unresolvedCount:number}|{kind:"error";error:string};
const scope=self as unknown as {
 onmessage:((event:MessageEvent<Request>)=>void)|null;
 postMessage:(message:Response)=>void
};
const pump=()=>{
 scheduled=false;
 if(catalog.lengthRows>=targetRows)return;
 try{
  const entries=catalog.appendRow();
  scope.postMessage({kind:"rows",entries,generatedRows:catalog.lengthRows,
   unresolvedCount:catalog.unresolvedCount});
 }catch(err){
  scope.postMessage({kind:"error",error:String(err)});
  return;
 }
 if(catalog.lengthRows<targetRows)queue();
};
function queue(){
 if(scheduled)return;
 scheduled=true;setTimeout(pump,0);
}
scope.onmessage=event=>{
 if(event.data.kind!=="target")return;
 targetRows=Math.min(MAX_CATALOG_ROWS,Math.max(0,Math.floor(event.data.rows)));
 queue();
};
