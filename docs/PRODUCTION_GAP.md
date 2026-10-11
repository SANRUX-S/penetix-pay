# Before a live launch

PENETIX Pay is a concept application. This implementation does not move money, provide lending capital, verify identities, or connect to a bank. All customer profiles, merchants, applications, transactions, financial assumptions, and portfolio results are fictional demonstration data.

Every item below requires evidence and confirmation from qualified legal and banking advisers. This document does not establish which rules apply or provide legal conclusions.

| Area | Current position | Evidence required before a live pilot |
| --- | --- | --- |
| Partner-bank agreement | Not started | An executed agreement assigning funding, underwriting, credit-risk ownership, collection, and customer communication responsibilities |
| Merchant commitments | Not started | Written participation, settlement, pricing, return, and dispute terms |
| Licensing and consumer-credit review | Not started | Written advice on the proposed operating model and all applicable permissions and disclosures |
| Data-protection review | Not started | Confirmed applicable law, lawful processing basis, retention periods, access rights, cross-border handling, and bank/provider contracts |
| Identity verification | Not built | Bank-owned customer verification design and a contracted provider arrangement where required |
| Payment collection | Not built | A vetted collection provider, bank-controlled mandates, failure handling, and independently tested payment boundaries |
| Credit decisions | Simulated | Bank-owned underwriting policy, validation, explainability, governance, and accountable override controls |
| Regulatory cost disclosure | Not started | Confirmation of the appropriate annual cost definition and all required disclosure formats; demo effective annual cost must not be reused without review |
| Security review | Not started | Independent penetration testing, remediation evidence, threat modelling, dependency governance, and access-control verification |
| Reconciliation | Simulated | Bank and merchant ledgers, matching rules, exceptions, daily sign-off, and accountable operations owners |
| Settlement and refunds | Simulated | Contracted timing, itemised fees, refundable-fee rules, clawback handling, and reconciliation against actual funds |
| Customer support and disputes | Simulated | Owned channels, service standards, escalation, evidence handling, and complaint procedures |
| Incident response | Planned | On-call ownership, tested response plans, notification duties, restoration exercises, and bank coordination |
| Pilot limits | Planned | Written exposure caps, merchant whitelist, staged rollout, monitoring thresholds, and an exercised kill switch |
| Performance and accessibility | Local verification only | Representative-device results, assistive-technology review, and operational monitoring |
| Business hypotheses | Unmeasured | Real measurements of activation, conversion, incremental sales, launch effort, acquisition cost, and contribution after costs |

The proposed role split is that a licensed partner bank would fund purchases and control lending risk; merchants would receive contracted settlement; PENETIX would provide technology and potential merchant-acquisition services. No agreement, live user base, actual risk estimate, or commercial term is demonstrated by this prototype.

The demo permission cookie and sample-profile selector are demonstration controls. Session snapshots are held in browser memory and optional session storage; they are not an identity or production-authorisation system. A live service needs server-enforced authentication, authorisation, tamper-resistant audit records, minimised data collection, and independent testing.
