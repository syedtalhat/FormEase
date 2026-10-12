# Official Source Documents Catalog for Demo Forms

This directory contains official regulatory policies, government manuals, and compliance guidelines used by `scripts/ingest-source-docs.ts` to index semantic knowledge into Supabase Postgres `pgvector` (`source_documents` table).

## Directory Structure

```text
data/source-documents/
├── scholarships-gov-in/
│   ├── meta.json                     # Form domain, page URL pattern, and official portal URL
│   ├── post_matric_guidelines.txt   # Ministry of Electronics & IT / Social Justice guidelines
│   └── income_certificate_rules.html # Revenue authority requirements for means testing
├── nationalbank-in/
│   ├── meta.json                     # Form domain, page URL pattern, and official portal URL
│   ├── rbi_kyc_master_directions.txt # RBI Master Direction Section 38 (Periodic KYC)
│   └── rekyc_faq.html               # Officially Valid Documents (OVD) & no-password mandate
└── README.md
```

## Running the Ingestion Pipeline

To chunk, embed with `text-embedding-004` (768 dimensions), and store documents in pgvector:

```bash
# Make sure GEMINI_API_KEY and SUPABASE_SERVICE_ROLE_KEY are set in .env.local or environment
npm run ingest:docs
```

Or specify a custom directory:
```bash
npx tsx scripts/ingest-source-docs.ts --dir data/source-documents
```

The script will:
1. Parse text and HTML content, stripping markup.
2. Split text into ~800 character chunks with 100 character overlaps.
3. Compute L2-normalized embeddings via Gemini using `taskType: 'RETRIEVAL_DOCUMENT'`.
4. Upsert records into `public.source_documents` linking to `forms.id`.
5. Update `forms.last_indexed_at` with the current timestamp.
