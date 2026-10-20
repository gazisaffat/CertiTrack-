export type Role = 'user' | 'admin';

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  role: Role;
}

export interface Scheme {
  _id: string;
  code: string;
  name: string;
  category: string;
  standardBody: string;
  summary: string;
  description: string;
  durationMonths: number;
  feeUSD: number;
  requirements: string[];
  accent: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  _id: string;
  scheme: string;
  schemeCode: string;
  schemeName: string;
  feeAtSubmission: number;
  applicantUid: string;
  applicantEmail: string;
  applicantName: string;
  companyName: string;
  country: string;
  employeeCount: number;
  contactPhone: string;
  notes: string;
  status: ApplicationStatus;
  reviewerNote: string;
  reviewedBy: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface OverviewStats {
  scope: 'platform' | 'personal';
  total: number;
  statusCounts: Record<ApplicationStatus, number>;
  schemeCount: number | null;
}
