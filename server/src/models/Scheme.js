import mongoose from 'mongoose';

/**
 * A certification scheme an organisation can apply for
 * (GOTS, GRS, OCS, RCS ... ).
 */
const schemeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Textile', 'Food & Agriculture', 'Environmental', 'Social Compliance', 'Traceability'],
      index: true
    },
    standardBody: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true, maxlength: 400 },
    description: { type: String, default: '' },
    durationMonths: { type: Number, required: true, min: 1, max: 60 },
    feeUSD: { type: Number, required: true, min: 0 },
    requirements: { type: [String], default: [] },
    accent: { type: String, default: 'teal' },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

schemeSchema.index({ name: 'text', summary: 'text', standardBody: 'text' });

export const Scheme = mongoose.model('Scheme', schemeSchema);
