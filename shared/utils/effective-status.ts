import { MemberStatus } from '../types';

export interface EffectiveStatusInput {
  status: MemberStatus;
  submittedAt: string | Date | null;
}

export interface EffectiveStatusResult {
  status: MemberStatus;
  isAutoPromoted: boolean;
  timeRemainingMs: number;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Menghitung status efektif keanggotaan berdasarkan aturan lazy auto-active 24 jam.
 * Jika status adalah 'pending' dan waktu saat ini >= submittedAt + 24 jam,
 * status efektif berubah menjadi 'active'.
 *
 * @param member Data status dan submittedAt pendaftar
 * @param now Waktu referensi (default: Date.now(), dapat diinjeksi untuk unit testing)
 */
export function getEffectiveStatus(
  member: EffectiveStatusInput,
  now: number = Date.now()
): EffectiveStatusResult {
  // Jika status bukan pending atau tidak ada submittedAt, status tidak berubah
  if (member.status !== 'pending' || !member.submittedAt) {
    return {
      status: member.status,
      isAutoPromoted: false,
      timeRemainingMs: 0,
    };
  }

  const submittedTime =
    typeof member.submittedAt === 'string'
      ? new Date(member.submittedAt).getTime()
      : member.submittedAt.getTime();

  const elapsedMs = now - submittedTime;
  const timeRemainingMs = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsedMs);

  if (elapsedMs >= TWENTY_FOUR_HOURS_MS) {
    return {
      status: 'active',
      isAutoPromoted: true,
      timeRemainingMs: 0,
    };
  }

  return {
    status: 'pending',
    isAutoPromoted: false,
    timeRemainingMs,
  };
}
