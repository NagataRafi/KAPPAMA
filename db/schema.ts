import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// 1. Users (Auth & Peran)
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('member'), // 'member' | 'content_admin' | 'super_admin'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clerkUserIdx: uniqueIndex('idx_users_clerk_id').on(table.clerkUserId),
  })
);

// 2. Master Data Wilayah Pacitan
export const districts = pgTable('districts', {
  id: varchar('id', { length: 20 }).primaryKey(), // Kode Kemendagri misal: 35.01.01
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const villages = pgTable(
  'villages',
  {
    id: varchar('id', { length: 20 }).primaryKey(), // Kode Kemendagri misal: 35.01.01.2001
    districtId: varchar('district_id', { length: 20 })
      .notNull()
      .references(() => districts.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    districtIdx: index('idx_villages_district_id').on(table.districtId),
  })
);

// 3. Master Data Universitas & Prodi
export const universities = pgTable('universities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 50 }),
  city: varchar('city', { length: 100 }).default('Malang'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const studyPrograms = pgTable(
  'study_programs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    universityId: uuid('university_id')
      .notNull()
      .references(() => universities.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    degreeLevel: varchar('degree_level', { length: 20 }).default('S1'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    universityIdx: index('idx_study_programs_univ_id').on(table.universityId),
  })
);

// 4. Master Industri (untuk Alumni)
export const industries = pgTable('industries', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Member Profiles
export const memberProfiles = pgTable(
  'member_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    whatsapp: varchar('whatsapp', { length: 30 }).notNull(),
    instagram: varchar('instagram', { length: 50 }),
    linkedin: varchar('linkedin', { length: 255 }),
    memberType: varchar('member_type', { length: 20 }).notNull().default('active'), // 'active' | 'alumni'
    cohortYear: integer('cohort_year').notNull(),
    universityId: uuid('university_id')
      .notNull()
      .references(() => universities.id),
    universityOther: varchar('university_other', { length: 150 }),
    studyProgramId: uuid('study_program_id')
      .notNull()
      .references(() => studyPrograms.id),
    studyProgramOther: varchar('study_program_other', { length: 150 }),
    districtId: varchar('district_id', { length: 20 })
      .notNull()
      .references(() => districts.id),
    villageId: varchar('village_id', { length: 20 })
      .notNull()
      .references(() => villages.id),
    addressDetail: varchar('address_detail', { length: 255 }).notNull(),
    photoKey: varchar('photo_key', { length: 255 }),
    hideContact: boolean('hide_contact').default(false).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('pending'), // 'incomplete' | 'pending' | 'active' | 'rejected' | 'suspended'
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvalType: varchar('approval_type', { length: 20 }), // 'manual' | 'auto'
    rejectionReason: text('rejection_reason'),
    consentAt: timestamp('consent_at', { withTimezone: true }).defaultNow().notNull(),
    consentVersion: varchar('consent_version', { length: 20 }).notNull().default('2026.1'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusTypeIdx: index('idx_member_profiles_status_type').on(table.status, table.memberType),
    universityIdx: index('idx_member_profiles_university').on(table.universityId),
    cohortIdx: index('idx_member_profiles_cohort').on(table.cohortYear),
    districtIdx: index('idx_member_profiles_district').on(table.districtId),
    usernameIdx: uniqueIndex('idx_member_profiles_username').on(table.username),
  })
);

// 6. Alumni Details
export const alumniDetails = pgTable('alumni_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: uuid('member_id')
    .notNull()
    .unique()
    .references(() => memberProfiles.id, { onDelete: 'cascade' }),
  graduationYear: integer('graduation_year').notNull(),
  currentStatus: varchar('current_status', { length: 50 }).notNull(), // 'working' | 'entrepreneur' | 'studying' | 'job_seeking' | 'other'
  jobTitle: varchar('job_title', { length: 150 }),
  organization: varchar('organization', { length: 150 }),
  industryId: uuid('industry_id').references(() => industries.id),
  workCity: varchar('work_city', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Organisasi: Profil, Periode, Struktur, AD/ART
export const orgPeriods = pgTable('org_periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  periodLabel: varchar('period_label', { length: 50 }).notNull(), // e.g. "2026/2027"
  startYear: integer('start_year').notNull(),
  endYear: integer('end_year').notNull(),
  isCurrent: boolean('is_current').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orgLeaders = pgTable(
  'org_leaders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    periodId: uuid('period_id')
      .notNull()
      .references(() => orgPeriods.id, { onDelete: 'cascade' }),
    position: varchar('position', { length: 50 }).notNull(), // 'pembina' | 'penasihat' | 'ketua' | 'wakil_ketua_umum'
    name: varchar('name', { length: 150 }).notNull(),
    photoKey: varchar('photo_key', { length: 255 }),
    campusStudy: varchar('campus_study', { length: 150 }),
    sortOrder: integer('sort_order').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    periodIdx: index('idx_org_leaders_period_id').on(table.periodId),
  })
);

export const orgProfile = pgTable('org_profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  aboutText: text('about_text').notNull(),
  visionText: text('vision_text').notNull(),
  missions: jsonb('missions').notNull(), // array string
  contactEmail: varchar('contact_email', { length: 150 }),
  contactInstagram: varchar('contact_instagram', { length: 100 }),
  contactAddress: text('contact_address'),
  logoKey: varchar('logo_key', { length: 255 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bylawsDocuments = pgTable('bylaws_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 150 }).notNull(),
  fileKey: varchar('file_key', { length: 255 }).notNull(),
  effectiveDate: date('effective_date').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. Program Kerja & Galeri
export const programs = pgTable(
  'programs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    year: integer('year').notNull(),
    eventDate: date('event_date'),
    location: varchar('location', { length: 150 }),
    summary: text('summary').notNull(),
    description: text('description').notNull(),
    objectives: text('objectives'),
    targets: text('targets'),
    picName: varchar('pic_name', { length: 150 }),
    coverKey: varchar('cover_key', { length: 255 }),
    universityId: uuid('university_id').references(() => universities.id),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft' | 'published'
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusYearIdx: index('idx_programs_status_year').on(table.status, table.year),
    slugIdx: uniqueIndex('idx_programs_slug').on(table.slug),
  })
);

export const programMedia = pgTable(
  'program_media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    mediaType: varchar('media_type', { length: 20 }).notNull(), // 'image' | 'youtube'
    fileKey: varchar('file_key', { length: 255 }),
    youtubeId: varchar('youtube_id', { length: 50 }),
    caption: varchar('caption', { length: 255 }),
    sortOrder: integer('sort_order').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    programIdx: index('idx_program_media_program_id').on(table.programId),
  })
);

export const albums = pgTable(
  'albums',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    year: integer('year').notNull(),
    eventDate: date('event_date'),
    description: text('description'),
    coverKey: varchar('cover_key', { length: 255 }),
    programId: uuid('program_id').references(() => programs.id),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft' | 'published'
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusYearIdx: index('idx_albums_status_year').on(table.status, table.year),
    slugIdx: uniqueIndex('idx_albums_slug').on(table.slug),
  })
);

export const albumMedia = pgTable(
  'album_media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    albumId: uuid('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    mediaType: varchar('media_type', { length: 20 }).notNull(), // 'image' | 'youtube'
    fileKey: varchar('file_key', { length: 255 }),
    youtubeId: varchar('youtube_id', { length: 50 }),
    caption: varchar('caption', { length: 255 }),
    sortOrder: integer('sort_order').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    albumIdx: index('idx_album_media_album_id').on(table.albumId),
  })
);

// 9. Audit Logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id').references(() => users.id),
    action: varchar('action', { length: 100 }).notNull(),
    entity: varchar('entity', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata'),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actorIdx: index('idx_audit_logs_actor_id').on(table.actorId, table.createdAt),
    entityIdx: index('idx_audit_logs_entity').on(table.entity, table.entityId),
  })
);
