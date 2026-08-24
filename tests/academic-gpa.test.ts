import { describe, it, expect } from 'vitest';
import { calculateSchoolGpa, calculateUniversityCgpa } from '@/lib/services/exam-service';

describe('Academic GPA & CGPA Engine', () => {
  describe('Bangladesh School / College GPA 5.00 Scale', () => {
    it('calculates perfect GPA 5.00 (A+) for all subjects >= 80%', () => {
      const result = calculateSchoolGpa([
        { subjectCode: '101', theoryMarks: 85, fullMarks: 100 },
        { subjectCode: '107', theoryMarks: 90, fullMarks: 100 },
        { subjectCode: '109', theoryMarks: 82, fullMarks: 100 }
      ]);

      expect(result.isPassed).toBe(true);
      expect(result.gpa).toBe(5.0);
      expect(result.letterGrade).toBe('A+');
      expect(result.totalObtainedMarks).toBe(257);
    });

    it('returns GPA 0.00 (Grade F) if ANY compulsory subject is failed', () => {
      const result = calculateSchoolGpa([
        { subjectCode: '101', theoryMarks: 95, fullMarks: 100 },
        { subjectCode: '107', theoryMarks: 90, fullMarks: 100 },
        { subjectCode: '109', theoryMarks: 25, fullMarks: 100 } // Failed (<33)
      ]);

      expect(result.isPassed).toBe(false);
      expect(result.gpa).toBe(0.0);
      expect(result.letterGrade).toBe('F');
    });

    it('applies 4th Subject Bonus logic (points above 2.00)', () => {
      const result = calculateSchoolGpa([
        { subjectCode: '101', theoryMarks: 75, fullMarks: 100 }, // A (4.0)
        { subjectCode: '107', theoryMarks: 75, fullMarks: 100 }, // A (4.0)
        { subjectCode: '138', theoryMarks: 85, fullMarks: 100, isOptionalFourthSubject: true } // A+ (5.0) -> Bonus: 3.0
      ]);

      // (4.0 + 4.0 + 3.0 bonus) / 2 compulsory = 5.5 -> capped at 5.00 A+
      expect(result.isPassed).toBe(true);
      expect(result.gpa).toBe(5.0);
      expect(result.letterGrade).toBe('A+');
    });
  });

  describe('University Credit-Weighted CGPA (4.00 scale)', () => {
    it('computes exact credit-weighted CGPA correctly', () => {
      const result = calculateUniversityCgpa([
        { courseCode: 'CSE-101', creditHours: 3.0, gradePoint: 4.0 }, // 12.0
        { courseCode: 'CSE-102', creditHours: 1.5, gradePoint: 4.0 }, // 6.0
        { courseCode: 'MATH-101', creditHours: 3.0, gradePoint: 3.0 } // 9.0
      ]);

      // Total credits: 7.5, Total points: 27.0 -> 27 / 7.5 = 3.60
      expect(result.totalCredits).toBe(7.5);
      expect(result.earnedCredits).toBe(7.5);
      expect(result.cgpa).toBe(3.6);
    });
  });
});
