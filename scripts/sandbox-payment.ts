import {simulateTenRupeePayment} from '../src/platform/payments/sandbox';
const result=simulateTenRupeePayment();
if(result.intent.amountMinor!==1000||result.intent.status!=='settled'||result.moneyMoved!==false)throw new Error('Sandbox invariant failed');
console.log('PENETIX Pay — Rs. 10.00 test result');
console.log('Status: SANDBOX SETTLED (FICTIONAL)');
console.log('Transitions: '+result.history.map(e=>e.after).join(' → '));
console.log('Real money moved: NO');
console.log('Next: bank/PSP test credentials and approved sandbox access are required for a real external integration test.');
