import {useEffect,useRef,useState} from "react";
import type {RCManifestation,RCPawn} from "@/polytron/rc01Game";
import {gradientPair,gradientCss} from "@/polytron/gradientPalettes";
import RC01ThreeInspector from "@/experiments/RC01ThreeInspector";

/** Mount a genuine Three.js thumbnail only while its row intersects the
 * scrollable inspector. This avoids exhausting mobile WebGL contexts when
 * the Mneme history grows long.
 */
function ManifestationThumbnail({pawn,manifestation}:{
 pawn:RCPawn;manifestation:RCManifestation
}){
 const host=useRef<HTMLSpanElement>(null);
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  const node=host.current;if(!node)return;
  if(typeof IntersectionObserver==="undefined"){
   setVisible(true);return;
  }
  const observer=new IntersectionObserver(entries=>{
   setVisible(entries.some(entry=>entry.isIntersecting));
  },{threshold:.01});
  observer.observe(node);
  return ()=>observer.disconnect();
 },[]);
 return <span className="rc01-manifestation-thumbnail" ref={host}>
  {visible&&<RC01ThreeInspector pawn={{...pawn,...manifestation}}/>}
 </span>;
}

export default function RC01ManifestationHistory({pawn,selectedIndex,onSelect}:{
 pawn:RCPawn;selectedIndex:number|null;
 onSelect:(index:number|null)=>void
}){
 const mostRecent=pawn.manifestations.length-1;
 const entries=pawn.manifestations.map((manifestation,index)=>({
  manifestation,index
 })).slice().reverse();
 return <section className="rc01-manifestations" aria-label="Manifestation history">
  <div className="rc01-manifestations-head">
   <h3>Manifestations</h3>
   <span className="rc01-manifestations-count"
    aria-label={pawn.manifestations.length+" manifestations"}>
    {pawn.manifestations.length}
   </span>
  </div>
  <div className="rc01-manifestations-list" role="list"
   aria-label="Most recent manifestation first">
   {entries.map(({manifestation,index})=>{
    const palette=gradientPair(manifestation.row,manifestation.col);
    const active=selectedIndex===index||
     (selectedIndex===null&&index===mostRecent);
    return <div className="rc01-manifestation-entry" role="listitem" key={index}>
     <button type="button" className="rc01-manifestation-button"
      aria-pressed={active}
      aria-label={"Inspect manifestation "+manifestation.number+
       " with palette "+palette.name}
      onClick={()=>onSelect(index===mostRecent?null:index)}>
      <ManifestationThumbnail pawn={pawn} manifestation={manifestation}/>
      <span className="rc01-manifestation-number">{manifestation.number}</span>
      <span className="rc01-manifestation-meta">
       <span>{index===mostRecent?"Present":"Past"}</span>
       <span className="rc01-manifestation-swatch" role="img"
        aria-label={palette.name}
        style={{background:gradientCss(
         palette.primary.hex,palette.secondary.hex)}}/>
      </span>
     </button>
    </div>;
   })}
  </div>
 </section>;
}
