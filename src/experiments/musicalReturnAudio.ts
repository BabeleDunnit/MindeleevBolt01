import type {Event} from "./musicalReturnEngine";
import {shapeResponse} from "./musicalReturnEngine";

/**
 * Original algorithmic tones — not prerecorded music or a borrowed composition.
 * Event stream is the single source of truth for visuals, ENERGY and sound.
 * The rendering clock cannot change simulation outcomes.
 */
export function soundEvents(ctx:AudioContext,events:readonly Event[],musical:boolean){
 const base=ctx.currentTime+.012;
 for(let i=0;i<events.length;i++){
  const e=events[i];
  if(e.kind==="travel")continue;
  const when=base+i*.035;
  let pitch=220,duration=.18,volume=.025,type:OscillatorType="sine";
  switch(e.kind){
   case "emit":pitch=110;duration=.29;volume=.042;type="triangle";break;
   case "encounter":{
    const shape=shapeResponse(e.before??"T");
    const degree=(shape.sides*2+shape.faces)%12;
    pitch=220*Math.pow(2,degree/12);duration=.21;volume=.025;type="sine";
    break;
   }
   case "mutate":pitch=440;duration=.32;volume=.022;type="triangle";break;
   case "return":pitch=330;duration=.48;volume=.038;type="sine";break;
   case "escape":pitch=92.5;duration=.24;volume=.03;type="sawtooth";break;
  }
  if(!musical&&e.kind==="mutate")pitch=260;
  const voices=musical&&e.kind==="return"?[1,1.25,1.5]:musical&&e.kind==="mutate"?[1,1.5]:[1];
  voices.forEach((ratio,j)=>{
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type=type;osc.frequency.setValueAtTime(pitch*ratio,when);
   gain.gain.setValueAtTime(.0001,when);
   gain.gain.exponentialRampToValueAtTime(volume/(voices.length*1.3),when+.016);
   gain.gain.exponentialRampToValueAtTime(.0001,when+duration+j*.03);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.start(when);osc.stop(when+duration+j*.03+.025);
  });
 }
}
