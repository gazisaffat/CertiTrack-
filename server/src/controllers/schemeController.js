import { Scheme } from '../models/Scheme.js';
import { Application } from '../models/Application.js';
import { ApiError } from '../middleware/errorHandler.js';

/** GET /api/schemes?search=&category=&sort=&page=&limit= — public. */
export async function listSchemes(req, res, next) {
  try {
    const { search = '', category = '', sort = 'name', page = '1', limit = '9' } = req.query;

    const filter = { active: true };
    if (category) filter.category = category;
    if (search) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { code: rx }, { standardBody: rx }, { summary: rx }];
    }

    const sortMap = {
      name: { name: 1 },
      'fee-asc': { feeUSD: 1 },
      'fee-desc': { feeUSD: -1 },
      newest: { createdAt: -1 }
    };

    const pageNum = Math.max(1, Number(page) || 1);
    const perPage = Math.min(50, Math.max(1, Number(limit) || 9));

    const [items, total] = await Promise.all([
      Scheme.find(filter)
        .sort(sortMap[sort] || sortMap.name)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
      Scheme.countDocuments(filter)
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / perPage) || 1 });
  } catch (err) {
    next(err);
  }
}

/** GET /api/schemes/categories — public, powers the filter dropdown. */
export async function listCategories(_req, res, next) {
  try {
    const categories = await Scheme.distinct('category', { active: true });
    res.json(categories.sort());
  } catch (err) {
    next(err);
  }
}

/** GET /api/schemes/:id — public. */
export async function getScheme(req, res, next) {
  try {
    const scheme = await Scheme.findById(req.params.id).lean();
    if (!scheme) throw new ApiError(404, 'Scheme not found');
    res.json(scheme);
  } catch (err) {
    next(err);
  }
}

/** POST /api/schemes — admin. */
export async function createScheme(req, res, next) {
  try {
    const scheme = await Scheme.create(req.body);
    res.status(201).json(scheme);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/schemes/:id — admin. */
export async function updateScheme(req, res, next) {
  try {
    const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!scheme) throw new ApiError(404, 'Scheme not found');
    res.json(scheme);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/schemes/:id — admin.
 * Soft-deletes (active: false) when applications exist so historical records
 * keep a valid reference; hard-deletes only an unused scheme.
 */
export async function deleteScheme(req, res, next) {
  try {
    const inUse = await Application.countDocuments({ scheme: req.params.id });

    if (inUse > 0) {
      const scheme = await Scheme.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
      );
      if (!scheme) throw new ApiError(404, 'Scheme not found');
      return res.json({ deleted: false, archived: true, applications: inUse });
    }

    const scheme = await Scheme.findByIdAndDelete(req.params.id);
    if (!scheme) throw new ApiError(404, 'Scheme not found');
    res.json({ deleted: true, archived: false });
  } catch (err) {
    next(err);
  }
}
