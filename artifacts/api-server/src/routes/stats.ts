import { Router } from "express";
import { db, listingsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (_req, res) => {
  const [counts] = await db
    .select({
      totalActive: sql<number>`COUNT(*) FILTER (WHERE ${listingsTable.status} = 'active')`,
      totalPending: sql<number>`COUNT(*) FILTER (WHERE ${listingsTable.status} = 'pending')`,
      totalSold: sql<number>`COUNT(*) FILTER (WHERE ${listingsTable.status} = 'sold')`,
      totalListings: sql<number>`COUNT(*)`,
    })
    .from(listingsTable);

  const recentListings = await db
    .select()
    .from(listingsTable)
    .orderBy(desc(listingsTable.createdAt))
    .limit(6);

  const categoryCounts = await db
    .select({
      category: listingsTable.category,
      count: sql<number>`COUNT(*)`,
    })
    .from(listingsTable)
    .groupBy(listingsTable.category)
    .orderBy(sql`COUNT(*) DESC`);

  return res.json({
    totalActive: Number(counts.totalActive),
    totalPending: Number(counts.totalPending),
    totalSold: Number(counts.totalSold),
    totalListings: Number(counts.totalListings),
    recentListings: recentListings.map(l => ({
      ...l,
      price: Number(l.price),
      sellerName: null,
      sellerAvatar: null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })),
    categories: categoryCounts.map(c => ({
      category: c.category,
      count: Number(c.count),
    })),
  });
});

export default router;
