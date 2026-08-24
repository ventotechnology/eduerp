import { db } from '@/lib/db';
import { AppError } from '@/lib/errors/app-error';

export async function listKnowledgeCategories() {
  return db.knowledgeCategory.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      _count: {
        select: { articles: { where: { isPublished: true } } }
      }
    }
  });
}

export async function listKnowledgeArticles(params?: {
  categoryId?: string;
  categorySlug?: string;
  module?: string;
  role?: string;
  search?: string;
  visibilityLevels?: string[]; // e.g. ['PUBLIC', 'AUTHENTICATED']
  language?: string;
  featuredOnly?: boolean;
  limit?: number;
  page?: number;
}) {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || 20));
  const skip = (page - 1) * limit;

  const allowedVisibilities = params?.visibilityLevels || ['PUBLIC'];

  const where: any = {
    isPublished: true,
    visibility: { in: allowedVisibilities }
  };

  if (params?.categoryId) {
    where.categoryId = params.categoryId;
  }
  if (params?.categorySlug) {
    where.category = { slug: params.categorySlug };
  }
  if (params?.module && params.module !== 'ALL') {
    where.relatedModule = params.module;
  }
  if (params?.language) {
    where.language = params.language;
  }
  if (params?.featuredOnly) {
    where.isFeatured = true;
  }
  if (params?.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { summary: { contains: params.search, mode: 'insensitive' } },
      { body: { contains: params.search, mode: 'insensitive' } },
      { tags: { contains: params.search, mode: 'insensitive' } }
    ];
  }

  const [total, items] = await Promise.all([
    db.knowledgeArticle.count({ where }),
    db.knowledgeArticle.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true }
        }
      },
      skip,
      take: limit
    })
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items
  };
}

export async function getKnowledgeArticleBySlug(
  slug: string,
  userVisibilityLevels: string[] = ['PUBLIC']
) {
  const article = await db.knowledgeArticle.findUnique({
    where: { slug },
    include: {
      category: true
    }
  });

  if (!article || !article.isPublished) {
    throw AppError.notFound(`Knowledge Base article '${slug}' not found.`);
  }

  if (!userVisibilityLevels.includes(article.visibility)) {
    throw AppError.forbidden(`Access to this article is restricted to ${article.visibility} accounts.`);
  }

  // Increment viewCount asynchronously
  await db.knowledgeArticle.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } }
  }).catch(() => null);

  // Fetch related articles
  const relatedArticles = await db.knowledgeArticle.findMany({
    where: {
      categoryId: article.categoryId,
      id: { not: article.id },
      isPublished: true,
      visibility: { in: userVisibilityLevels }
    },
    take: 4,
    orderBy: { viewCount: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      viewCount: true
    }
  });

  return {
    ...article,
    relatedArticles
  };
}

export async function voteArticleHelpfulness(slug: string, helpful: boolean) {
  const article = await db.knowledgeArticle.findUnique({ where: { slug } });
  if (!article) throw AppError.notFound(`Article '${slug}' not found.`);

  return db.knowledgeArticle.update({
    where: { id: article.id },
    data: helpful
      ? { helpfulCount: { increment: 1 } }
      : { notHelpfulCount: { increment: 1 } }
  });
}

export async function listFaqs(params?: { categorySlug?: string; module?: string; search?: string }) {
  const where: any = { isPublished: true };

  if (params?.categorySlug) {
    where.category = { slug: params.categorySlug };
  }
  if (params?.module) {
    where.relatedModule = params.module;
  }
  if (params?.search) {
    where.OR = [
      { question: { contains: params.search, mode: 'insensitive' } },
      { answer: { contains: params.search, mode: 'insensitive' } }
    ];
  }

  return db.faqItem.findMany({
    where,
    orderBy: { displayOrder: 'asc' },
    include: {
      category: true
    }
  });
}

export async function voteFaqHelpfulness(id: string, helpful: boolean) {
  return db.faqItem.update({
    where: { id },
    data: helpful
      ? { helpfulCount: { increment: 1 } }
      : { notHelpfulCount: { increment: 1 } }
  });
}

export async function listReleaseNotes() {
  return db.releaseNote.findMany({
    where: { isPublished: true },
    orderBy: { releaseDate: 'desc' }
  });
}

export async function searchHelpCenter(query: string, userVisibilityLevels: string[] = ['PUBLIC']) {
  if (!query || query.trim().length < 2) {
    return { articles: [], faqs: [] };
  }

  const [articles, faqs] = await Promise.all([
    db.knowledgeArticle.findMany({
      where: {
        isPublished: true,
        visibility: { in: userVisibilityLevels },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
          { tags: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { category: true },
      take: 8,
      orderBy: { viewCount: 'desc' }
    }),
    db.faqItem.findMany({
      where: {
        isPublished: true,
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { answer: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { category: true },
      take: 6,
      orderBy: { displayOrder: 'asc' }
    })
  ]);

  return { articles, faqs };
}

export async function suggestArticlesForTicket(params: {
  subject: string;
  category?: string;
  module?: string;
}) {
  const query = params.subject.trim();
  const searchTerms = query.split(/\s+/).filter((t) => t.length > 3).slice(0, 3);

  const orConditions: any[] = [];
  if (params.module && params.module !== 'OTHER') {
    orConditions.push({ relatedModule: params.module });
  }
  for (const term of searchTerms) {
    orConditions.push({ title: { contains: term, mode: 'insensitive' } });
    orConditions.push({ tags: { contains: term, mode: 'insensitive' } });
  }

  if (orConditions.length === 0) {
    return db.knowledgeArticle.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 4,
      select: { id: true, title: true, slug: true, summary: true, relatedModule: true }
    });
  }

  return db.knowledgeArticle.findMany({
    where: {
      isPublished: true,
      OR: orConditions
    },
    take: 5,
    orderBy: { viewCount: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      relatedModule: true
    }
  });
}
