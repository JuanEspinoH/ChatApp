/*
  Warnings:

  - Added the required column `test` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "test" BOOLEAN NOT NULL;
