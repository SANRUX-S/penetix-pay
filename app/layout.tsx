import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/noto-sans-sinhala/400.css';
import '@fontsource/noto-sans-tamil/400.css';
import './globals.css';
import { DemoProvider } from '@/services/demo';
export const metadata: Metadata = {title:'PENETIX Pay · Concept App',description:'An interactive, fictional demonstration of proposed bank-funded installment payments. No real money moves.',icons:{icon:'/icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body><DemoProvider>{children}</DemoProvider></body></html>;}

