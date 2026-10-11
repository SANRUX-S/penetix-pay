'use client';
import en from './messages/en.json';
import si from './messages/si.json';
import ta from './messages/ta.json';
import {useDemo} from '@/services/demo';
export type MessageKey=keyof typeof en;
type Values=Record<string,string|number>;
const expanded:Record<string,string>={'a':'á','e':'ë','i':'ï','o':'ô','u':'ü','A':'Á','E':'Ë','I':'Ï','O':'Ô','U':'Ü'};
export function pseudoLocalize(value:string){return `［${value.replace(/[aeiouAEIOU]/g,char=>expanded[char])} ···］`;}
function formatICU(message:string,values:Values,locale:string){
  const plurals=message.replace(/\{(\w+),\s*plural,\s*one\s*\{([^{}]*)\}\s*other\s*\{([^{}]*)\}\}/g,(_match,key:string,one:string,other:string)=>{
    const count=Number(values[key]??0);const choice=new Intl.PluralRules(locale).select(count)==='one'?one:other;
    return choice.replaceAll('#',new Intl.NumberFormat(`${locale}-LK`,{numberingSystem:'latn'}).format(count));
  });
  return plurals.replace(/\{(\w+)\}/g,(_match,key:string)=>String(values[key]??`{${key}}`));
}
export function translate(locale:'en'|'si'|'ta'|'pseudo',key:MessageKey,values:Values={}){
  const dictionary:Partial<Record<MessageKey,string>>=locale==='si'?si:locale==='ta'?ta:en;
  const message=dictionary[key]??en[key];const formatted=formatICU(message,values,locale==='si'?'si':locale==='ta'?'ta':'en');
  return locale==='pseudo'?pseudoLocalize(formatted):formatted;
}
export function useMessages(){const {state}=useDemo();return (key:MessageKey,values?:Values)=>translate(state.locale,key,values);}
