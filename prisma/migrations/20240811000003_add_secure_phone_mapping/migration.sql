-- CreateTable
CREATE TABLE "secure_phone_mappings" (
    "id" TEXT NOT NULL,
    "anonymous_id" TEXT NOT NULL,
    "encrypted_phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "secure_phone_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "secure_phone_mappings_anonymous_id_key" ON "secure_phone_mappings"("anonymous_id");

-- CreateIndex
CREATE INDEX "secure_phone_mappings_is_active_idx" ON "secure_phone_mappings"("is_active");

-- CreateIndex
CREATE INDEX "secure_phone_mappings_created_at_idx" ON "secure_phone_mappings"("created_at");