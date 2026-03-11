import db from "../db/index.js";

class Movie {
  static async create({
    user_id,
    title,
    genre,
    status = "want_to_watch",
    rating,
    review,
    poster_url,
  }) {
    const [movie] = await db("movies")
      .insert({
        user_id,
        title,
        genre,
        status,
        rating,
        review,
        poster_url,
      })
      .returning("*");

    return movie;
  }

  static async findById(id) {
    const movie = await db("movies").select("*").where({ id }).first();

    return movie;
  }

  static async findByIdAndUserId(id, user_id) {
    const movie = await db("movies").select("*").where({ id, user_id }).first();

    return movie;
  }

  static async findAllByUserId(user_id, filters = {}) {
    let query = db("movies")
      .select("*")
      .where({ user_id })
      .orderBy("created_at", "desc");

    // Apply filters if provided
    if (filters.status) {
      query = query.where({ status: filters.status });
    }

    if (filters.genre) {
      query = query.where({ genre: filters.genre });
    }

    if (filters.search) {
      query = query.where("title", "ilike", `%${filters.search}%`);
    }

    const movies = await query;
    return movies;
  }

  static async updateById(id, user_id, updateData) {
    const [movie] = await db("movies")
      .where({ id, user_id })
      .update({
        ...updateData,
        updated_at: db.fn.now(),
      })
      .returning("*");

    return movie;
  }

  static async deleteById(id, user_id) {
    const deletedCount = await db("movies").where({ id, user_id }).del();

    return deletedCount > 0;
  }

  static async countByUserId(user_id, status = null) {
    let query = db("movies").where({ user_id }).count("* as total");

    if (status) {
      query = query.where({ status });
    }

    const result = await query.first();
    return parseInt(result.total);
  }

  static async getStatsByUserId(user_id) {
    const stats = await db("movies")
      .select("status")
      .count("* as count")
      .where({ user_id })
      .groupBy("status");

    const formattedStats = {
      want_to_watch: 0,
      watching: 0,
      watched: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat.status] = parseInt(stat.count);
      formattedStats.total += parseInt(stat.count);
    });

    return formattedStats;
  }

  static async findDuplicateByTitle(user_id, title, excludeId = null) {
    let query = db("movies")
      .select("id", "title")
      .where({ user_id })
      .whereRaw("LOWER(title) = LOWER(?)", [title]);

    if (excludeId) {
      query = query.whereNot({ id: excludeId });
    }

    const movie = await query.first();
    return movie;
  }

  static async getGenresByUserId(user_id) {
    const genres = await db("movies")
      .distinct("genre")
      .where({ user_id })
      .whereNotNull("genre")
      .where("genre", "!=", "")
      .orderBy("genre");

    return genres.map((g) => g.genre);
  }
}

export default Movie;
