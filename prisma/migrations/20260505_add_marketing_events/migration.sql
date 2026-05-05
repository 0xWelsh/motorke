-- CreateTable
CREATE TABLE "marketing_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "source" TEXT,
    "payload" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_events_createdAt_idx" ON "marketing_events"("createdAt");

-- CreateIndex
CREATE INDEX "marketing_events_name_createdAt_idx" ON "marketing_events"("name", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_events_userId_createdAt_idx" ON "marketing_events"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "marketing_events" ADD CONSTRAINT "marketing_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
