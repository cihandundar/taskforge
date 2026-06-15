-- CreateTable
CREATE TABLE "CalendarNote" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarNote_date_idx" ON "CalendarNote"("date");

-- CreateIndex
CREATE INDEX "CalendarNote_userId_idx" ON "CalendarNote"("userId");

-- AddForeignKey
ALTER TABLE "CalendarNote" ADD CONSTRAINT "CalendarNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
