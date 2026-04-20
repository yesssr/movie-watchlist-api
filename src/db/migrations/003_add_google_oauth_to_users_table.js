export async function up(knex) {
  await knex.schema.alterTable("users", function (table) {
    table.string("oauth_provider", 50).nullable();
    table.string("google_id", 255).nullable().unique();
    table.string("avatar_url", 1024).nullable();
  });

  await knex.raw("ALTER TABLE users ALTER COLUMN password DROP NOT NULL");
}

export async function down(knex) {
  await knex("users").whereNull("password").update({
    password: "GOOGLE_OAUTH_USER",
  });

  await knex.raw("ALTER TABLE users ALTER COLUMN password SET NOT NULL");

  await knex.schema.alterTable("users", function (table) {
    table.dropColumn("avatar_url");
    table.dropColumn("google_id");
    table.dropColumn("oauth_provider");
  });
}
