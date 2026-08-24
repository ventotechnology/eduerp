import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  getPlatformContactSettings,
  updatePlatformContactSettings,
  generateInquiryNumber,
  createContactInquiry,
  listContactInquiries
} from '../lib/client-success/contact-service';
import {
  listKnowledgeArticles,
  getKnowledgeArticleBySlug,
  voteArticleHelpfulness,
  suggestArticlesForTicket
} from '../lib/client-success/knowledge-service';
import {
  listTrainingCourses,
  getTrainingCourseBySlug,
  enrollInCourse,
  completeTrainingLesson,
  verifyTrainingCertificate
} from '../lib/client-success/training-service';
import {
  generateTicketNumber,
  createSupportTicket,
  listSupportTickets,
  getSupportTicket,
  addTicketMessage,
  updateTicketStatus,
  submitTicketCsat,
  getSupportAnalytics,
  computeSlaDueDates
} from '../lib/client-success/ticket-service';

describe('COMMAND 11F — EduERP Client Success, Help, Training & Two-Way Support Ticketing', () => {
  beforeAll(async () => {
    // Ensure default settings exist
    await getPlatformContactSettings();
  });

  describe('1. Platform Contact Settings & Inquiry Generation', () => {
    it('returns official Vento Technology Nikunja-2 contact details', async () => {
      const settings = await getPlatformContactSettings();
      expect(settings.companyName).toBe('Vento Technology');
      expect(settings.address).toContain('Nikunja-2');
      expect(settings.generalEmail).toBe('teamhimu@gmail.com');
      expect(settings.phone).toBe('+8801335556688');
      expect(settings.whatsapp).toBe('+8801335556688');
    });

    it('generates atomic sequential inquiry numbers in format INQ-YYYY-NNNNNN', async () => {
      const inq1 = await generateInquiryNumber();
      const inq2 = await generateInquiryNumber();

      expect(inq1).toMatch(/^INQ-\d{4}-\d{6}$/);
      expect(inq2).toMatch(/^INQ-\d{4}-\d{6}$/);
      expect(inq1).not.toBe(inq2);
    });

    it('creates and lists contact inquiries correctly', async () => {
      const created = await createContactInquiry({
        fullName: 'Dr. Principal Test',
        institutionName: 'Test Academy High School',
        email: `lead.${Date.now()}@testschool.edu.bd`,
        phone: '+8801711000000',
        subject: 'Multi-Campus Admission Inquiry',
        category: 'Product Demo',
        requirements: 'Testing online admission features'
      });

      expect(created.inquiryNumber).toMatch(/^INQ-\d{4}-\d{6}$/);
      expect(created.status).toBe('NEW');

      const list = await listContactInquiries({ search: created.inquiryNumber });
      expect(list.total).toBeGreaterThanOrEqual(1);
      expect(list.items[0].inquiryNumber).toBe(created.inquiryNumber);
    });
  });

  describe('2. Knowledge Base & Visibility Filtering', () => {
    it('retrieves public articles and excludes internal articles for unauthenticated users', async () => {
      const publicArticles = await listKnowledgeArticles({ visibilityLevels: ['PUBLIC'] });
      expect(publicArticles.items.length).toBeGreaterThan(0);
      for (const item of publicArticles.items) {
        expect(item.visibility).toBe('PUBLIC');
      }
    });

    it('fetches an article by slug and allows helpfulness voting', async () => {
      const article = await getKnowledgeArticleBySlug('how-to-login-institution-portal', ['PUBLIC']);
      expect(article.slug).toBe('how-to-login-institution-portal');
      expect(article.title).toContain('Log in');

      const initialHelpful = article.helpfulCount;
      const updated = await voteArticleHelpfulness(article.slug, true);
      expect(updated.helpfulCount).toBe(initialHelpful + 1);
    });

    it('provides smart suggestions for support ticket subjects', async () => {
      const suggestions = await suggestArticlesForTicket({
        subject: 'How do I log in to the portal?',
        module: 'LOGIN'
      });
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('3. Training Academy & Certification', () => {
    it('lists training courses with total modules and lesson counts', async () => {
      const courses = await listTrainingCourses();
      expect(courses.length).toBeGreaterThanOrEqual(4);
      expect(courses[0].totalModules).toBeGreaterThanOrEqual(1);
      expect(courses[0].totalLessons).toBeGreaterThanOrEqual(1);
    });

    it('allows a user to enroll, complete lessons, and issue a verified certificate upon 100% completion', async () => {
      const courses = await listTrainingCourses();
      const targetCourse = courses[0];

      const testUser = {
        id: `user_test_${Date.now()}`,
        email: `trainer.${Date.now()}@eduerp.us`,
        name: 'Prof. Certified Teacher',
        institutionName: 'Dhaka Ideal Model High School',
        tenantId: 'demo-school'
      };

      const enrollment = await enrollInCourse(targetCourse.id, testUser);
      expect(enrollment.status).toBe('ENROLLED');

      const fullCourse = await getTrainingCourseBySlug(targetCourse.slug, testUser.id);
      const allLessons = fullCourse.modules.flatMap((m: any) => m.lessons);

      let lastResult: any = null;
      for (const lesson of allLessons) {
        lastResult = await completeTrainingLesson(targetCourse.id, lesson.id, testUser);
      }

      expect(lastResult.isCompleted).toBe(true);
      expect(lastResult.enrollment.progressPercent).toBe(100);
      expect(lastResult.certificate).toBeDefined();
      expect(lastResult.certificate.certificateNumber).toMatch(/^CERT-TRN-\d{4}-[A-Z0-9]+$/);

      // Verify certificate
      const verified = await verifyTrainingCertificate(lastResult.certificate.certificateNumber);
      expect(verified.userName).toBe(testUser.name);
      expect(verified.courseId).toBe(targetCourse.id);
    });
  });

  describe('4. Two-Way Support Ticketing & Strict Security', () => {
    const schoolUser = {
      userId: `user_school_${Date.now()}`,
      name: 'School Principal',
      email: 'principal@demo-school.edu.bd',
      role: 'PRINCIPAL',
      tenantId: 'demo-school',
      isPlatformAdmin: false
    };

    const madrashaUser = {
      userId: `user_madrasha_${Date.now()}`,
      name: 'Madrasha Principal',
      email: 'principal@demo-madrasha.edu.bd',
      role: 'PRINCIPAL',
      tenantId: 'demo-madrasha',
      isPlatformAdmin: false
    };

    const supportAdmin = {
      userId: `admin_support_${Date.now()}`,
      name: 'EduERP Support Lead',
      email: 'lead.support@eduerp.us',
      role: 'SUPPORT_ADMIN',
      tenantId: 'demo-school',
      isPlatformAdmin: true
    };

    let createdTicketNumber = '';

    it('generates atomic sequential ticket numbers in format TKT-YYYY-NNNNNN', async () => {
      const t1 = await generateTicketNumber();
      const t2 = await generateTicketNumber();

      expect(t1).toMatch(/^TKT-\d{4}-\d{6}$/);
      expect(t2).toMatch(/^TKT-\d{4}-\d{6}$/);
      expect(t1).not.toBe(t2);
    });

    it('creates a tenant-bound support ticket with calculated SLA targets', async () => {
      const ticket = await createSupportTicket(
        {
          subject: 'Examination GPA formula question',
          categoryCode: 'EXAMINATION',
          relatedModule: 'EXAM',
          priority: 'HIGH',
          description: 'Need assistance with GPA calculation for 4th subject in HSC batch'
        },
        schoolUser
      );

      expect(ticket.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
      expect(ticket.tenantId).toBe('demo-school');
      expect(ticket.status).toBe('NEW');
      expect(ticket.firstResponseDueAt).toBeDefined();
      expect(ticket.resolutionDueAt).toBeDefined();

      createdTicketNumber = ticket.ticketNumber;
    });

    it('strictly isolates tickets across tenants: Madrasha user cannot access School ticket', async () => {
      await expect(
        getSupportTicket(createdTicketNumber, madrashaUser)
      ).rejects.toThrow(/Access to ticket .* denied/);
    });

    it('allows Support Admin to post an INTERNAL NOTE and verifies it is STRIPPED for the School customer', async () => {
      // Support Admin posts Internal Note
      const internalMsg = await addTicketMessage(
        createdTicketNumber,
        {
          message: 'Internal investigation: Verified GPA formula in grading table. No database bug found.',
          visibility: 'INTERNAL_NOTE'
        },
        supportAdmin
      );
      expect(internalMsg.visibility).toBe('INTERNAL_NOTE');

      // Support Admin posts Public Reply
      const publicReply = await addTicketMessage(
        createdTicketNumber,
        {
          message: 'Dear Principal, we have reviewed your 4th subject configuration. It follows the standard Board rules.',
          visibility: 'PUBLIC_REPLY'
        },
        supportAdmin
      );
      expect(publicReply.visibility).toBe('PUBLIC_REPLY');

      // When Customer retrieves ticket, INTERNAL NOTE is STRICTLY ABSENT from messages
      const customerView = await getSupportTicket(createdTicketNumber, schoolUser);
      const customerMessageIds = customerView.messages.map((m: any) => m.id);

      expect(customerMessageIds).toContain(publicReply.id);
      expect(customerMessageIds).not.toContain(internalMsg.id);
      expect(customerView.messages.some((m: any) => m.visibility === 'INTERNAL_NOTE')).toBe(false);

      // When Support Admin retrieves ticket, INTERNAL NOTE IS PRESENT
      const adminView = await getSupportTicket(createdTicketNumber, supportAdmin);
      expect(adminView.messages.some((m: any) => m.visibility === 'INTERNAL_NOTE')).toBe(true);
    });

    it('allows customer to reply back and updates ticket status accordingly', async () => {
      const customerReply = await addTicketMessage(
        createdTicketNumber,
        {
          message: 'Thank you! That clarifies the calculation. Everything matches now.'
        },
        schoolUser
      );

      expect(customerReply.senderType).toBe('CUSTOMER');

      const ticketAfterReply = await getSupportTicket(createdTicketNumber, supportAdmin);
      expect(ticketAfterReply.status).toBe('CUSTOMER_REPLIED');
    });

    it('resolves ticket with mandatory resolution summary and collects CSAT feedback', async () => {
      const resolved = await updateTicketStatus(
        createdTicketNumber,
        {
          status: 'RESOLVED',
          resolutionSummary: 'Verified 4th subject calculation settings and assisted client.'
        },
        supportAdmin
      );

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionSummary).toContain('Verified 4th subject');

      // Customer rates ticket 5 stars
      const csat = await submitTicketCsat(
        createdTicketNumber,
        { rating: 5, comment: 'Excellent and fast resolution!' },
        schoolUser
      );

      expect(csat.rating).toBe(5);
      expect(csat.comment).toBe('Excellent and fast resolution!');

      // Verify analytics aggregates
      const analytics = await getSupportAnalytics();
      expect(analytics.totalTickets).toBeGreaterThanOrEqual(1);
      expect(analytics.averageCsat).toBeGreaterThanOrEqual(4.0);
    });
  });
});
