import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Scheme } from '../models/Scheme.js';
import { User } from '../models/User.js';

const schemes = [
  {
    code: 'GOTS',
    name: 'Global Organic Textile Standard',
    category: 'Textile',
    standardBody: 'Global Standard gGmbH',
    summary:
      'Processing standard for textiles made from certified organic fibres, covering ecological and social criteria across the whole supply chain.',
    description:
      'GOTS applies from harvesting of raw materials through environmentally and socially responsible manufacturing to labelling. A minimum of 70% certified organic fibres is required for the "made with organic" grade and 95% for the "organic" grade.',
    durationMonths: 12,
    feeUSD: 2400,
    requirements: [
      'Organic fibre input records for the last 12 months',
      'Wastewater treatment plant documentation',
      'Chemical inventory with MSDS for every input',
      'Social compliance policy and worker grievance procedure'
    ],
    accent: 'emerald'
  },
  {
    code: 'GRS',
    name: 'Global Recycled Standard',
    category: 'Traceability',
    standardBody: 'Textile Exchange',
    summary:
      'Verifies recycled content, chain of custody, social and environmental practices, and chemical restrictions for products with 20% or more recycled material.',
    description:
      'GRS tracks recycled input from the recycler through every processing stage. Transaction certificates are issued for each shipment, allowing the recycled claim to be verified independently at any point.',
    durationMonths: 12,
    feeUSD: 1900,
    requirements: [
      'Recycled input supplier declarations',
      'Mass-balance records per production run',
      'Chemical management plan',
      'Signed social criteria acknowledgement'
    ],
    accent: 'sky'
  },
  {
    code: 'OCS',
    name: 'Organic Content Standard',
    category: 'Traceability',
    standardBody: 'Textile Exchange',
    summary:
      'Chain-of-custody standard that verifies the presence and amount of organic material in a final product without covering processing criteria.',
    description:
      'OCS is lighter than GOTS: it confirms organic content and traceability but does not set requirements for chemical use or social compliance. It is often a first step for factories preparing for full GOTS certification.',
    durationMonths: 12,
    feeUSD: 1400,
    requirements: [
      'Organic raw material purchase invoices',
      'Production and inventory reconciliation',
      'Segregation procedure for certified goods'
    ],
    accent: 'lime'
  },
  {
    code: 'RCS',
    name: 'Recycled Claim Standard',
    category: 'Traceability',
    standardBody: 'Textile Exchange',
    summary:
      'Tracks recycled raw materials through the supply chain and verifies the recycled content claim on the finished product.',
    description:
      'RCS covers products with at least 5% recycled content. Unlike GRS it does not include social, environmental or chemical requirements, which keeps the audit scope narrow.',
    durationMonths: 12,
    feeUSD: 1200,
    requirements: [
      'Recycled material declarations from every supplier',
      'Transaction certificate log',
      'Documented separation of certified and non-certified stock'
    ],
    accent: 'cyan'
  },
  {
    code: 'ORG-EU',
    name: 'EU Organic Production (Reg. 2018/848)',
    category: 'Food & Agriculture',
    standardBody: 'European Commission',
    summary:
      'Mandatory certification for agricultural products marketed as organic within the European Union, covering farm, processing and import controls.',
    description:
      'Operators must complete a conversion period, keep full input and yield records, and undergo at least one annual inspection with additional risk-based unannounced visits.',
    durationMonths: 12,
    feeUSD: 1800,
    requirements: [
      'Field history for the last three seasons',
      'Input register (seeds, fertiliser, plant protection)',
      'Conversion period evidence',
      'Parallel production separation plan'
    ],
    accent: 'amber'
  },
  {
    code: 'ISO14001',
    name: 'ISO 14001 Environmental Management',
    category: 'Environmental',
    standardBody: 'International Organization for Standardization',
    summary:
      'Management system standard for identifying, monitoring and continually reducing an organisation’s environmental impact.',
    description:
      'Certification follows a two-stage audit: a documentation review followed by an on-site implementation audit, then annual surveillance and a three-yearly recertification.',
    durationMonths: 36,
    feeUSD: 3200,
    requirements: [
      'Environmental policy signed by top management',
      'Aspect and impact register',
      'Legal compliance obligations register',
      'Internal audit and management review records'
    ],
    accent: 'teal'
  },
  {
    code: 'SA8000',
    name: 'SA8000 Social Accountability',
    category: 'Social Compliance',
    standardBody: 'Social Accountability International',
    summary:
      'Auditable social certification covering child labour, forced labour, health and safety, working hours, remuneration and freedom of association.',
    description:
      'SA8000 requires a functioning social performance team, worker representation, and evidence that the management system detects and corrects non-conformities between audits.',
    durationMonths: 36,
    feeUSD: 4100,
    requirements: [
      'Payroll and working-hour records for 12 months',
      'Age verification procedure and personnel files',
      'Health and safety risk assessment',
      'Elected worker representative minutes'
    ],
    accent: 'rose'
  },
  {
    code: 'BSCI',
    name: 'amfori BSCI Social Audit',
    category: 'Social Compliance',
    standardBody: 'amfori',
    summary:
      'Supply-chain social audit programme assessing labour practices against thirteen performance areas and producing a graded A–E rating.',
    description:
      'The audit is announced or semi-announced and results in a rating that determines the re-audit cycle. Findings below a C rating require a corrective action plan with follow-up verification.',
    durationMonths: 24,
    feeUSD: 1600,
    requirements: [
      'Business social compliance self-assessment',
      'Sub-contractor list with addresses',
      'Building and fire safety certificates',
      'Corrective action plan from any previous audit'
    ],
    accent: 'violet'
  },
  {
    code: 'RWS',
    name: 'Responsible Wool Standard',
    category: 'Textile',
    standardBody: 'Textile Exchange',
    summary:
      'Certifies animal welfare and land management on wool farms and tracks certified wool through the supply chain to the final product.',
    description:
      'RWS covers the Five Freedoms of animal welfare, prohibits mulesing, and requires progressive land-management practices. Chain of custody applies to every downstream processor.',
    durationMonths: 12,
    feeUSD: 2100,
    requirements: [
      'Animal welfare policy and veterinary records',
      'Land management plan',
      'Farm-to-processor transaction certificates'
    ],
    accent: 'orange'
  }
];

async function run() {
  await connectDB();

  const result = await Scheme.bulkWrite(
    schemes.map((scheme) => ({
      updateOne: { filter: { code: scheme.code }, update: { $set: scheme }, upsert: true }
    }))
  );
  console.log(
    `[seed] schemes — inserted: ${result.upsertedCount}, updated: ${result.modifiedCount}`
  );

  // Optional: promote an existing account to admin, e.g.
  //   npm run seed -- admin@example.com
  const adminEmail = process.argv[2];
  if (adminEmail) {
    const user = await User.findOneAndUpdate(
      { email: adminEmail.toLowerCase() },
      { $set: { role: 'admin' } },
      { new: true }
    );
    console.log(
      user
        ? `[seed] ${user.email} is now an admin`
        : `[seed] no user found for ${adminEmail} — sign in once through the app first`
    );
  }

  await mongoose.disconnect();
  console.log('[seed] done');
}

run().catch((err) => {
  console.error('[seed] failed:', err.message);
  process.exit(1);
});
