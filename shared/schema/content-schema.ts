import { z } from 'zod';
import { extractYouTubeId } from '../utils/youtube';

/**
 * Semua teks konten disimpan sebagai teks biasa (bukan HTML). Tag HTML
 * dibuang di server dan klien merender sebagai teks React (aman dari XSS).
 */
export function stripHtmlTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const plainText = (min: number, max: number) =>
  z
    .string()
    .transform((value) => stripHtmlTags(value))
    .pipe(z.string().min(min, `Minimal ${min} karakter`).max(max, `Maksimal ${max} karakter`));

const optionalText = (max: number) =>
  z
    .string()
    .transform((value) => stripHtmlTags(value))
    .pipe(z.string().max(max, `Maksimal ${max} karakter`))
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null));

export const slugSchema = z
  .string()
  .trim()
  .min(3, 'Slug minimal 3 karakter')
  .max(255, 'Slug maksimal 255 karakter')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung');

export const contentStatusSchema = z.enum(['draft', 'published']);
export const leaderPositionSchema = z.enum(['pembina', 'penasihat', 'ketua', 'wakil_ketua_umum']);
export const mediaTypeSchema = z.enum(['image', 'youtube']);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Tanggal tidak valid');

const optionalDateSchema = z
  .union([isoDateSchema, z.literal(''), z.null()])
  .optional()
  .transform((value) => (value ? value : null));

export const orgProfileInputSchema = z.object({
  aboutText: plainText(20, 5000),
  visionText: plainText(10, 3000),
  missions: z
    .array(plainText(5, 500))
    .min(1, 'Minimal satu misi')
    .max(10, 'Maksimal 10 misi'),
  contactEmail: z
    .union([z.string().trim().email('Format email tidak valid').max(150), z.literal('')])
    .optional()
    .transform((value) => (value ? value : null)),
  contactInstagram: optionalText(100),
  contactAddress: optionalText(500),
  logoKey: optionalText(255),
});

export const periodInputSchema = z
  .object({
    periodLabel: z
      .string()
      .trim()
      .min(4, 'Label periode wajib diisi')
      .max(50, 'Label periode maksimal 50 karakter'),
    startYear: z.coerce.number().int().min(2000).max(2100),
    endYear: z.coerce.number().int().min(2000).max(2100),
    isCurrent: z.boolean().optional().default(false),
  })
  .refine((value) => value.endYear > value.startYear, {
    message: 'Tahun akhir harus lebih besar dari tahun mulai',
    path: ['endYear'],
  });

export const leaderInputSchema = z.object({
  periodId: z.string().uuid('Periode tidak valid'),
  position: leaderPositionSchema,
  name: plainText(2, 150),
  photoKey: optionalText(255),
  campusStudy: optionalText(150),
  sortOrder: z.coerce.number().int().min(1).max(99).optional().default(1),
});

export const bylawsInputSchema = z.object({
  title: plainText(3, 150),
  fileKey: z
    .string()
    .trim()
    .min(1, 'Berkas atau tautan PDF wajib diisi')
    .max(500, 'Tautan maksimal 500 karakter'),
  effectiveDate: isoDateSchema,
  isActive: z.boolean().optional().default(false),
});

export const programInputSchema = z.object({
  title: plainText(3, 200),
  slug: slugSchema,
  year: z.coerce.number().int().min(2000).max(2100),
  eventDate: optionalDateSchema,
  location: optionalText(150),
  summary: plainText(10, 1000),
  description: plainText(10, 20000),
  objectives: optionalText(5000),
  targets: optionalText(1000),
  picName: optionalText(150),
  coverKey: optionalText(255),
  universityId: z
    .union([z.string().uuid('Universitas tidak valid'), z.literal(''), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  status: contentStatusSchema.optional().default('draft'),
});

export const albumInputSchema = z.object({
  title: plainText(3, 200),
  slug: slugSchema,
  year: z.coerce.number().int().min(2000).max(2100),
  eventDate: optionalDateSchema,
  description: optionalText(5000),
  coverKey: optionalText(255),
  programId: z
    .union([z.string().uuid('Program kerja tidak valid'), z.literal(''), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  status: contentStatusSchema.optional().default('draft'),
});

export const mediaInputSchema = z
  .object({
    mediaType: mediaTypeSchema,
    fileKey: z
      .union([z.string().trim().max(500), z.literal(''), z.null()])
      .optional()
      .transform((value) => (value ? value : null)),
    youtubeUrl: z
      .union([z.string().trim().max(300), z.literal(''), z.null()])
      .optional()
      .transform((value) => (value ? value : null)),
    caption: optionalText(255),
    sortOrder: z.coerce.number().int().min(1).max(999).optional().default(1),
  })
  .superRefine((value, ctx) => {
    if (value.mediaType === 'image' && !value.fileKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Berkas gambar wajib diunggah', path: ['fileKey'] });
    }
    if (value.mediaType === 'youtube') {
      if (!value.youtubeUrl || !extractYouTubeId(value.youtubeUrl)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL YouTube tidak valid', path: ['youtubeUrl'] });
      }
    }
  });

export const statusInputSchema = z.object({ status: contentStatusSchema });

export const mediaUpdateSchema = z.object({
  caption: optionalText(255),
  sortOrder: z.coerce.number().int().min(1).max(999).optional(),
});

export const signatureRequestSchema = z  .object({
    kind: z.enum(['program', 'album', 'leader', 'org', 'bylaws']),
    contentType: z.string().trim().min(1).max(100),
    bytes: z.coerce.number().int().positive('Ukuran berkas tidak valid'),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'bylaws') {
      if (value.contentType !== 'application/pdf') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'AD/ART harus berformat PDF', path: ['contentType'] });
      }
      if (value.bytes > 10 * 1024 * 1024) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ukuran PDF maksimal 10 MB', path: ['bytes'] });
      }
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(value.contentType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tipe berkas harus JPG, PNG, atau WebP',
        path: ['contentType'],
      });
    }
    if (value.bytes > 5 * 1024 * 1024) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ukuran gambar maksimal 5 MB', path: ['bytes'] });
    }
  });

export type OrgProfileInput = z.infer<typeof orgProfileInputSchema>;
export type ProgramInput = z.infer<typeof programInputSchema>;
export type AlbumInput = z.infer<typeof albumInputSchema>;
export type MediaInput = z.infer<typeof mediaInputSchema>;
