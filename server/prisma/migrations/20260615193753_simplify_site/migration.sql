/*
  Warnings:

  - You are about to drop the column `category` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `Site` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Site_category_idx";

-- AlterTable
ALTER TABLE "Site" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "icon";

-- DropEnum
DROP TYPE "SiteCategory";
