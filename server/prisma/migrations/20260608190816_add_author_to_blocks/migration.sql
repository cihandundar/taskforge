-- AlterTable
ALTER TABLE "Block" ADD COLUMN     "authorId" TEXT;

-- CreateIndex
CREATE INDEX "Block_authorId_idx" ON "Block"("authorId");

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
