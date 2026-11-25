/**
 * Responsive, cancel-by-replacement difficulty analysis.
 * Never blocks mouse/touch placement previews on the main thread.
 */
import {analyzeResonanceDifficulty} from "@/polytron/resonanceDifficulty";
import type {KaleidoLayout} from "@/polytron/kaleidoscopeGenerator";
import type {ResonancePawn,ResonanceSettings} from "@/polytron/resonanceField";
type Request={
 id:number;layout:KaleidoLayout;budget:number;
 settings:ResonanceSettings;pawns:ResonancePawn[]
};
type Response={
 id:number;result?:ReturnType<typeof analyzeResonanceDifficulty>;
 error?:string
};
const scope=self as unknown as {
 onmessage:((event:MessageEvent<Request>)=>void)|null;
 postMessage:(message:Response)=>void
};
scope.onmessage=event=>{
 const {id,layout,budget,settings,pawns}=event.data;
 try{
  const result=analyzeResonanceDifficulty(layout,budget,settings,pawns);
  scope.postMessage({id,result});
 }catch(error){
  scope.postMessage({id,error:String(error)});
 }
};
