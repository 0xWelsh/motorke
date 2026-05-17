-- CreateTable
CREATE TABLE "duty_vehicles" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "year" INTEGER NOT NULL,
    "engineCC" INTEGER NOT NULL,
    "fuelType" "FuelType" NOT NULL DEFAULT 'PETROL',
    "bodyType" "BodyType",
    "crspKes" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT DEFAULT 'seed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duty_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duty_calculations" (
    "id" TEXT NOT NULL,
    "dutyVehicleId" TEXT,
    "searchQuery" TEXT,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "engineCC" INTEGER,
    "fuelType" "FuelType",
    "crspKes" INTEGER,
    "totalKes" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "sessionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duty_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "duty_vehicles_slug_key" ON "duty_vehicles"("slug");

-- CreateIndex
CREATE INDEX "duty_vehicles_make_model_idx" ON "duty_vehicles"("make", "model");

-- CreateIndex
CREATE INDEX "duty_vehicles_year_idx" ON "duty_vehicles"("year");

-- CreateIndex
CREATE INDEX "duty_vehicles_active_idx" ON "duty_vehicles"("active");

-- CreateIndex
CREATE INDEX "duty_calculations_createdAt_idx" ON "duty_calculations"("createdAt");

-- CreateIndex
CREATE INDEX "duty_calculations_dutyVehicleId_idx" ON "duty_calculations"("dutyVehicleId");

-- CreateIndex
CREATE INDEX "duty_calculations_make_model_idx" ON "duty_calculations"("make", "model");

-- AddForeignKey
ALTER TABLE "duty_calculations" ADD CONSTRAINT "duty_calculations_dutyVehicleId_fkey" FOREIGN KEY ("dutyVehicleId") REFERENCES "duty_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
