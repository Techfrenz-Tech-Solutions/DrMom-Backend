-- New table only. No changes to existing tables/columns, no data loss.

CREATE TABLE "public"."UserIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserIdentity_provider_providerUserId_key" ON "public"."UserIdentity"("provider", "providerUserId");

CREATE INDEX "UserIdentity_userId_idx" ON "public"."UserIdentity"("userId");

ALTER TABLE "public"."UserIdentity" ADD CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
