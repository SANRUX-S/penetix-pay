import {BankScreen} from '@/components/bank/screens';export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;return <BankScreen section={slug[0]}/>;}
