import { Router } from "express";
import { db, reviewsTable, conversationsTable, listingsTable, usersTable } from "@workspace/db";
import { eq, avg, count, desc, sql } from "drizzle-orm";
import { CreateReviewBody } from "@workspace/api-zod";

const router = Router();

router.post("/reviews", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
  }

  const { conversationId, rating, comment } = parsed.data;
  const reviewerId = req.user!.id;

  const convoRows = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId))
    .limit(1);

  if (convoRows.length === 0) {
    return res.status(404).json({ error: "Conversación no encontrada" });
  }
  const convo = convoRows[0];

  if (convo.buyerId !== reviewerId) {
    return res.status(403).json({ error: "Solo el comprador puede dejar una reseña" });
  }

  const listingRows = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, convo.listingId))
    .limit(1);

  if (listingRows.length === 0) {
    return res.status(404).json({ error: "Anuncio no encontrado" });
  }
  if (listingRows[0].status !== "sold") {
    return res.status(400).json({ error: "Solo se puede valorar cuando el artículo está vendido" });
  }

  const existing = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.conversationId, conversationId))
    .limit(1);

  if (existing.length > 0) {
    return res.status(409).json({ error: "Ya has valorado esta transacción" });
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      conversationId,
      listingId: convo.listingId,
      reviewerId,
      reviewedUserId: convo.sellerId,
      rating,
      comment: comment ?? null,
    })
    .returning();

  return res.status(201).json({ ...review, createdAt: review.createdAt.toISOString() });
});

router.get("/reviews/conversation/:conversationId", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const id = parseInt(req.params.conversationId);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const rows = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.conversationId, id))
    .limit(1);

  if (rows.length === 0) {
    return res.json(null);
  }
  return res.json({ ...rows[0], createdAt: rows[0].createdAt.toISOString() });
});

router.get("/reviews/user/:userId", async (req, res) => {
  const { userId } = req.params;

  const reviews = await db
    .select({
      id: reviewsTable.id,
      conversationId: reviewsTable.conversationId,
      listingId: reviewsTable.listingId,
      reviewerId: reviewsTable.reviewerId,
      reviewedUserId: reviewsTable.reviewedUserId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      listingTitle: listingsTable.title,
      reviewerName: sql<string | null>`CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName})`,
      reviewerAvatar: usersTable.profileImageUrl,
    })
    .from(reviewsTable)
    .leftJoin(listingsTable, eq(reviewsTable.listingId, listingsTable.id))
    .leftJoin(usersTable, eq(reviewsTable.reviewerId, usersTable.id))
    .where(eq(reviewsTable.reviewedUserId, userId))
    .orderBy(desc(reviewsTable.createdAt));

  const [stats] = await db
    .select({
      avgRating: avg(reviewsTable.rating),
      totalReviews: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.reviewedUserId, userId));

  return res.json({
    reviews: reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    avgRating: stats.avgRating ? parseFloat(stats.avgRating) : null,
    totalReviews: Number(stats.totalReviews),
  });
});

export default router;
