/*
  Warnings:

  - Added the required column `barbeiroId` to the `Fila` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Fila" ADD COLUMN     "barbeiroId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Fila" ADD CONSTRAINT "Fila_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
