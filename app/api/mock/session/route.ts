import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {errorResponseSchema,roleSchema} from '@/services/types';
const input=z.object({role:roleSchema}).strict();
const output=z.object({role:roleSchema,simulated:z.literal(true)}).strict();
export async function POST(request:Request){
  const parsed=input.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json(errorResponseSchema.parse({error:'Choose a valid demo role.'}),{status:400});
  const jar=await cookies();
  jar.set('demo_role',parsed.data.role,{httpOnly:true,sameSite:'strict',secure:request.url.startsWith('https:'),path:'/',maxAge:60*60*12});
  return NextResponse.json(output.parse({...parsed.data,simulated:true}));
}
