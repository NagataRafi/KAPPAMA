import { describe, it, expect } from 'vitest';
import { getEffectiveStatus } from './effective-status';

describe('getEffectiveStatus() — Lazy Auto-Approve 24 Jam', () => {
  const baseTime = new Date('2026-10-25T10:00:00.000Z').getTime();

  it('harus tetap "pending" pada 23 jam 59 menit (kurang 1 menit dari 24 jam)', () => {
    // 23 hours 59 minutes = (23 * 60 + 59) * 60 * 1000 ms = 86,340,000 ms
    const checkTime = baseTime + (23 * 3600 + 59 * 60) * 1000;
    const result = getEffectiveStatus(
      {
        status: 'pending',
        submittedAt: new Date(baseTime).toISOString(),
      },
      checkTime
    );

    expect(result.status).toBe('pending');
    expect(result.isAutoPromoted).toBe(false);
    expect(result.timeRemainingMs).toBe(60 * 1000); // Sisa 60 detik
  });

  it('harus menjadi "active" tepat pada 24 jam 00 menit', () => {
    // 24 hours = 24 * 3600 * 1000 ms = 86,400,000 ms
    const checkTime = baseTime + 24 * 3600 * 1000;
    const result = getEffectiveStatus(
      {
        status: 'pending',
        submittedAt: new Date(baseTime).toISOString(),
      },
      checkTime
    );

    expect(result.status).toBe('active');
    expect(result.isAutoPromoted).toBe(true);
    expect(result.timeRemainingMs).toBe(0);
  });

  it('harus menjadi "active" pada 24 jam 01 menit', () => {
    const checkTime = baseTime + (24 * 3600 + 60) * 1000;
    const result = getEffectiveStatus(
      {
        status: 'pending',
        submittedAt: new Date(baseTime).toISOString(),
      },
      checkTime
    );

    expect(result.status).toBe('active');
    expect(result.isAutoPromoted).toBe(true);
    expect(result.timeRemainingMs).toBe(0);
  });

  it('harus tetap "rejected" meskipun telah lewat lebih dari 24 jam jika ditolak sebelum 24 jam', () => {
    // Pendaftar ditolak admin, status = 'rejected'
    const checkTime = baseTime + 48 * 3600 * 1000; // 48 jam kemudian
    const result = getEffectiveStatus(
      {
        status: 'rejected',
        submittedAt: new Date(baseTime).toISOString(),
      },
      checkTime
    );

    expect(result.status).toBe('rejected');
    expect(result.isAutoPromoted).toBe(false);
    expect(result.timeRemainingMs).toBe(0);
  });

  it('harus menghitung ulang waktu 24 jam ketika pendaftar mengajukan ulang (reset submittedAt)', () => {
    const resubmittedTime = baseTime + 12 * 3600 * 1000; // Resubmit 12 jam kemudian
    const checkTime = resubmittedTime + 2 * 3600 * 1000; // 2 jam setelah resubmit

    const result = getEffectiveStatus(
      {
        status: 'pending',
        submittedAt: new Date(resubmittedTime).toISOString(),
      },
      checkTime
    );

    expect(result.status).toBe('pending');
    expect(result.isAutoPromoted).toBe(false);
    expect(result.timeRemainingMs).toBe(22 * 3600 * 1000); // Masih tersisa 22 jam
  });
});
