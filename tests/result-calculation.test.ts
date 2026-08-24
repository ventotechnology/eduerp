import { describe, it, expect } from 'vitest';
import { calculateSchoolGpa, calculateUniversityCgpa } from '../lib/services/exam-service';

describe('Academic Result Calculation & GPA Engine (COMMAND 4)', () => {
  it('calculates standard Bangladesh School GPA (5.00 Scale)', () => {
    const subjects = [
      { subjectCode: 'BNG-101', theoryMarks: 82, fullMarks: 100 }, // 82% => A+ (5.0)
      { subjectCode: 'ENG-102', theoryMarks: 75, fullMarks: 100 }, // 75% => A (4.0)
      { subjectCode: 'MTH-103', theoryMarks: 85, fullMarks: 100 }, // 85% => A+ (5.0)
      { subjectCode: 'SCI-104', theoryMarks: 65, fullMarks: 100 }, // 65% => A- (3.5)
      { subjectCode: 'SOC-105', theoryMarks: 58, fullMarks: 100 }  // 58% => B (3.0)
    ];

    // Total compulsory grade points = 5.0 + 4.0 + 5.0 + 3.5 + 3.0 = 20.5
    // GPA = 20.5 / 5 = 4.10 (Grade A)
    const result = calculateSchoolGpa(subjects);

    expect(result.isPassed).toBe(true);
    expect(result.gpa).toBe(4.1);
    expect(result.letterGrade).toBe('A');
    expect(result.failedCount).toBe(0);
    expect(result.totalObtainedMarks).toBe(365);
  });

  it('correctly applies Bangladesh 4th Subject Bonus rule (points > 2.0 added to compulsory)', () => {
    // 5 Compulsory subjects yielding GPA 4.60 (23.0 points)
    // 1 Optional 4th Subject with Grade A+ (5.0 point). Bonus = 5.0 - 2.0 = 3.0 points
    // New Total points = 23.0 + 3.0 = 26.0
    // Final GPA = 26.0 / 5 = 5.20 => Capped at 5.00 (Grade A+)
    const subjects = [
      { subjectCode: 'BNG-101', theoryMarks: 85, fullMarks: 100 }, // A+ (5.0)
      { subjectCode: 'ENG-102', theoryMarks: 82, fullMarks: 100 }, // A+ (5.0)
      { subjectCode: 'MTH-103', theoryMarks: 72, fullMarks: 100 }, // A (4.0)
      { subjectCode: 'PHY-104', theoryMarks: 81, fullMarks: 100 }, // A+ (5.0)
      { subjectCode: 'CHM-105', theoryMarks: 76, fullMarks: 100 }, // A (4.0)
      { subjectCode: 'BIO-106', theoryMarks: 88, fullMarks: 100, isOptionalFourthSubject: true } // 4th Sub A+ (5.0 - 2.0 = +3.0)
    ];

    const result = calculateSchoolGpa(subjects);

    expect(result.isPassed).toBe(true);
    expect(result.gpa).toBe(5.0);
    expect(result.letterGrade).toBe('A+');
  });

  it('propagates failure strictly: if ANY compulsory subject fails (F / 0.0), overall GPA is 0.00 / F', () => {
    const subjects = [
      { subjectCode: 'BNG-101', theoryMarks: 95, fullMarks: 100 }, // A+ (5.0)
      { subjectCode: 'ENG-102', theoryMarks: 90, fullMarks: 100 }, // A+ (5.0)
      { subjectCode: 'MTH-103', theoryMarks: 25, fullMarks: 100 }, // F (0.0) - Failed!
      { subjectCode: 'PHY-104', theoryMarks: 88, fullMarks: 100 }, // A+ (5.0)
      { subjectCode: 'CHM-105', theoryMarks: 85, fullMarks: 100 }  // A+ (5.0)
    ];

    const result = calculateSchoolGpa(subjects);

    expect(result.isPassed).toBe(false);
    expect(result.gpa).toBe(0.0);
    expect(result.letterGrade).toBe('F');
    expect(result.failedCount).toBe(1);
  });

  it('calculates University Credit-Weighted CGPA (4.00 Scale)', () => {
    // CSE-101: 3.0 credits, A (3.75) => 11.25
    // CSE-102: 1.5 credits, A+ (4.00) => 6.00
    // MAT-101: 3.0 credits, B+ (3.25) => 9.75
    // ENG-101: 3.0 credits, B (3.00) => 9.00
    // Total Credits = 10.5
    // Total Weighted Points = 11.25 + 6.00 + 9.75 + 9.00 = 36.00
    // CGPA = 36.00 / 10.5 = 3.43
    const courses = [
      { courseCode: 'CSE-101', creditHours: 3.0, gradePoint: 3.75 },
      { courseCode: 'CSE-102', creditHours: 1.5, gradePoint: 4.00 },
      { courseCode: 'MAT-101', creditHours: 3.0, gradePoint: 3.25 },
      { courseCode: 'ENG-101', creditHours: 3.0, gradePoint: 3.00 }
    ];

    const result = calculateUniversityCgpa(courses);

    expect(result.totalCredits).toBe(10.5);
    expect(result.earnedCredits).toBe(10.5);
    expect(result.cgpa).toBe(3.43);
  });

  it('handles university course retake/improvement policy: higher grade counts toward CGPA', () => {
    // First attempt: MAT-101 (3 cr, grade F / 0.0) -> Earned credits = 0
    // Retake attempt: MAT-101 (3 cr, grade B+ / 3.25) -> Earned credits = 3.0
    const courses = [
      { courseCode: 'CSE-101', creditHours: 3.0, gradePoint: 3.75 },
      { courseCode: 'MAT-101', creditHours: 3.0, gradePoint: 3.25 } // Higher retake grade applied
    ];

    const result = calculateUniversityCgpa(courses);

    expect(result.totalCredits).toBe(6.0);
    expect(result.earnedCredits).toBe(6.0);
    expect(result.cgpa).toBe(3.5);
  });
});
