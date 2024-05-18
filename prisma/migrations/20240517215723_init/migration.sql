/*
  Warnings:

  - You are about to drop the column `reset_password_link` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "reset_password_link";
