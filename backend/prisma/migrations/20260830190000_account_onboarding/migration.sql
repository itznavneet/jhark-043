ALTER TABLE "User"
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mustCompleteProfile" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "RegistrationApplication_one_pending_per_applicant_target_idx"
ON "RegistrationApplication"("applicantUserId", "targetType")
WHERE "status" = 'PENDING';
