import mongoose from 'mongoose';

export const APPLICATION_STATUSES = [
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'withdrawn'
];

const applicationSchema = new mongoose.Schema(
  {
    scheme: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: true, index: true },

    // Denormalised so the applications list renders without a join, and so a
    // later rename of the scheme does not rewrite historical records.
    schemeCode: { type: String, required: true },
    schemeName: { type: String, required: true },
    feeAtSubmission: { type: Number, required: true, min: 0 },

    applicantUid: { type: String, required: true, index: true },
    applicantEmail: { type: String, required: true, lowercase: true },
    applicantName: { type: String, default: '' },

    companyName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    employeeCount: { type: Number, required: true, min: 1 },
    contactPhone: { type: String, required: true, trim: true },
    notes: { type: String, default: '', maxlength: 1000 },

    status: { type: String, enum: APPLICATION_STATUSES, default: 'submitted', index: true },
    reviewerNote: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// One live application per applicant per scheme. Withdrawn/rejected rows are
// excluded so a company can re-apply after a failed attempt.
applicationSchema.index(
  { applicantUid: 1, scheme: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['submitted', 'under_review', 'approved'] } }
  }
);

export const Application = mongoose.model('Application', applicationSchema);
