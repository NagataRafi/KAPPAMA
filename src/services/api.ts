/**
 * API Client untuk KAPPAMA Frontend
 */

const API_BASE = '/api';

export class ApiError extends Error {
  code?: string;
  status: number;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => null)) as {
    error?: { message?: string; code?: string; details?: unknown };
  } | null;

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Terjadi kesalahan (HTTP ${response.status})`;
    throw new ApiError(errorMsg, response.status, data?.error?.code, data?.error?.details);
  }

  return data as T;
}

// Master data lookups
export async function getDistricts() {
  const res = await fetchApi<{ data: Array<{ id: string; name: string }> }>('/lookups/districts');
  return res.data;
}

export async function getVillages(districtId?: string) {
  const url = districtId ? `/lookups/villages?districtId=${encodeURIComponent(districtId)}` : '/lookups/villages';
  const res = await fetchApi<{ data: Array<{ id: string; district_id: string; name: string }> }>(url);
  return res.data;
}

export async function getUniversities() {
  const res = await fetchApi<{ data: Array<{ id: string; name: string; abbreviation: string; city: string }> }>('/lookups/universities');
  return res.data;
}

export async function getStudyPrograms(universityId?: string) {
  const url = universityId ? `/lookups/study-programs?universityId=${encodeURIComponent(universityId)}` : '/lookups/study-programs';
  const res = await fetchApi<{ data: Array<{ id: string; university_id: string; name: string; degree_level: string }> }>(url);
  return res.data;
}

export async function getIndustries() {
  const res = await fetchApi<{ data: Array<{ id: string; name: string }> }>('/lookups/industries');
  return res.data;
}

export interface ApiMemberProfile {
  id: string;
  fullName: string;
  username: string;
  whatsapp: string;
  memberType: 'active' | 'alumni';
  cohortYear: number;
  status: 'incomplete' | 'pending' | 'active' | 'rejected' | 'suspended';
  effectiveStatus: string;
  hideContact: boolean;
  timeRemainingMs?: number;
  instagram?: string | null;
  linkedin?: string | null;
  universityName?: string;
  universityAbbr?: string;
  studyProgramName?: string;
  districtName?: string;
  villageName?: string;
  email?: string | null;
  addressDetail?: string | null;
  photoKey?: string | null;
  alumni?: {
    graduationYear: number;
    currentStatus: string;
    jobTitle?: string | null;
    organization?: string | null;
    industryName?: string | null;
    workCity?: string | null;
  } | null;
}

// Me (User & Profile)
export async function getMyProfile(token?: string | null) {
  return fetchApi<{
    data: {
      user: { id: string; email: string; role: string };
      profile: ApiMemberProfile | null;
      alumni: unknown;
      status: string;
    };
  }>('/me', {}, token);
}

export async function getMyStatus(token?: string | null) {
  return fetchApi<{
    data: {
      status: string;
      submittedAt?: string;
      timeRemainingMs?: number;
      rejectionReason?: string;
      approvalType?: string;
      message?: string;
    };
  }>('/me/status', {}, token);
}

export async function submitOnboarding(payload: Record<string, unknown>, token?: string | null) {
  return fetchApi<{ data: { message: string; memberId: string; status: string } }>(
    '/me/onboarding',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateMyProfile(payload: Record<string, unknown>, token?: string | null) {
  return fetchApi<{ data: { message: string } }>(
    '/me/profile',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    token
  );
}

// Direktori Anggota
export interface MemberFilterParams {
  search?: string;
  type?: 'all' | 'active' | 'alumni';
  cohort?: number;
  universityId?: string;
  districtId?: string;
  page?: number;
  limit?: number;
}

export async function getMembers(params: MemberFilterParams = {}, token?: string | null) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.type && params.type !== 'all') searchParams.set('type', params.type);
  if (params.cohort) searchParams.set('cohort', params.cohort.toString());
  if (params.universityId) searchParams.set('universityId', params.universityId);
  if (params.districtId) searchParams.set('districtId', params.districtId);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return fetchApi<{
    data: Array<ApiMemberProfile>;
    meta: { page: number; limit: number; count: number };
  }>(`/members${query}`, {}, token);
}

export async function getMemberDetail(username: string, token?: string | null) {
  return fetchApi<{ data: ApiMemberProfile }>(`/members/${encodeURIComponent(username)}`, {}, token);
}
