export function up(knex) {
  return knex.schema.createTable("movies", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("title", 255).notNullable();
    table.string("genre", 100);
    table
      .enu("status", ["want_to_watch", "watching", "watched"])
      .notNullable()
      .defaultTo("want_to_watch");
    table.integer("rating").checkBetween([1, 10]);
    table.text("review");
    table.string("poster_url", 500);
    table.timestamps(true, true);

    // Indexes
    table.index(["user_id"]);
    table.index(["status"]);
    table.index(["user_id", "status"]);
    table.index(["title"]);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("movies");
}
