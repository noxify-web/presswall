import type { Session } from "@shopify/shopify-api";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/src/db";
import { sessions } from "@/src/db/schema";

function rowToSession(row: typeof sessions.$inferSelect): Session {
  return {
    id: row.id,
    shop: row.shop,
    state: row.state,
    isOnline: row.isOnline,
    scope: row.scope ?? undefined,
    expires: row.expires ? new Date(row.expires) : undefined,
    accessToken: row.accessToken,
    onlineAccessInfo: row.userId
      ? {
          expires_in: 0,
          associated_user_scope: row.scope ?? "",
          associated_user: {
            id: Number.parseInt(row.userId, 10) || 0,
            first_name: row.firstName ?? "",
            last_name: row.lastName ?? "",
            email: row.email ?? "",
            account_owner: row.accountOwner ?? false,
            locale: row.locale ?? "en",
            collaborator: row.collaborator ?? false,
            email_verified: row.emailVerified ?? false,
          },
        }
      : undefined,
  } as Session;
}

function sessionToRow(session: Session): typeof sessions.$inferInsert {
  const onlineInfo = session.onlineAccessInfo?.associated_user;

  return {
    id: session.id,
    shop: session.shop,
    state: session.state,
    isOnline: session.isOnline ?? false,
    scope: session.scope ?? null,
    expires: session.expires?.toISOString() ?? null,
    accessToken: session.accessToken ?? "",
    userId: onlineInfo?.id ? String(onlineInfo.id) : null,
    firstName: onlineInfo?.first_name ?? null,
    lastName: onlineInfo?.last_name ?? null,
    email: onlineInfo?.email ?? null,
    accountOwner: onlineInfo?.account_owner ?? null,
    locale: onlineInfo?.locale ?? null,
    collaborator: onlineInfo?.collaborator ?? null,
    emailVerified: onlineInfo?.email_verified ?? null,
    refreshToken: null,
    refreshTokenExpires: null,
  };
}

export const sessionStorage = {
  async storeSession(session: Session): Promise<boolean> {
    const row = sessionToRow(session);
    await db.insert(sessions).values(row).onConflictDoUpdate({
      target: sessions.id,
      set: row,
    });
    return true;
  },

  async loadSession(id: string): Promise<Session | undefined> {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    const row = rows[0];
    return row ? rowToSession(row) : undefined;
  },

  async deleteSession(id: string): Promise<boolean> {
    await db.delete(sessions).where(eq(sessions.id, id));
    return true;
  },

  async deleteSessions(ids: string[]): Promise<boolean> {
    if (ids.length === 0) {
      return true;
    }

    await db.delete(sessions).where(inArray(sessions.id, ids));
    return true;
  },

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.shop, shop));
    return rows.map(rowToSession);
  },
};
