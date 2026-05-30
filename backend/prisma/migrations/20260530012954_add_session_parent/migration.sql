-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
