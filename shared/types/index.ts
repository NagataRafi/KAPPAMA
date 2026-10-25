export type UserRole = 'member' | 'content_admin' | 'super_admin';

export type MemberType = 'active' | 'alumni';

export type MemberStatus = 'incomplete' | 'pending' | 'active' | 'rejected' | 'suspended';

export type ApprovalType = 'manual' | 'auto';

export type LeaderPosition = 'pembina' | 'penasihat' | 'ketua' | 'wakil_ketua_umum';

export type ProgramStatus = 'draft' | 'published';

export type AlumniCurrentStatus = 'working' | 'entrepreneur' | 'studying' | 'job_seeking' | 'other';

export interface User {
  id: string;
  clerkUserId: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  whatsapp: string;
  instagram?: string | null;
  linkedin?: string | null;
  memberType: MemberType;
  cohortYear: number;
  universityId: string;
  universityOther?: string | null;
  studyProgramId: string;
  studyProgramOther?: string | null;
  districtId: string;
  villageId: string;
  addressDetail?: string | null;
  photoKey?: string | null;
  hideContact: boolean;
  status: MemberStatus;
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  approvalType?: ApprovalType | null;
  rejectionReason?: string | null;
  consentAt: string;
  consentVersion: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlumniDetail {
  id: string;
  memberId: string;
  graduationYear: number;
  currentStatus: AlumniCurrentStatus;
  jobTitle?: string | null;
  organization?: string | null;
  industryId?: string | null;
  workCity?: string | null;
}
