-- migration_v5: Google Calendar OAuth + Appointments
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "googleAccessToken"      TEXT,
  ADD COLUMN IF NOT EXISTS "googleRefreshToken"     TEXT,
  ADD COLUMN IF NOT EXISTS "googleTokenExpiry"      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "googleCalendarConnected" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "Appointment" (
  "id"            TEXT        NOT NULL,
  "userId"        TEXT        NOT NULL,
  "title"         TEXT        NOT NULL,
  "description"   TEXT,
  "location"      TEXT,
  "startAt"       TIMESTAMPTZ NOT NULL,
  "endAt"         TIMESTAMPTZ,
  "allDay"        BOOLEAN     NOT NULL DEFAULT false,
  "color"         TEXT        DEFAULT '#60a5fa',
  "googleEventId" TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
