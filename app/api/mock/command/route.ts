import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {commandRequestSchema,errorResponseSchema,roleSchema} from '@/services/types';
import {applyMutation} from '@/services/mock/mutations';
export async function POST(request:Request){
  const role=roleSchema.safeParse((await cookies()).get('demo_role')?.value);
  if(!role.success)return NextResponse.json(errorResponseSchema.parse({error:'Choose a demo role before continuing.'}),{status:401});
  const parsed=commandRequestSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json(errorResponseSchema.parse({error:'The sample request did not match the expected format.'}),{status:400});
  await new Promise(resolve=>setTimeout(resolve,parsed.data.latency));
  if(parsed.data.simulateError)return NextResponse.json(errorResponseSchema.parse({error:'Simulated network error. Disable the presenter error toggle and retry.'}),{status:503});
  try{return NextResponse.json(applyMutation(parsed.data.state,parsed.data.mutation,role.data));}
  catch(reason){return NextResponse.json(errorResponseSchema.parse({error:reason instanceof Error?reason.message:'The sample action could not be completed.'}),{status:403});}
}
