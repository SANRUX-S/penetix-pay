import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const banned=['bank-grade security','guaranteed savings','best price',"world's first",'approved by','certified','PCI compliant','ISO','regulated by','trusted by','instant approval'];
const brands=['Apple','Samsung','Visa','Mastercard','PayPal','Dialog Finance','Commercial Bank','Sampath Bank','Singer','Abans','Softlogic','HNB','BOC','Peoples Bank'];
const errors:string[]=[];
async function scan(dir:string){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){await scan(file);continue;}if(!/\.(tsx?|json|md)$/.test(file))continue;let text=await readFile(file,'utf8');text=text.replaceAll('Proposed design — not implemented or certified.','').replaceAll('Proposed design — not implemented or certified','');for(const phrase of [...banned,...brands]){const escaped=phrase.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');if(new RegExp('\\b'+escaped+'\\b','i').test(text))errors.push(file+': prohibited claim or brand: '+phrase);}}}
for(const dir of ['src','app','docs']){try{await scan(dir);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log('Truth lint passed: app, src and docs; fictional brands and prescribed disclaimers checked.');
