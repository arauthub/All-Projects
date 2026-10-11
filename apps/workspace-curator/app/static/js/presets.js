/**
 * Presets for Google Workspace Webhook Simulator
 */
const WORKSPACE_PRESETS = [
  {
    id: "docs-roadmap",
    product: "docs",
    name: "Google Docs: Q3 Product Roadmap & Multi-Region Launch",
    sender: "elena.rostova@enterprise.tech",
    url: "https://docs.google.com/document/d/1xK9_mQ_Q3_Strategic_Roadmap_2026/edit",
    content: `Q3 Strategic Product Roadmap: Enterprise Edge & Multi-Region Expansion

Executive Sponsor: Elena Rostova (VP Product)
Target Launch: October 24, 2026
Budget Allocated: $1.45M USD
Projected Revenue Impact: 34% increase in EMEA ARR ($4.2M target).

Key Objectives & Deliverables:
1. Complete GDPR and SOC2 compliance audits for Frankfurt and Dublin cloud regions.
2. Deploy zero-latency distributed caching across AWS and Google Cloud Run.
3. Onboard first 50 beta enterprise customers by September 30.

Critical Action Items & Ownership:
- [ ] TODO: @Marcus to finalize multi-region Terraform infrastructure and failover testing by Friday.
- [ ] Action Item: @Priya to coordinate legal review of updated data transfer addendum before Oct 15.
- [ ] @David to review load-testing benchmarks (target: sub-25ms p99 latency) by next Tuesday.
- [ ] Please ensure SOC2 Type II audit readiness documentation is signed off by EOD Thursday.

Risk & Mitigation:
Potential bottleneck in cross-datacenter database synchronization under high transaction volumes. Failover testing scheduled for next sprint.`
  },
  {
    id: "sheets-budget",
    product: "sheets",
    name: "Google Sheets: FY26 Engineering Headcount & Cloud Budget",
    sender: "finance-ops@enterprise.tech",
    url: "https://docs.google.com/spreadsheets/d/1_fy26_eng_budget_financial_model/edit",
    content: `FY26 Engineering Operating Model & Headcount Allocation (Financial Review)

Department: Cloud Infrastructure & Platform Engineering
Review Cycle: Q3 Mid-Year Reconciliation
Approved Annual Run-Rate: $8,750,000 USD
Variance from Target: -4.2% (under budget by $365,000 USD).

Summary of Allocations:
- Core Platform & AI Research: $3.2M (18 Headcount approved)
- Data Lake & Vector Storage: $1.9M (Cloud hosting + GPU clusters)
- Security, Compliance & SOC2: $850k
- Reserve & Contingency Pool: $600k

Mandatory Action Items:
- [ ] Action Item: @Finance to freeze external agency contractor requisitions by Friday.
- [ ] @Sarah to submit finalized GPU reserved instance commitment proposal to AWS by tomorrow.
- [ ] Need to reconcile European subsidiary payroll allocations before month-end closing.`
  },
  {
    id: "gmail-escalation",
    product: "gmail",
    name: "Gmail: 🚨 P0 Urgent Escalation - EMEA API Gateway Latency",
    sender: "support-escalations@enterprise.tech",
    url: "https://mail.google.com/mail/u/0/#inbox/FMfcgzGvbgXmN...",
    content: `Subject: 🚨 SEV-1 CRITICAL ESCALATION: EMEA API Gateway Latency Spike & Customer SLA Breach Risk

From: Support Operations Lead <support-escalations@enterprise.tech>
To: Infrastructure On-Call, Executive Staff
Urgency: P0 / Immediate Action Required

Team,
We are currently experiencing a severe 350% latency degradation across our Frankfurt API Gateway endpoints. 
Average response time has spiked from 42ms to 2,450ms, causing timeouts for over 14,000 active customer sessions.

Impacted Customers:
- FinTech Global Partners (SLA breach threshold in 35 minutes)
- Apex Logistics Group
- Nordics Payment Gateway (452 failed webhook dispatches logged)

Immediate Actions Required:
- [ ] Critical: @OnCall to initiate failover traffic reroute to Amsterdam cluster immediately!
- [ ] P0 TODO: @Vikram to isolate connection pool exhaustion in database replica by 18:30 UTC.
- [ ] @Elena to post executive status update on customer trust portal within 15 minutes.`
  },
  {
    id: "forms-survey",
    product: "forms",
    name: "Google Forms: Customer Feedback & Feature Request Survey #402",
    sender: "survey-bot@google-forms.internal",
    url: "https://forms.google.com/d/e/1FAIpQLSc-customer-nps-survey-2026/viewform",
    content: `Google Form Submission: Enterprise Product Experience & NPS Survey
Respondent: cto@finscale-solutions.io
Submission Timestamp: Today at 14:22 UTC

Responses:
• Overall Satisfaction Score: 9 / 10
• Which feature provided the highest ROI?: Real-time Webhook Streaming and Automated AI Content Curation
• What is your biggest operational bottleneck?: Lack of unified dashboard to inspect raw payload diffs across teams
• Would you recommend WorkspaceCurator to your industry peers?: Absolutely yes, saved us 12 hours weekly per analyst.
• Additional Comments: We love the instant Markdown and Slack exports. Please add custom webhook forwarder filtering by urgency level.

Follow-up Needed:
- [ ] Action Item: @CustomerSuccess to schedule VIP feedback interview with CTO by next Wednesday.`
  },
  {
    id: "calendar-board",
    product: "calendar",
    name: "Google Calendar: Executive Board Strategy Review & Q4 OKRs",
    sender: "executive-assistant@enterprise.tech",
    url: "https://calendar.google.com/calendar/event?eid=YWJjMTIz...",
    content: `Event: Q4 Strategic Executive Board Session & 2027 Long-Range Plan
Time: Thursday, October 15, 2026 at 09:00 AM - 12:30 PM PST
Organizer: executive-assistant@enterprise.tech
Attendees: CEO, CTO, VP Engineering, CFO, General Counsel, Lead Investors
Google Meet Link: https://meet.google.com/abc-curator-conf

Session Agenda:
1. Review of Q3 financial performance ($14.2M ARR achieved vs $13.5M plan).
2. Deep dive into enterprise AI agent adoption and automated workspace ingestion.
3. Authorization of European data sovereignty compliance initiative ($500k budget).
4. Review of corporate governance, employee equity pool refresh, and patents.

Pre-Meeting Action Items:
- [ ] TODO: @CFO to distribute finalized board slide deck and audit report by Tuesday EOD.
- [ ] @Legal to prepare sign-off resolutions for corporate restructuring before Wednesday.`
  },
  {
    id: "drive-contract",
    product: "drive",
    name: "Google Drive: New Master Services Agreement (MSA) - Apex Corp",
    sender: "contracts-sync@drive.google.com",
    url: "https://drive.google.com/file/d/1_Apex_Enterprises_MSA_Executed_v2/view",
    content: `Google Drive File Event: New Document Uploaded to 'Legal & Executed Contracts'
File Name: Apex_Enterprises_Global_MSA_Executed_2026.pdf
Owner: General Counsel (legal@enterprise.tech)
File Size: 4.2 MB
Resource State: ADD

Contract Summary & Abstract:
- Counterparty: Apex Global Logistics Holdings Ltd.
- Total Contract Value (TCV): $3,800,000 USD over 3-year term.
- Annual Recurring Revenue: $1,266,666 USD.
- Payment Terms: Net 30 with 99.95% uptime SLA commitment.
- Special Terms: Strict GDPR and data residency guarantees in EU-Central.

Obligations & Action Items:
- [ ] Action Item: @Billing to issue initial Year 1 onboarding invoice within 5 business days.
- [ ] @Security to deliver completed vendor security questionnaire to Apex procurement by Oct 20.
- [ ] Please archive executed counter-signature copies in the compliant cold-storage vault.`
  }
];
