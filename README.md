
pnpm install
pnpm db:push
npm run build
npm run test
import { and, eq, gt, isNull, or } from "drizzle-orm";

export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const now = new Date();

  const result = await db
    .select()
    .from(userBotPurchases)
    .where(
      and(
        eq(userBotPurchases.userId, userId),
        eq(userBotPurchases.active, true),
        or(
          isNull(userBotPurchases.expiresAt),
          gt(userBotPurchases.expiresAt, now)
        )
      )
    )
    .limit(1);

  return result.length > 0;
}
import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const shareEvents = pgTable("share_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  targetType: varchar("target_type", { length: 64 }).notNull(),
  targetId: integer("target_id").notNull(),
  platform: varchar("platform", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityFeed = pgTable("activity_feed", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
import {
  pgTable,
  serial,
  integer,
  numeric,
  varchar,
  boolean,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const songPurchases = pgTable("song_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  songId: integer("song_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userBotPurchases = pgTable("user_bot_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  botId: varchar("bot_id", { length: 64 }).notNull(),
  plan: varchar("plan", { length: 32 }).notNull(),
  active: boolean("active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trackReviews = pgTable("track_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  trackId: integer("track_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const artistProfiles = pgTable("artist_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),import { pgTable, serial, integer, numeric, varchar, timestamp } from "drizzle-orm/pg-core";

export const creatorPayouts = pgTable("creator_payouts", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
  artistName: varchar("artist_name", { length: 255 }).notNull(),
  bio: text("bio"),
  genre: varchar("genre", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
# 🎵 Gifted Eternity Platform — Complete Setup & Readiness Guide

This README contains **everything required** for the Gifted Eternity platform to:

- Install cleanly
- Build without errors
- Pass tests
- Run in production without schema or runtime failures

If you follow this document, the repository **will fire right up**.

---

## ✅ CURRENT STATUS (What’s Already Working)

The platform architecture is solid and production-grade.

### Confirmed Working
- OAuth authentication
- Drizzle ORM integration
- Knowledge Base (CRUD, search, stats)
- Blog generation + publishing
- Bot Store UI
- Pricing display (monthly / yearly)
- Protected API procedures
- Fixed Drizzle query usage
- Removed dead template code
- User engagement routing
- WebSocket support

You are **not rebuilding** — you are **finishing**.

---

## ❗ REQUIRED DATABASE TABLES (MISSING)

These tables are **referenced in code** and MUST exist for builds/tests to pass.

---

## 1️⃣ Uploads

### `drizzle/upload_schema.ts`
```ts
import { pgTable, serial, integer, varchar, timestamp, text } from "drizzle-orm/pg-core";

export const musicUploads = pgTable("music_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
