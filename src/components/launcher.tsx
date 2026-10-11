'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,ShieldCheck} from 'lucide-react';
import {useDemo} from '@/services/demo';

export function Launcher(){
  const {ready,switchRole}=useDemo();
  const router=useRouter();
  const started=useRef(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const enter=useCallback(async()=>{
    if(started.current)return;
    started.current=true;
    setLoading(true);
    setError('');
    try{
      await switchRole('customer');
      router.replace('/customer/home');
      router.refresh();
    }catch{
      started.current=false;
      setLoading(false);
      setError('The sample workspace could not open. Check your connection and try again.');
    }
  },[switchRole,router]);
  useEffect(()=>{
    if(!ready)return;
    const timer=window.setTimeout(()=>{void enter();},1450);
    return()=>window.clearTimeout(timer);
  },[ready,enter]);
  return <main className="px-splash" aria-label="Opening PENETIX Pay concept app">
    <div className="px-splash-aura" aria-hidden="true"/>
    <div className="px-splash-center">
      <div className="px-splash-logo" aria-hidden="true"><span>PX</span><i/></div>
      <div className="px-splash-brand">PENETIX <span>Pay</span></div>
      <p>A smarter way to pay.</p>
      <div className="px-splash-track" role="progressbar" aria-label="Opening demo application"><span/></div>
      <span className="px-splash-status" role="status">{error?'Unable to open':loading?'Opening your experience':'Preparing your experience'}</span>
      {error&&<><p className="px-splash-error">{error}</p><button className="px-splash-skip" onClick={()=>void enter()}>Try again <ArrowRight size={16}/></button></>}
      {!error&&<button className="px-splash-skip" onClick={()=>void enter()}>Enter app now <ArrowRight size={16}/></button>}
    </div>
    <div className="px-splash-foot"><ShieldCheck size={15}/> Concept preview · No real banking or money movement</div>
  </main>;
}
