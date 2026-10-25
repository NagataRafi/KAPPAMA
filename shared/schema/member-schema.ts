import { z } from 'zod';

export const usernameRegex = /^[a-z0-9_]{3,20}$/;
export const whatsappRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

export const onboardingInputSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Nama lengkap minimal 2 karakter' })
    .max(100, { message: 'Nama lengkap maksimal 100 karakter' }),
  username: z
    .string()
    .min(3, { message: 'Username minimal 3 karakter' })
    .max(20, { message: 'Username maksimal 20 karakter' })
    .regex(usernameRegex, {
      message: 'Username hanya boleh huruf kecil, angka, dan garis bawah (_)',
    }),
  whatsapp: z
    .string()
    .regex(whatsappRegex, { message: 'Nomor WhatsApp tidak valid (format: 08xxx atau +628xxx)' })
    .transform((val) => {
      let cleaned = val.replace(/[\s-]/g, '');
      if (cleaned.startsWith('0')) {
        cleaned = '+62' + cleaned.slice(1);
      } else if (cleaned.startsWith('62')) {
        cleaned = '+' + cleaned;
      }
      return cleaned;
    }),
  instagram: z
    .string()
    .max(50, { message: 'Username Instagram maksimal 50 karakter' })
    .optional()
    .nullable(),
  linkedin: z
    .string()
    .url({ message: 'URL LinkedIn tidak valid' })
    .optional()
    .nullable()
    .or(z.literal('')),
  memberType: z.enum(['active', 'alumni'], {
    errorMap: () => ({ message: 'Pilih tipe keanggotaan (Anggota Aktif atau Alumni)' }),
  }),
  cohortYear: z
    .number({ invalid_type_error: 'Tahun angkatan harus berupa angka' })
    .int()
    .min(1990, { message: 'Tahun angkatan minimal 1990' })
    .max(2035, { message: 'Tahun angkatan maksimal 2035' }),
  universityId: z.string().min(1, { message: 'Pilih universitas' }),
  universityOther: z.string().max(100).optional().nullable(),
  studyProgramId: z.string().min(1, { message: 'Pilih program studi' }),
  studyProgramOther: z.string().max(100).optional().nullable(),
  districtId: z.string().min(1, { message: 'Pilih kecamatan asal di Pacitan' }),
  villageId: z.string().min(1, { message: 'Pilih desa/kelurahan asal' }),
  addressDetail: z
    .string()
    .min(5, { message: 'Detail alamat (dusun/RT/RW/jalan) minimal 5 karakter' })
    .max(255, { message: 'Detail alamat maksimal 255 karakter' }),
  hideContact: z.boolean().default(false),
  turnstileToken: z.string().min(1, { message: 'Verifikasi Turnstile wajib diselesaikan' }),
  consentAgreed: z.literal(true, {
    errorMap: () => ({ message: 'Anda wajib menyetujui pemrosesan data pribadi sesuai UU PDP' }),
  }),
  consentVersion: z.string().default('2026.1'),

  // Field alumni opsional/kondisional
  graduationYear: z.number().int().min(1990).max(2035).optional().nullable(),
  currentStatus: z
    .enum(['working', 'entrepreneur', 'studying', 'job_seeking', 'other'])
    .optional()
    .nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  organization: z.string().max(150).optional().nullable(),
  industryId: z.string().optional().nullable(),
  workCity: z.string().max(100).optional().nullable(),
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;
