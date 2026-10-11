import {NextResponse} from 'next/server';
import {z} from 'zod';
import {initialSnapshot} from '@/data/fixtures';
import {merchantSchema,offerSchema,productSchema} from '@/services/types';
const output=z.object({products:z.array(productSchema),merchants:z.array(merchantSchema),offers:z.array(offerSchema),simulated:z.literal(true)}).strict();
export async function GET(){const state=initialSnapshot();return NextResponse.json(output.parse({products:state.products,merchants:state.merchants,offers:state.offers,simulated:true}));}
