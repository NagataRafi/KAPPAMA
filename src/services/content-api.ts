import { fetchApi } from './api';

export interface PublicOrgProfile {
  aboutText: string;
  visionText: string;
  missions: string[];
  contactEmail: string | null;
  contactInstagram: string | null;
  contactAddress: string | null;
  logoUrl: string | null;
}

export interface PublicLeader {
  id: string;
  position: 'pembina' | 'penasihat' | 'ketua' | 'wakil_ketua_umum';
  name: string;
  photoUrl: string | null;
  campusStudy: string | null;
  sortOrder: number;
}

export interface PublicPeriod {
  id: string;
  periodLabel: string;
  startYear: number;
  endYear: number;
  isCurrent: boolean;
}

export interface PublicBylaw {
  id: string;
  title: string;
  fileUrl: string | null;
  effectiveDate: string;
  isActive: boolean;
}

export interface PublicMediaItem {
  id: string;
  mediaType: 'image' | 'youtube';
  url?: string | null;
  youtubeId?: string | null;
  caption: string | null;
  sortOrder: number;
}

export interface PublicProgram {
  id: string;
  title: string;
  slug: string;
  year: number;
  eventDate: string | null;
  location: string | null;
  summary: string;
  description: string;
  objectives: string | null;
  targets: string | null;
  picName: string | null;
  coverUrl: string | null;
  universityName: string | null;
  universityAbbr: string | null;
  media?: PublicMediaItem[];
}

export interface PublicAlbum {
  id: string;
  title: string;
  slug: string;
  year: number;
  eventDate: string | null;
  description: string | null;
  coverUrl: string | null;
  photoCount: number;
  videoCount: number;
  media?: PublicMediaItem[];
}

export async function getPublicOrg() {
  return fetchApi<{ data: PublicOrgProfile | null }>('/public/org');
}

export async function getPublicLeaders(periodId?: string) {
  const query = periodId ? `?period=${encodeURIComponent(periodId)}` : '';
  return fetchApi<{ data: { periods: PublicPeriod[]; period: PublicPeriod | null; leaders: PublicLeader[] } }>(
    `/public/leaders${query}`
  );
}

export async function getPublicBylaws() {
  return fetchApi<{ data: { current: PublicBylaw | null; history: PublicBylaw[] } }>('/public/bylaws');
}

export async function getPublicPrograms() {
  return fetchApi<{ data: PublicProgram[] }>('/public/programs');
}

export async function getPublicProgram(slug: string) {
  return fetchApi<{ data: PublicProgram }>(`/public/programs/${encodeURIComponent(slug)}`);
}

export async function getPublicAlbums() {
  return fetchApi<{ data: PublicAlbum[] }>('/public/albums');
}

export async function getPublicAlbum(slug: string) {
  return fetchApi<{ data: PublicAlbum }>(`/public/albums/${encodeURIComponent(slug)}`);
}

export async function getPublicStats() {
  return fetchApi<{ data: { activeMembers: number; alumni: number; programs: number; universities: number } }>(
    '/public/stats'
  );
}

// ---------------------------------------------------------------------------
// Admin konten
// ---------------------------------------------------------------------------
export interface ContentSummary {
  pendingMembers: number;
  draftPrograms: number;
  publishedPrograms: number;
  draftAlbums: number;
  publishedAlbums: number;
  periods: number;
  bylaws: number;
}

export interface AdminOrgProfile extends PublicOrgProfile {
  id: string;
  logoKey: string | null;
}

export interface AdminPeriod extends PublicPeriod {
  leaderCount: number;
}

export interface AdminLeader extends PublicLeader {
  periodId: string;
  photoKey: string | null;
}

export interface AdminBylaw extends PublicBylaw {
  fileKey: string;
}

export interface AdminProgramSummary {
  id: string;
  title: string;
  slug: string;
  year: number;
  eventDate: string | null;
  status: 'draft' | 'published';
  coverUrl: string | null;
  universityId: string | null;
  universityName: string | null;
  photoCount: number;
  videoCount: number;
  updatedAt: string;
}

export interface AdminProgramDetail {
  id: string;
  title: string;
  slug: string;
  year: number;
  eventDate: string | null;
  location: string | null;
  summary: string;
  description: string;
  objectives: string | null;
  targets: string | null;
  picName: string | null;
  coverKey: string | null;
  coverUrl: string | null;
  universityId: string | null;
  status: 'draft' | 'published';
  media: PublicMediaItem[];
}

export interface AdminAlbumSummary {
  id: string;
  title: string;
  slug: string;
  year: number;
  eventDate: string | null;
  status: 'draft' | 'published';
  coverUrl: string | null;
  programId: string | null;
  photoCount: number;
  videoCount: number;
  updatedAt: string;
}

export interface AdminAlbumDetail {
  id: string;
  title: string;
  slug: string;
  year: number;
  eventDate: string | null;
  description: string | null;
  coverKey: string | null;
  coverUrl: string | null;
  programId: string | null;
  status: 'draft' | 'published';
  media: PublicMediaItem[];
}

export async function getContentSummary(token: string | null) {
  return fetchApi<{ data: ContentSummary }>('/admin/content/summary', {}, token);
}

export async function getAdminOrg(token: string | null) {
  return fetchApi<{ data: AdminOrgProfile | null }>('/admin/content/org', {}, token);
}

export async function saveAdminOrg(payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string; message: string } }>(
    '/admin/content/org',
    { method: 'PUT', body: JSON.stringify(payload) },
    token
  );
}

export async function getAdminPeriods(token: string | null) {
  return fetchApi<{ data: AdminPeriod[] }>('/admin/content/periods', {}, token);
}

export async function createPeriod(payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    '/admin/content/periods',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function updatePeriod(id: string, payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    `/admin/content/periods/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token
  );
}

export async function activatePeriod(id: string, token: string | null) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/periods/${id}/activate`,
    { method: 'POST' },
    token
  );
}

export async function deletePeriod(id: string, token: string | null) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/periods/${id}`,
    { method: 'DELETE' },
    token
  );
}

export async function getAdminLeaders(periodId: string, token: string | null) {
  return fetchApi<{ data: AdminLeader[] }>(
    `/admin/content/leaders?periodId=${encodeURIComponent(periodId)}`,
    {},
    token
  );
}

export async function createLeader(payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    '/admin/content/leaders',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function updateLeader(id: string, payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    `/admin/content/leaders/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token
  );
}

export async function deleteLeader(id: string, token: string | null) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/leaders/${id}`,
    { method: 'DELETE' },
    token
  );
}

export async function getAdminBylaws(token: string | null) {
  return fetchApi<{ data: AdminBylaw[] }>('/admin/content/bylaws', {}, token);
}

export async function createBylaw(payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    '/admin/content/bylaws',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function updateBylaw(id: string, payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    `/admin/content/bylaws/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token
  );
}

export async function deleteBylaw(id: string, token: string | null) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/bylaws/${id}`,
    { method: 'DELETE' },
    token
  );
}

export async function getAdminPrograms(token: string | null) {
  return fetchApi<{ data: AdminProgramSummary[] }>('/admin/content/programs', {}, token);
}

export async function getAdminProgram(id: string, token: string | null) {
  return fetchApi<{ data: AdminProgramDetail }>(`/admin/content/programs/${id}`, {}, token);
}

export async function createProgram(payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    '/admin/content/programs',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function updateProgram(id: string, payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    `/admin/content/programs/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token
  );
}

export async function setProgramStatus(id: string, status: 'draft' | 'published', token: string | null) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/programs/${id}/status`,
    { method: 'POST', body: JSON.stringify({ status }) },
    token
  );
}

export async function deleteProgram(id: string, token: string | null) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/programs/${id}`,
    { method: 'DELETE' },
    token
  );
}

export async function getAdminAlbums(token: string | null) {
  return fetchApi<{ data: AdminAlbumSummary[] }>('/admin/content/albums', {}, token);
}

export async function getAdminAlbum(id: string, token: string | null) {
  return fetchApi<{ data: AdminAlbumDetail }>(`/admin/content/albums/${id}`, {}, token);
}

export async function createAlbum(payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    '/admin/content/albums',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function updateAlbum(id: string, payload: Record<string, unknown>, token: string | null) {
  return fetchApi<{ data: { id: string } }>(
    `/admin/content/albums/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token
  );
}

export async function setAlbumStatus(id: string, status: 'draft' | 'published', token: string | null) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/albums/${id}/status`,
    { method: 'POST', body: JSON.stringify({ status }) },
    token
  );
}

export async function deleteAlbum(id: string, token: string | null) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/albums/${id}`,
    { method: 'DELETE' },
    token
  );
}

export interface MediaPayload {
  mediaType: 'image' | 'youtube';
  fileKey?: string | null;
  youtubeUrl?: string | null;
  caption?: string | null;
}

export async function addMedia(
  kind: 'program' | 'album',
  ownerId: string,
  payload: MediaPayload,
  token: string | null
) {
  return fetchApi<{ data: { id: string } }>(
    `/admin/content/${kind === 'program' ? 'programs' : 'albums'}/${ownerId}/media`,
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function updateMedia(
  kind: 'program' | 'album',
  mediaId: string,
  payload: { caption?: string | null; sortOrder?: number },
  token: string | null
) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/${kind === 'program' ? 'program-media' : 'album-media'}/${mediaId}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token
  );
}

export async function deleteMedia(kind: 'program' | 'album', mediaId: string, token: string | null) {
  return fetchApi<{ data: { message: string } }>(
    `/admin/content/${kind === 'program' ? 'program-media' : 'album-media'}/${mediaId}`,
    { method: 'DELETE' },
    token
  );
}
