/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SourceDocument } from '../types';

export const DEMO_SOURCE_DOCUMENTS: SourceDocument[] = [
  {
    id: 'doc-sch-01',
    formId: 'form-scholarship',
    title: 'Post-Matric Scholarship Scheme Official Guidelines (2025-26)',
    url: 'https://scholarships.gov.in/guidelines/post-matric-2026.pdf',
    category: 'Government Welfare Regulation',
    indexedAt: '2026-08-15T10:00:00Z',
    contentText: `
Section 4.1: Annual Family Income Eligibility.
The combined gross annual income of the applicant's parents or legal guardians from all revenue streams must not exceed INR 2,50,000 per financial annum. A competent authority revenue certificate (issued by Tahsildar or Sub-Divisional Magistrate) is required for verification.

Section 4.3: Domicile and Residence Status.
Candidates must hold a permanent domicile certificate of the home state issued on or after April 2021. Temporary migration or rental agreements are not permissible for state domicile quota.

Section 5.2: Bank Account and Direct Benefit Transfer (DBT).
The applicant must submit an active, single-operated savings bank account explicitly seeded with Aadhaar and National Automated Clearing House (NACH). Joint accounts or minor accounts without parental mandate will result in immediate disbursement failure.

Section 6.1: Discrepancy Declaration.
Applicants submitting forged or mismatched income declarations shall be liable to recovery under the Public Demands Recovery Act and permanent disqualification from all national welfare registers.
    `.trim(),
  },
  {
    id: 'doc-kyc-01',
    formId: 'form-bank-kyc',
    title: 'Reserve Bank Master Direction – Know Your Customer (KYC) Standards 2026',
    url: 'https://rbi.org.in/regulations/master-direction-kyc-2026.html',
    category: 'Financial Banking Regulation',
    indexedAt: '2026-07-20T09:00:00Z',
    contentText: `
Clause 12: Customer Identification and Re-KYC Interval.
Regulated entities must carry out periodic re-verification of customer identity at intervals of at least once every 2 years for high-risk customers, 8 years for medium-risk, and 10 years for low-risk customers.

Clause 17.4: Mother's Maiden Name as Security Question.
Mother's maiden name is categorized as a legacy shared-secret authenticator. Regulated entities are cautioned against using mother's maiden name for internet-facing public web forms without two-factor challenge due to social engineering vulnerabilities.

Clause 22: One-Time Password (OTP) Prohibition on Open Web Surveys.
Banks shall never solicit transaction confirmation OTPs or net-banking authorization credentials on generic profile update or informational web forms. OTPs are exclusively valid for authenticated session logins and customer-initiated debit transactions.
    `.trim(),
  },
  {
    id: 'doc-fellowship-01',
    formId: 'form-fellowship',
    title: 'National Merit Doctoral Fellowship Terms & Eligibility Manual',
    url: 'https://fellowship-council.res.in/rules/fellowship-manual-2026.pdf',
    category: 'Institutional Academic Council',
    indexedAt: '2026-06-10T14:30:00Z',
    contentText: `
Chapter 2: Academic Benchmarks and Metrics.
Applicants should cite cumulative scholarly publications indexed in Scopus or Web of Science. The h-index metric reflects citation consistency; applicants without an active h-index may substitute first-author preprint submissions under peer review.

Chapter 3: Institutional Endorsement and Research Infrastructure.
A formal endorsement certificate from the Head of Institution (Dean of Research or Vice Chancellor) confirming laboratory space and computational resources is an absolute prerequisite.

Chapter 5: Ethics & Conflict of Interest.
Any concurrent remuneration, stipend from private industry, or consultancy income exceeding INR 15,000 per month must be disclosed. Failure to disclose triggers stipend recovery.
    `.trim(),
  },
];
