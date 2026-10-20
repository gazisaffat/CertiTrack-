import { Application, APPLICATION_STATUSES } from '../models/Application.js';
import { Scheme } from '../models/Scheme.js';
import { ApiError } from '../middleware/errorHandler.js';

/** POST /api/applications — authenticated user. */
export async function createApplication(req, res, next) {
  try {
    const { schemeId, companyName, country, employeeCount, contactPhone, notes } = req.body;

    const scheme = await Scheme.findById(schemeId).lean();
    if (!scheme || !scheme.active) throw new ApiError(404, 'Scheme not available');

    const application = await Application.create({
      scheme: scheme._id,
      schemeCode: scheme.code,
      schemeName: scheme.name,
      feeAtSubmission: scheme.feeUSD, // frozen: a later price change must not rewrite history
      applicantUid: req.user.uid,
      applicantEmail: req.user.email,
      applicantName: req.body.applicantName || '',
      companyName,
      country,
      employeeCount,
      contactPhone,
      notes
    });

    res.status(201).json(application);
  } catch (err) {
    if (err.code === 11000) {
      return next(new ApiError(409, 'You already have an open application for this scheme'));
    }
    next(err);
  }
}

/** GET /api/applications/mine — authenticated user. */
export async function listMyApplications(req, res, next) {
  try {
    const filter = { applicantUid: req.user.uid };
    if (req.query.status) filter.status = req.query.status;

    const items = await Application.find(filter).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/applications/:id/withdraw — owner only, and only while still open. */
export async function withdrawApplication(req, res, next) {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) throw new ApiError(404, 'Application not found');

    // Ownership is checked against the token, never against a body field.
    if (application.applicantUid !== req.user.uid) {
      throw new ApiError(403, 'This application belongs to another account');
    }
    if (!['submitted', 'under_review'].includes(application.status)) {
      throw new ApiError(409, `Cannot withdraw an application that is ${application.status}`);
    }

    application.status = 'withdrawn';
    await application.save();
    res.json(application);
  } catch (err) {
    next(err);
  }
}

/** GET /api/applications — admin, with status + search filters. */
export async function listAllApplications(req, res, next) {
  try {
    const { status = '', search = '' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ companyName: rx }, { applicantEmail: rx }, { schemeName: rx }];
    }

    const items = await Application.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/applications/:id/status — admin. */
export async function updateApplicationStatus(req, res, next) {
  try {
    const { status, reviewerNote = '' } = req.body;
    if (!APPLICATION_STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${APPLICATION_STATUSES.join(', ')}`);
    }
    if (status === 'withdrawn') {
      throw new ApiError(400, 'Only the applicant can withdraw an application');
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status, reviewerNote, reviewedBy: req.user.email, reviewedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!application) throw new ApiError(404, 'Application not found');

    res.json(application);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/stats/overview
 * Admins get platform-wide numbers, regular users get their own — same route,
 * scoped by role so the dashboard component stays identical for both.
 */
export async function getOverviewStats(req, res, next) {
  try {
    const isAdmin = req.user.role === 'admin';
    const match = isAdmin ? {} : { applicantUid: req.user.uid };

    const [byStatus, total, schemeCount] = await Promise.all([
      Application.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Application.countDocuments(match),
      isAdmin ? Scheme.countDocuments({ active: true }) : Promise.resolve(null)
    ]);

    const statusCounts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
    byStatus.forEach(({ _id, count }) => {
      statusCounts[_id] = count;
    });

    res.json({ scope: isAdmin ? 'platform' : 'personal', total, statusCounts, schemeCount });
  } catch (err) {
    next(err);
  }
}
