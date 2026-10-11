import {readFile} from 'node:fs/promises';
const css=await readFile('app/globals.css','utf8');
function color(name:string){const value=css.match(new RegExp('--'+name+':(#[0-9a-fA-F]{3,6})'))?.[1];if(!value)throw new Error('Missing '+name);const hex=value.length===4?value.slice(1).split('').map(c=>c+c).join(''):value.slice(1);return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
function luminance(v:number[]){const rgb=v.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
const pairs:[string,string,number][]=[['ink','bg',4.5],['ink','surface',4.5],['muted-strong','bg',4.5],['muted-strong','surface',4.5],['accent-strong','bg',4.5],['accent-strong','accent-tint',4.5],['bg','accent-strong',4.5],['warning','warning-tint',4.5],['danger','danger-tint',4.5],['info-neutral','info-tint',4.5],['boundary','bg',3],['boundary','surface',3]];
for(const [fg,bg,min]of pairs){const a=luminance(color(fg)),b=luminance(color(bg)),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<min)throw new Error(fg+'/'+bg+' fails: '+ratio.toFixed(2));console.log(fg+'/'+bg+': '+ratio.toFixed(2)+':1');}
console.log('All declared body-text and interactive-boundary pairs pass.');
