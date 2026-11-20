import type {RCPoint} from "@/polytron/rc01Board";

/** Only actual touch contacts get an offset. Mouse and stylus retain
 * direct pixel-accurate drag/drop semantics.
 */
export function rcTouchOffsetPx(cssHeight:number):number{
 if(!Number.isFinite(cssHeight)||cssHeight<=0)return 72;
 return Math.max(62,Math.min(88,cssHeight*.105));
}
export function rcDragAim(
 finger:RCPoint,pointerType:string,boardHeight:number,cssHeight:number
):RCPoint{
 if(pointerType!=="touch")return {...finger};
 return {x:finger.x,
  y:finger.y-rcTouchOffsetPx(cssHeight)*boardHeight/cssHeight};
}
export function rcIsTouch(pointerType:string):boolean{
 return pointerType==="touch";
}
