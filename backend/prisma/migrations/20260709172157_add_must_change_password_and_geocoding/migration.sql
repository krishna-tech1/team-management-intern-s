-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkInCity" TEXT,
ADD COLUMN     "checkInCountry" TEXT,
ADD COLUMN     "checkInPostalCode" TEXT,
ADD COLUMN     "checkInState" TEXT,
ADD COLUMN     "checkOutCity" TEXT,
ADD COLUMN     "checkOutCountry" TEXT,
ADD COLUMN     "checkOutPostalCode" TEXT,
ADD COLUMN     "checkOutState" TEXT;

-- AlterTable
ALTER TABLE "GPSTracking" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
