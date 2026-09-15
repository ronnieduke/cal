/**
 * One-off self-host helper: creates a Team and OWNER Membership for a user,
 * which is all the `hasTeamPlan` checks look for (this fork has no Teams UI).
 *
 * Usage (from repo root, with DATABASE_URL pointing at the cal database):
 *   node scripts/create-team-selfhost.mjs your@email.com
 *
 * Idempotent: re-running updates rather than duplicates.
 */
import pg from "pg";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/create-team-selfhost.mjs <user-email>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const TEAM_NAME = "Ronnie Duke";
const TEAM_SLUG = "ronnie-duke";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const userRes = await client.query(`SELECT id, email FROM users WHERE lower(email) = lower($1)`, [
    email,
  ]);
  if (userRes.rows.length === 0) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }
  const user = userRes.rows[0];

  let teamRes = await client.query(`SELECT id FROM "Team" WHERE slug = $1`, [TEAM_SLUG]);
  let teamId;
  if (teamRes.rows.length === 0) {
    teamRes = await client.query(`INSERT INTO "Team" (name, slug) VALUES ($1, $2) RETURNING id`, [
      TEAM_NAME,
      TEAM_SLUG,
    ]);
    teamId = teamRes.rows[0].id;
    console.log(`Created team ${TEAM_SLUG} (id ${teamId})`);
  } else {
    teamId = teamRes.rows[0].id;
    console.log(`Team ${TEAM_SLUG} already exists (id ${teamId})`);
  }

  const memberRes = await client.query(
    `SELECT id FROM "Membership" WHERE "userId" = $1 AND "teamId" = $2`,
    [user.id, teamId]
  );
  if (memberRes.rows.length === 0) {
    await client.query(
      `INSERT INTO "Membership" ("teamId", "userId", accepted, role, "createdAt", "updatedAt")
       VALUES ($1, $2, true, 'OWNER'::"MembershipRole", NOW(), NOW())`,
      [teamId, user.id]
    );
    console.log(`Added ${user.email} as OWNER of team ${teamId}`);
  } else {
    await client.query(
      `UPDATE "Membership" SET accepted = true, role = 'OWNER'::"MembershipRole", "updatedAt" = NOW()
       WHERE id = $1`,
      [memberRes.rows[0].id]
    );
    console.log(`Membership already existed - ensured OWNER + accepted for ${user.email}`);
  }

  console.log("Done. The record button gate (hasTeamPlan) is now satisfied.");
} finally {
  await client.end();
}
