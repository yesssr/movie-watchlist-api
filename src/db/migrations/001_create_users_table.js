export function up(knex) {
  return knex.schema.createTable("users", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("username", 50).notNullable().unique();
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.timestamps(true, true);

    // Indexes
    table.index(["username"]);
    table.index(["email"]);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("users");
}
