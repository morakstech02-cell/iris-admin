// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────
export type Role = 'master' | 'full' | 'exam_officer' | 'records_officer' | 'readonly';

export interface AdminSession {
  id: string;
  email: string;
  adminId: string;
  name: string;
  role: Role;
  lastActive: number;
}

export interface VendorSession {
  id: string;
  email: string;
  name: string;
  lastActive: number;
}

// ─────────────────────────────────────────────────────────────
// Domain
// ─────────────────────────────────────────────────────────────
export interface Student {
  id: string;
  adm: string;
  fullname: string;
  dob: string | null;
  gender: 'Male' | 'Female' | null;
  class: string;
  stream: string | null;
  cbt_password: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  staff_id: string;
  fullname: string;
  email: string;
  role_type: 'class' | 'subject' | 'both';
  assigned_class: string | null;
  assigned_stream: string | null;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface TeacherSubject {
  id: string;
  teacher_id: string;
  class: string;
  stream: string | null;
  subject: string;
}

export interface ClassSubject {
  id: string;
  class: string;
  stream: string | null;
  subject: string;
  obj_max: number;
  theory_max: number;
  ca_max: number;
  display_order: number;
}

export interface TermSetting {
  id: string;
  session: string;
  term: '1st' | '2nd' | '3rd';
  start_date: string | null;
  end_date: string | null;
  next_term_begins: string | null;
  days_school_opened: number;
  is_current: boolean;
}

export interface Question {
  id: string;
  subject: string;
  class: string;
  type: 'objective' | 'theory';
  prompt: string;
  options: string[];
  correct_index: number;
  marks: number;
  source: string;
  created_by: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  class: string;
  duration: number;
  status: 'draft' | 'published' | 'archived';
  created_by: string | null;
  created_at: string;
}

export interface Roster {
  id: string;
  class: string;
  stream: string | null;
  teacher_name: string;
  student_count: number;
  sent_by: string;
  sent_at: string;
  ack: boolean;
}

export interface ScoreSubmission {
  id: string;
  class: string;
  stream: string | null;
  subject: string;
  term: string;
  session: string;
  teacher_name: string;
  status:
    | 'draft'
    | 'submitted'
    | 'class_review'
    | 'class_approved'
    | 'class_rejected'
    | 'admin_approved'
    | 'admin_rejected';
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface Broadsheet {
  id: string;
  class: string;
  stream: string | null;
  term: string;
  session: string;
  student_count: number;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface LiveAttempt {
  id: number;
  student_id: string;
  student_name: string | null;
  student_adm: string | null;
  exam_title: string | null;
  subject: string | null;
  class: string;
  stream: string | null;
  status: 'in_progress' | 'paused' | 'submitted' | 'abandoned';
  current_question: number;
  total_questions: number;
  score: number;
  max_score: number;
  flags: number;
  started_at: string;
  last_activity_at: string;
  submitted_at: string | null;
}

export interface AuditLog {
  id: number;
  action: string;
  detail: string | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_type: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Subscription / Vendor
// ─────────────────────────────────────────────────────────────
export interface School {
  id: number; // bigint
  slug: string;
  name: string;
  motto: string | null;
  address: string | null;
  portal_locked: boolean;
  subscription_plan: string | null;
  subscription_end_date: string | null;
}

export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface VendorSchool {
  id: number; // bigint
  slug: string;
  name: string;
  portal_locked: boolean;
  subscription_plan: string | null;
  subscription_end_date: string | null;
  student_count: number;
  teacher_count: number;
  pending_payments: number;
}

export interface Payment {
  id: string;
  school_id: number;
  amount: number;
  term: string;
  session: string;
  reference: string;
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string | null;
  submitted_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  display_order: number;
}