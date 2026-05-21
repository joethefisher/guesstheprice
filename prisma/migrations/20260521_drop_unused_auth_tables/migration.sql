-- Drop OAuth-pattern NextAuth tables. The app uses Credentials + JWT, which
-- looks up users directly via prisma.user — Session, Account, and
-- VerificationToken are never written to. If you add OAuth (Google, GitHub,
-- etc.) later, you'll need to re-create these via PrismaAdapter migrations.

DROP TABLE IF EXISTS "VerificationToken";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "Account";
