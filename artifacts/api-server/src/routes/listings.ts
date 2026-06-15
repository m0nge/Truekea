import { Router } from "express";
import { db, listingsTable, usersTable } from "@workspace/db";
import { eq, desc, and, gte, lte, ilike, or, sql } from "drizzle-orm";
import {
  GetListingsQueryParams,
  CreateListingBody,
  UpdateListingBody,
  UpdateListingStatusBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/listings", async (req, res) => {
  const parsed = GetListingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query parameters" });
  }
  const { category, search, minPrice, maxPrice, status } = parsed.data;

  const conditions = [];
  if (category) conditions.push(eq(listingsTable.category, category));
  if (status) conditions.push(eq(listingsTable.status, status));
  if (minPrice !== undefined) conditions.push(gte(listingsTable.price, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(listingsTable.price, String(maxPrice)));
  if (search) {
    conditions.push(
      or(
        ilike(listingsTable.title, `%${search}%`),
        ilike(listingsTable.description, `%${search}%`)
      )
    );
  }

  const listings = await db
    .select({
      id: listingsTable.id,
      title: listingsTable.title,
      description: listingsTable.description,
      price: listingsTable.price,
      status: listingsTable.status,
      category: listingsTable.category,
      photos: listingsTable.photos,
      condition: listingsTable.condition,
      location: listingsTable.location,
      sellerId: listingsTable.sellerId,
      sellerName: sql<string | null>`CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName})`,
      sellerAvatar: usersTable.profileImageUrl,
      createdAt: listingsTable.createdAt,
      updatedAt: listingsTable.updatedAt,
    })
    .from(listingsTable)
    .leftJoin(usersTable, eq(listingsTable.sellerId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(listingsTable.createdAt));

  return res.json(listings.map(l => ({
    ...l,
    price: Number(l.price),
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  })));
});

router.get("/listings/mine", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const userId = req.user!.id;

  const listings = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, userId))
    .orderBy(desc(listingsTable.createdAt));

  return res.json(listings.map(l => ({
    ...l,
    price: Number(l.price),
    sellerName: null,
    sellerAvatar: null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  })));
});

router.get("/listings/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const rows = await db
    .select({
      id: listingsTable.id,
      title: listingsTable.title,
      description: listingsTable.description,
      price: listingsTable.price,
      status: listingsTable.status,
      category: listingsTable.category,
      photos: listingsTable.photos,
      condition: listingsTable.condition,
      location: listingsTable.location,
      sellerId: listingsTable.sellerId,
      sellerName: sql<string | null>`CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName})`,
      sellerAvatar: usersTable.profileImageUrl,
      sellerEmail: usersTable.email,
      createdAt: listingsTable.createdAt,
      updatedAt: listingsTable.updatedAt,
    })
    .from(listingsTable)
    .leftJoin(usersTable, eq(listingsTable.sellerId, usersTable.id))
    .where(eq(listingsTable.id, id))
    .limit(1);

  if (rows.length === 0) return res.status(404).json({ error: "Listing not found" });

  const l = rows[0];
  return res.json({
    ...l,
    price: Number(l.price),
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  });
});

router.post("/listings", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const { title, description, price, category, photos, condition, location } = parsed.data;

  const [listing] = await db
    .insert(listingsTable)
    .values({
      title,
      description,
      price: String(price),
      category,
      photos: photos ?? [],
      condition: condition ?? null,
      location: location ?? null,
      sellerId: req.user!.id,
      status: "active",
    })
    .returning();

  return res.status(201).json({
    ...listing,
    price: Number(listing.price),
    sellerName: null,
    sellerAvatar: null,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  });
});

router.patch("/listings/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const existing = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (existing.length === 0) return res.status(404).json({ error: "Listing not found" });
  if (existing[0].sellerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });

  const parsed = UpdateListingBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const { title, description, price, category, photos, condition, location } = parsed.data;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = String(price);
  if (category !== undefined) updates.category = category;
  if (photos !== undefined) updates.photos = photos;
  if (condition !== undefined) updates.condition = condition;
  if (location !== undefined) updates.location = location;

  const [updated] = await db
    .update(listingsTable)
    .set(updates)
    .where(eq(listingsTable.id, id))
    .returning();

  return res.json({
    ...updated,
    price: Number(updated.price),
    sellerName: null,
    sellerAvatar: null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/listings/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const existing = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (existing.length === 0) return res.status(404).json({ error: "Listing not found" });
  if (existing[0].sellerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });

  await db.delete(listingsTable).where(eq(listingsTable.id, id));
  return res.json({ success: true });
});

router.patch("/listings/:id/status", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const existing = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (existing.length === 0) return res.status(404).json({ error: "Listing not found" });
  if (existing[0].sellerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });

  const parsed = UpdateListingStatusBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [updated] = await db
    .update(listingsTable)
    .set({ status: parsed.data.status })
    .where(eq(listingsTable.id, id))
    .returning();

  return res.json({
    ...updated,
    price: Number(updated.price),
    sellerName: null,
    sellerAvatar: null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export default router;
