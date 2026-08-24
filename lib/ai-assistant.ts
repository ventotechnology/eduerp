import { UserRole, AiChatMessage } from './types';

export interface PredictiveRiskItem {
  id: string;
  studentName: string;
  studentIdNumber: string;
  classNameOrProgram: string;
  riskFactor: 'DROPOUT_RISK' | 'FEE_DEFAULT_RISK' | 'ATTENDANCE_CRITICAL' | 'ACADEMIC_FAIL_RISK';
  riskScore: number; // 0 to 100%
  primaryReason: string;
  recommendedIntervention: string;
}

export function evaluatePredictiveRisks(institutionSlug: string): PredictiveRiskItem[] {
  if (institutionSlug.includes('university')) {
    return [
      {
        id: 'PR-UNIV-01',
        studentName: 'Farhan Kabir',
        studentIdNumber: 'MUST-CSE-22019',
        classNameOrProgram: 'BSc in CSE - Semester 6',
        riskFactor: 'ATTENDANCE_CRITICAL',
        riskScore: 88,
        primaryReason: 'Attendance dropped to 58% in CSE-301 & CSE-305 (Minimum 75% required for exam sitting).',
        recommendedIntervention: 'Issue automated Academic Warning Letter and schedule urgent counselor meeting.'
      },
      {
        id: 'PR-UNIV-02',
        studentName: 'Tanzila Anjum',
        studentIdNumber: 'MUST-BBA-23102',
        classNameOrProgram: 'BBA - Semester 4',
        riskFactor: 'FEE_DEFAULT_RISK',
        riskScore: 74,
        primaryReason: 'Semester fee overdue for 45 days with zero partial payment.',
        recommendedIntervention: 'Offer installment payment plan or Financial Aid Committee review.'
      },
      {
        id: 'PR-UNIV-03',
        studentName: 'Shakib Al Hasan',
        studentIdNumber: 'MUST-EEE-21045',
        classNameOrProgram: 'BSc in EEE - Semester 7',
        riskFactor: 'ACADEMIC_FAIL_RISK',
        riskScore: 82,
        primaryReason: 'CGPA below 2.20 with two course retakes pending in core prerequisites.',
        recommendedIntervention: 'Assign peer tutor and limit maximum credit load in next semester.'
      }
    ];
  }

  if (institutionSlug.includes('madrasha')) {
    return [
      {
        id: 'PR-MAD-01',
        studentName: 'Abdullah Al Mamun',
        studentIdNumber: 'AIMC-HIFZ-089',
        classNameOrProgram: 'Hifz Department (Halqa 2)',
        riskFactor: 'ACADEMIC_FAIL_RISK',
        riskScore: 79,
        primaryReason: 'Daily Sabak incomplete for 4 consecutive days, Dour revision lagging in Para 14-16.',
        recommendedIntervention: 'Ustad 1-on-1 recitation clinic and daily revision parent notification.'
      },
      {
        id: 'PR-MAD-02',
        studentName: 'Salman Farsi',
        studentIdNumber: 'AIMC-DAK-042',
        classNameOrProgram: 'Dakhil 9th - Arabic Stream',
        riskFactor: 'ATTENDANCE_CRITICAL',
        riskScore: 85,
        primaryReason: 'Absent 6 days this month without authorized medical leave.',
        recommendedIntervention: 'Send automated SMS to guardian and request parent in-person conference.'
      }
    ];
  }

  // School & College Defaults
  return [
    {
      id: 'PR-SCH-01',
      studentName: 'Rahim Chowdhury',
      studentIdNumber: 'DIMS-STD-1004',
      classNameOrProgram: 'Grade 9 - Science (Section Red)',
      riskFactor: 'DROPOUT_RISK',
      riskScore: 84,
      primaryReason: 'Combined attendance under 68% and sudden 28% drop in Mathematics and Physics midterm scores.',
      recommendedIntervention: 'Arrange Parent-Teacher counseling session and remedial evening tutorial.'
    },
    {
      id: 'PR-SCH-02',
      studentName: 'Sadia Sultana',
      studentIdNumber: 'DIMS-STD-1018',
      classNameOrProgram: 'Grade 7 - Day Shift (Section Green)',
      riskFactor: 'FEE_DEFAULT_RISK',
      riskScore: 78,
      primaryReason: 'Tuition unpaid for 3 consecutive months (Outstanding ৳ 9,450).',
      recommendedIntervention: 'Send soft reminder via SMS/WhatsApp and check Sibling Discount eligibility.'
    },
    {
      id: 'PR-SCH-03',
      studentName: 'Tanvir Hossain',
      studentIdNumber: 'DIMS-STD-1025',
      classNameOrProgram: 'Grade 8 - Morning Shift (Section Blue)',
      riskFactor: 'ATTENDANCE_CRITICAL',
      riskScore: 91,
      primaryReason: 'Consecutive 5 days absent after Eid vacation without leave application.',
      recommendedIntervention: 'Trigger automated Guardian Voice Call & SMS alert.'
    }
  ];
}

export function processAiManagementQuery(query: string, role: UserRole, institutionName: string): AiChatMessage {
  const q = query.toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Attendance Queries
  if (q.includes('attendance') || q.includes('absent') || q.includes('present') || q.includes('উপস্থিতি')) {
    return {
      id: Date.now().toString(),
      sender: 'assistant',
      text: `📊 **Today's Attendance Analysis for ${institutionName}**:\n\n• **Overall Student Attendance**: 93.4% (1,402 of 1,501 present)\n• **Overall Faculty/Staff Attendance**: 97.8% (89 of 91 present)\n• **Lowest Performing Class/Batch**: Grade 9 Red Section (81.2%)\n• **Highest Performing Class/Batch**: Grade 4 Green Section (98.6%)\n\n⚠️ **Actionable Insight**: 14 students have been flagged for falling below the minimum 75% regulatory attendance threshold.`,
      timestamp,
      dataSummary: {
        totalPresent: 1402,
        totalAbsent: 99,
        rate: '93.4%',
        alertCount: 14
      },
      suggestedActions: [
        'Send Instant SMS to Guardians of Absent Students',
        'Export Daily Attendance Sheet (PDF)',
        'View Low Attendance Risk Roster'
      ]
    };
  }

  // 2. Finance & Due Collection Queries
  if (q.includes('fee') || q.includes('due') || q.includes('collection') || q.includes('tuition') || q.includes('টাকা') || q.includes('বকেয়া')) {
    return {
      id: Date.now().toString(),
      sender: 'assistant',
      text: `💰 **Financial & Fee Collection Executive Summary**:\n\n• **Today's Real-time Collection**: ৳ 4,82,500 (bKash: 62%, Nagad: 21%, Bank/Cards: 17%)\n• **Month-to-Date Collection**: ৳ 38,40,000 (84.2% of target)\n• **Total Outstanding Dues Across Campus**: ৳ 7,20,500\n• **Highest Dues Category**: Grade 9-10 Lab & Session Fees (৳ 2,45,000)\n\n💡 **Recommendation**: 82 invoices will exceed the 7-day grace period tomorrow. Triggering automated SMS reminders today usually recovers 38% within 24 hours.`,
      timestamp,
      dataSummary: {
        todayCollected: '৳ 4,82,500',
        monthCollected: '৳ 38,40,000',
        outstandingDues: '৳ 7,20,500',
        recoveryRate: '84.2%'
      },
      suggestedActions: [
        'Broadcast Overdue Payment Reminder SMS',
        'Open General Ledger / Trial Balance',
        'View Sibling / Need-based Waivers List'
      ]
    };
  }

  // 3. Performance & Grade Queries
  if (q.includes('grade') || q.includes('result') || q.includes('exam') || q.includes('gpa') || q.includes('cgpa') || q.includes('ফলাফল')) {
    return {
      id: Date.now().toString(),
      sender: 'assistant',
      text: `🎓 **Academic Examination & Performance Review**:\n\n• **Latest Examination**: Midterm / First Term Assessment 2026\n• **Overall Institution Pass Rate**: 94.6%\n• **GPA 5.00 / CGPA 3.75+ Achievers**: 142 students (28.4% of cohort)\n• **Subjects Requiring Academic Intervention**: Advanced Mathematics (12.4% scored below passing) and Physics Theory.\n\n✨ All digital report cards and academic transcripts have been cryptographically signed and QR-enabled for instant verification.`,
      timestamp,
      dataSummary: {
        passRate: '94.6%',
        topPerformers: 142,
        remedialCandidates: 28
      },
      suggestedActions: [
        'Download Tabulation Sheet (Excel)',
        'Generate Branded Report Cards with QR',
        'Schedule Teacher-Parent Remedial Conference'
      ]
    };
  }

  // 4. Dropout & Predictive Risk Queries
  if (q.includes('risk') || q.includes('dropout') || q.includes('fail') || q.includes('ঝুঁকি')) {
    return {
      id: Date.now().toString(),
      sender: 'assistant',
      text: `🚨 **AI Predictive Analytics: Early Warning Signals**:\n\nEduERP Machine Learning models analyzed historical attendance, grade velocity, fee delinquency, and disciplinary records:\n\n1. **High Dropout Probability (Score > 80%)**: 3 students identified.\n2. **Critical Attendance Shortfall (< 75%)**: 18 students at risk of board de-registration.\n3. **Probable Fee Default**: 12 accounts past 60 days.\n\nAll recommendations comply with institutional RBAC privacy safeguards.`,
      timestamp,
      dataSummary: {
        highRisk: 3,
        attendanceRisk: 18,
        feeRisk: 12
      },
      suggestedActions: [
        'View AI Early-Warning Risk Scorecards',
        'Assign Dedicated Faculty Mentors',
        'Send Confidential Counselor Notification'
      ]
    };
  }

  // Default Fallback
  return {
    id: Date.now().toString(),
    sender: 'assistant',
    text: `Hello! I am your **EduERP AI Management Copilot** for ${institutionName}. I am configured to monitor your real-time campus operations across:\n\n• **Attendance & Smart Biometrics**\n• **Fees, bKash/Nagad collections & Double-Entry Accounting**\n• **Academic Grades, GPA/CGPA & Transcripts**\n• **AI Predictive Dropout & Defaulter Signals**\n• **HR Payroll, Teacher Workloads & Logistics**\n\nHow may I assist your administration today?`,
    timestamp,
    suggestedActions: [
      'How many students are absent today?',
      'How much tuition is outstanding this month?',
      'Which students are at high risk of academic shortfall?',
      'Show Grade 4 Green Section performance'
    ]
  };
}

export function generateAiQuestionSet(subject: string, topic: string, difficulty: 'Easy' | 'Medium' | 'Hard', count: number = 3) {
  return [
    {
      id: 'Q-AI-01',
      type: 'MCQ',
      subject,
      topic,
      difficulty,
      questionText: `Which of the following principles best explains the relationship between momentum and impulse in Newtonian mechanics?`,
      options: [
        'Impulse is equal to the change in momentum (J = Δp)',
        'Impulse is always inversely proportional to mass',
        'Momentum remains constant only when unbalanced forces act',
        'Impulse equals velocity divided by acceleration'
      ],
      correctAnswer: 'Impulse is equal to the change in momentum (J = Δp)',
      marks: 1,
      explanation: 'According to the Impulse-Momentum theorem, the impulse of the net force acting on a particle equals the change in momentum of the particle.'
    },
    {
      id: 'Q-AI-02',
      type: 'SHORT_ANSWER',
      subject,
      topic,
      difficulty,
      questionText: `State the primary differences between structured database normalization (3NF/BCNF) and denormalization in high-throughput enterprise systems.`,
      marks: 5,
      rubrics: '2 marks for defining 3NF anomaly elimination; 2 marks for read vs write performance trade-offs; 1 mark for practical real-world example.'
    },
    {
      id: 'Q-AI-03',
      type: 'TRUE_FALSE',
      subject,
      topic,
      difficulty,
      questionText: `In the Hifz curriculum, 'Dour' refers exclusively to newly memorized daily Sabak lessons.`,
      options: ['True', 'False'],
      correctAnswer: 'False',
      marks: 1,
      explanation: 'Dour refers to the full cyclical revision of previously completed Paras, whereas Sabak refers to the new daily lesson.'
    }
  ];
}
