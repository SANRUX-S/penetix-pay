'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X, Info, ArrowRight, PackageOpen } from 'lucide-react';
import { money } from '@/domain';
export function Logo({compact=false}:{compact?:boolean}) { return <span className="brand"><span className="monogram">PX<span/></span>{!compact&&<span>PENETIX <b>Pay</b></span>}</span>; }
export function Button({variant='primary',className='',...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'ghost'|'destructive'}) { return <button className={`btn btn-${variant} ${className}`} {...props}/>; }
export function Card({children,className=''}:{children:React.ReactNode,className?:string}) { return <section className={`panel ${className}`}>{children}</section>; }
export function SampleBadge({hypothetical=false}:{hypothetical?:boolean}) { return <span className="sample-badge">{hypothetical?'Hypothetical':'Sample'}</span>; }
export function Money({minor,value,locale='en',className=''}:{minor?:number,value?:number,locale?:string,className?:string}) { return <span className={`money ${className}`}>{money(minor??value??0,locale)}</span>; }
export function DemoFigure({minor,children,hypothetical=false}:{minor?:number,children?:React.ReactNode,hypothetical?:boolean}) { return <span className="demo-figure">{minor!==undefined?<Money minor={minor}/>:children}<SampleBadge hypothetical={hypothetical}/></span>; }
export function DateText({date}:{date:string}) { return <time dateTime={date}>{new Intl.DateTimeFormat('en-LK',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Colombo'}).format(new Date(date.includes('T')?date:date+'T06:00:00Z'))}</time>; }
export function SimulatedBanner({children}:{children?:React.ReactNode}) { return <div className="banner" role="status"><Info size={18}/><span>{children??'SIMULATED DECISION — not made by any bank.'}</span></div>; }
export function EmptyState({title='Nothing here yet',description,children}:{title?:string,description?:string,children?:React.ReactNode}) { return <div className="empty-state"><PackageOpen size={32}/><h2>{title}</h2><p>{description}</p>{children}</div>; }
export function Dialog({open,onClose,title,children}:{open:boolean,onClose:()=>void,title:string,children:React.ReactNode}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=ref.current;if(open&&!d?.open)d?.showModal();if(!open&&d?.open)d.close();},[open]);
 return <dialog ref={ref} className="dialog" onCancel={onClose} onClose={onClose}><div className="dialog-heading"><h2>{title}</h2><button className="icon-button" onClick={()=>ref.current?.close()} aria-label="Close dialog"><X/></button></div>{children}</dialog>;
}
export function TransparencyDrawer({title='How is this calculated?',children,inputs,formula}:{title?:string,children?:React.ReactNode,inputs?:React.ReactNode,formula?:string}) { const [open,setOpen]=useState(false);return <><button className="formula-button" onClick={()=>setOpen(true)}><Info size={15}/>{title}</button><Dialog open={open} onClose={()=>setOpen(false)} title={title}><div className="formula-content">{children}{inputs}{formula&&<code>{formula}</code>}<p className="muted">All values use the shared demo calculation engine. These terms are illustrative.</p></div></Dialog></>; }
export function ProductImage({id,view='front',className=''}:{id?:string,productId?:string,view?:string,className?:string}) { return <div className={`product-art ${className}`}><img src={`/products/${id??'phone'}-${view}.svg`} alt="" loading="lazy" width="240" height="200"/></div>; }
export function DataTable({headers,rows}:{headers:string[],rows:React.ReactNode[][]}) { return <div className="table-wrap"><table className="data-table"><thead><tr>{headers.map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>; }
export function SectionLink({children,href}:{children:React.ReactNode,href:string}) {return <a className="section-link" href={href}>{children}<ArrowRight size={16}/></a>;}

