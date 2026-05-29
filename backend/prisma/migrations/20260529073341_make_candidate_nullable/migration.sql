-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_candidateId_fkey";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "candidateId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
