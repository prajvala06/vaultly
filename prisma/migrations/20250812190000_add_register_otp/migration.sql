-- AlterTable
ALTER TABLE "users" ADD COLUMN "registerOtpHash" TEXT;
ALTER TABLE "users" ADD COLUMN "registerOtpExpiresAt" TIMESTAMP(3);
