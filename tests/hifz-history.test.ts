import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import { recordDailyHifzProgress, getStudentHifzHistory } from '@/lib/services/hifz-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Madrasha 30-Para Hifzul Quran Progress Engine', () => {
  const actor: SessionUser = {
    id: 'USR-USTAD',
    email: 'ustad@aimc.edu.bd',
    name: 'Ustad Hafiz Qari Nurul Islam',
    role: 'TEACHER',
    tenantId: 'al-jamiatul-islamia-madrasha',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  it('records daily Sabak progress as chronological history without overwriting previous logs', async () => {
    const student = await db.student.findFirst({
      where: { campus: { institution: { tenant: { slug: 'al-jamiatul-islamia-madrasha' } } } }
    });

    if (!student) {
      throw new Error('Seed data missing madrasha student');
    }

    // Day 1
    await recordDailyHifzProgress(
      'al-jamiatul-islamia-madrasha',
      {
        studentId: student.id,
        date: '2026-08-20',
        sabakPara: 18,
        sabakSurah: 'Surah Al-Muminun',
        sabakAyatStart: 1,
        sabakAyatEnd: 20,
        sabakGrade: 'Excellent',
        totalParasMemorized: 17.2
      },
      actor
    );

    // Day 2
    await recordDailyHifzProgress(
      'al-jamiatul-islamia-madrasha',
      {
        studentId: student.id,
        date: '2026-08-21',
        sabakPara: 18,
        sabakSurah: 'Surah Al-Muminun',
        sabakAyatStart: 21,
        sabakAyatEnd: 45,
        sabakGrade: 'Very Good',
        totalParasMemorized: 17.4
      },
      actor
    );

    const history = await getStudentHifzHistory('al-jamiatul-islamia-madrasha', student.id);
    expect(history.length).toBeGreaterThanOrEqual(2);

    const day2 = history.find((h) => h.sabakAyatStart === 21);
    const day1 = history.find((h) => h.sabakAyatStart === 1);

    expect(day2).toBeDefined();
    expect(day1).toBeDefined();
    expect(day2?.sabakGrade).toBe('Very Good');
    expect(day1?.sabakGrade).toBe('Excellent');
  });
});
