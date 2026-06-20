-- CreateEnum
CREATE TYPE "SiteCategory" AS ENUM ('DEVELOPMENT', 'PROJECT_MANAGEMENT', 'DESIGN', 'COMMUNICATION', 'DOCUMENTATION', 'TESTING', 'DEPLOYMENT', 'ANALYTICS', 'OTHER');

-- AlterTable
ALTER TABLE "CalendarNote" ADD COLUMN     "siteId" TEXT;

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "category" "SiteCategory" NOT NULL DEFAULT 'DEVELOPMENT',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Site_userId_idx" ON "Site"("userId");

-- CreateIndex
CREATE INDEX "Site_category_idx" ON "Site"("category");

-- CreateIndex
CREATE INDEX "CalendarNote_siteId_idx" ON "CalendarNote"("siteId");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarNote" ADD CONSTRAINT "CalendarNote_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
