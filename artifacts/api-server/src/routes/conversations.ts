import { Router } from "express";
import { db, conversationsTable, messagesTable, listingsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { SendMessageBody } from "@workspace/api-zod";

const router = Router();

router.get("/conversations", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const userId = req.user!.id;

  const rows = await db
    .select({
      id: conversationsTable.id,
      listingId: conversationsTable.listingId,
      buyerId: conversationsTable.buyerId,
      sellerId: conversationsTable.sellerId,
      listingTitle: listingsTable.title,
      listingPhoto: sql<string | null>`${listingsTable.photos}[1]`,
      listingPrice: listingsTable.price,
      listingStatus: listingsTable.status,
      createdAt: conversationsTable.createdAt,
    })
    .from(conversationsTable)
    .leftJoin(listingsTable, eq(conversationsTable.listingId, listingsTable.id))
    .where(
      sql`(${conversationsTable.buyerId} = ${userId} OR ${conversationsTable.sellerId} = ${userId})`
    )
    .orderBy(desc(conversationsTable.createdAt));

  const buyerIds = [...new Set(rows.map(r => r.buyerId))];
  const sellerIds = [...new Set(rows.map(r => r.sellerId))];
  const allUserIds = [...new Set([...buyerIds, ...sellerIds])];

  const users = allUserIds.length > 0
    ? await db
        .select({ id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName, profileImageUrl: usersTable.profileImageUrl })
        .from(usersTable)
        .where(sql`${usersTable.id} = ANY(${allUserIds})`)
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const lastMessages = rows.length > 0
    ? await db
        .select({
          conversationId: messagesTable.conversationId,
          content: messagesTable.content,
          createdAt: messagesTable.createdAt,
        })
        .from(messagesTable)
        .where(sql`${messagesTable.conversationId} = ANY(${rows.map(r => r.id)})`)
        .orderBy(desc(messagesTable.createdAt))
    : [];

  const lastMsgMap = new Map<number, typeof lastMessages[0]>();
  for (const msg of lastMessages) {
    if (!lastMsgMap.has(msg.conversationId)) {
      lastMsgMap.set(msg.conversationId, msg);
    }
  }

  return res.json(rows.map(r => {
    const buyer = userMap.get(r.buyerId);
    const seller = userMap.get(r.sellerId);
    const lastMsg = lastMsgMap.get(r.id);
    return {
      id: r.id,
      listingId: r.listingId,
      buyerId: r.buyerId,
      sellerId: r.sellerId,
      listingTitle: r.listingTitle ?? "",
      listingPhoto: r.listingPhoto ?? null,
      listingPrice: r.listingPrice ? Number(r.listingPrice) : null,
      listingStatus: r.listingStatus ?? "active",
      buyerName: buyer ? `${buyer.firstName ?? ""} ${buyer.lastName ?? ""}`.trim() || null : null,
      buyerAvatar: buyer?.profileImageUrl ?? null,
      sellerName: seller ? `${seller.firstName ?? ""} ${seller.lastName ?? ""}`.trim() || null : null,
      sellerAvatar: seller?.profileImageUrl ?? null,
      lastMessage: lastMsg?.content ?? null,
      lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
      unreadCount: 0,
      createdAt: r.createdAt.toISOString(),
    };
  }));
});

router.post("/conversations/listing/:listingId", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const listingId = parseInt(req.params.listingId);
  if (isNaN(listingId)) return res.status(400).json({ error: "Invalid listing ID" });

  const listingRows = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);
  if (listingRows.length === 0) return res.status(404).json({ error: "Listing not found" });

  const listing = listingRows[0];
  const buyerId = req.user!.id;
  const sellerId = listing.sellerId;

  if (buyerId === sellerId) {
    return res.status(400).json({ error: "Cannot start conversation with yourself" });
  }

  const existing = await db
    .select()
    .from(conversationsTable)
    .where(and(
      eq(conversationsTable.listingId, listingId),
      eq(conversationsTable.buyerId, buyerId),
      eq(conversationsTable.sellerId, sellerId)
    ))
    .limit(1);

  let convoId: number;
  let createdAt: Date;
  if (existing.length > 0) {
    convoId = existing[0].id;
    createdAt = existing[0].createdAt;
  } else {
    const [created] = await db
      .insert(conversationsTable)
      .values({ listingId, buyerId, sellerId })
      .returning();
    convoId = created.id;
    createdAt = created.createdAt;
  }

  const buyer = await db.select().from(usersTable).where(eq(usersTable.id, buyerId)).limit(1);
  const seller = await db.select().from(usersTable).where(eq(usersTable.id, sellerId)).limit(1);
  const b = buyer[0];
  const s = seller[0];

  return res.json({
    id: convoId,
    listingId,
    buyerId,
    sellerId,
    listingTitle: listing.title,
    listingPhoto: listing.photos?.[0] ?? null,
    listingPrice: Number(listing.price),
    listingStatus: listing.status,
    buyerName: b ? `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim() || null : null,
    buyerAvatar: b?.profileImageUrl ?? null,
    sellerName: s ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || null : null,
    sellerAvatar: s?.profileImageUrl ?? null,
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
    createdAt: createdAt.toISOString(),
  });
});

router.get("/conversations/:id/messages", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const convoRows = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
  if (convoRows.length === 0) return res.status(404).json({ error: "Conversation not found" });

  const userId = req.user!.id;
  const convo = convoRows[0];
  if (convo.buyerId !== userId && convo.sellerId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const msgs = await db
    .select({
      id: messagesTable.id,
      conversationId: messagesTable.conversationId,
      senderId: messagesTable.senderId,
      content: messagesTable.content,
      createdAt: messagesTable.createdAt,
      senderName: sql<string | null>`CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName})`,
      senderAvatar: usersTable.profileImageUrl,
    })
    .from(messagesTable)
    .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);

  return res.json(msgs.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/conversations/:id/messages", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const convoRows = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
  if (convoRows.length === 0) return res.status(404).json({ error: "Conversation not found" });

  const userId = req.user!.id;
  const convo = convoRows[0];
  if (convo.buyerId !== userId && convo.sellerId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [msg] = await db
    .insert(messagesTable)
    .values({
      conversationId: id,
      senderId: userId,
      content: parsed.data.content,
    })
    .returning();

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const u = user[0];

  return res.status(201).json({
    ...msg,
    senderName: u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null : null,
    senderAvatar: u?.profileImageUrl ?? null,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
