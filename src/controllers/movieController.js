import Movie from "../models/Movie.js";
import TMDbService from "../services/tmdb.js";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../middleware/error.js";

class MovieController {
  static async getAllMovies(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, genre, search } = req.query;

      // Build filters
      const filters = {};
      if (status) {
        if (!["want_to_watch", "watching", "watched"].includes(status)) {
          throw new ValidationError(
            "Invalid status. Must be: want_to_watch, watching, or watched",
          );
        }
        filters.status = status;
      }

      if (genre) {
        filters.genre = genre;
      }

      if (search) {
        filters.search = search;
      }

      const movies = await Movie.findAllByUserId(userId, filters);

      res.json({
        success: true,
        message: "Movies retrieved successfully",
        data: {
          movies,
          count: movies.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMovieById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const movie = await Movie.findByIdAndUserId(id, userId);

      if (!movie) {
        throw new NotFoundError("Movie not found");
      }

      res.json({
        success: true,
        message: "Movie retrieved successfully",
        data: {
          movie,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createMovie(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        title,
        genre,
        status = "want_to_watch",
        rating,
        review,
      } = req.body;

      // Validate required fields
      if (!title || title.trim().length === 0) {
        throw new ValidationError("Movie title is required");
      }

      // Validate status
      if (!["want_to_watch", "watching", "watched"].includes(status)) {
        throw new ValidationError(
          "Invalid status. Must be: want_to_watch, watching, or watched",
        );
      }

      // Validate rating if provided
      if (rating !== undefined) {
        if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
          throw new ValidationError(
            "Rating must be an integer between 1 and 10",
          );
        }
      }

      // Check for duplicate movie
      const existingMovie = await Movie.findDuplicateByTitle(
        userId,
        title.trim(),
      );
      if (existingMovie) {
        throw new ValidationError(
          `Movie "${title.trim()}" already exists in your watchlist`,
        );
      }

      // Try to fetch poster from TMDB
      let posterUrl = null;
      try {
        posterUrl = await TMDbService.getPosterUrl(title.trim());
        console.log(`Poster URL for "${title}": ${posterUrl}`);
      } catch (tmdbError) {
        console.warn("Failed to fetch poster from TMDB:", tmdbError.message);
        // Continue without poster - it's not critical
      }

      // Create movie
      const movieData = {
        user_id: userId,
        title: title.trim(),
        genre: genre ? genre.trim() : null,
        status,
        rating: rating || null,
        review: review ? review.trim() : null,
        poster_url: posterUrl,
      };

      const newMovie = await Movie.create(movieData);

      res.status(201).json({
        success: true,
        message: "Movie added successfully",
        data: {
          movie: newMovie,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMovie(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, genre, status, rating, review } = req.body;

      // Check if movie exists and belongs to user
      const existingMovie = await Movie.findByIdAndUserId(id, userId);
      if (!existingMovie) {
        throw new NotFoundError("Movie not found");
      }

      // Prepare update data
      const updateData = {};

      if (title !== undefined) {
        if (!title || title.trim().length === 0) {
          throw new ValidationError("Movie title cannot be empty");
        }

        // Check for duplicate movie (excluding current movie)
        const duplicateMovie = await Movie.findDuplicateByTitle(
          userId,
          title.trim(),
          id,
        );
        if (duplicateMovie) {
          throw new ValidationError(
            `Movie "${title.trim()}" already exists in your watchlist`,
          );
        }

        updateData.title = title.trim();

        // If title is changing, try to get new poster
        if (title.trim().toLowerCase() !== existingMovie.title.toLowerCase()) {
          try {
            const newPosterUrl = await TMDbService.getPosterUrl(title.trim());
            if (newPosterUrl) {
              updateData.poster_url = newPosterUrl;
            }
          } catch (tmdbError) {
            console.warn(
              "Failed to fetch new poster from TMDB:",
              tmdbError.message,
            );
          }
        }
      }

      if (genre !== undefined) {
        updateData.genre = genre ? genre.trim() : null;
      }

      if (status !== undefined) {
        if (!["want_to_watch", "watching", "watched"].includes(status)) {
          throw new ValidationError(
            "Invalid status. Must be: want_to_watch, watching, or watched",
          );
        }
        updateData.status = status;
      }

      if (rating !== undefined) {
        if (rating === null || rating === "") {
          updateData.rating = null;
        } else {
          if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
            throw new ValidationError(
              "Rating must be an integer between 1 and 10",
            );
          }
          updateData.rating = rating;
        }
      }

      if (review !== undefined) {
        updateData.review = review ? review.trim() : null;
      }

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError("No valid fields provided for update");
      }

      // Update movie
      const updatedMovie = await Movie.updateById(id, userId, updateData);

      if (!updatedMovie) {
        throw new NotFoundError("Movie not found or could not be updated");
      }

      res.json({
        success: true,
        message: "Movie updated successfully",
        data: {
          movie: updatedMovie,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMovie(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if movie exists and belongs to user
      const existingMovie = await Movie.findByIdAndUserId(id, userId);
      if (!existingMovie) {
        throw new NotFoundError("Movie not found");
      }

      const deleted = await Movie.deleteById(id, userId);

      if (!deleted) {
        throw new NotFoundError("Movie not found or could not be deleted");
      }

      res.json({
        success: true,
        message: "Movie deleted successfully",
        data: {
          deletedMovie: {
            id: existingMovie.id,
            title: existingMovie.title,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMovieStats(req, res, next) {
    try {
      const userId = req.user.id;

      const stats = await Movie.getStatsByUserId(userId);

      res.json({
        success: true,
        message: "Movie statistics retrieved successfully",
        data: {
          stats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGenres(req, res, next) {
    try {
      const userId = req.user.id;

      const userGenres = await Movie.getGenresByUserId(userId);

      // Get TMDB genres as suggestions
      let tmdbGenres = [];
      try {
        const tmdbGenreList = await TMDbService.getGenres();
        tmdbGenres = tmdbGenreList.map((genre) => genre.name);
      } catch (error) {
        console.warn("Failed to fetch TMDB genres:", error.message);
      }

      res.json({
        success: true,
        message: "Genres retrieved successfully",
        data: {
          userGenres,
          suggestedGenres: tmdbGenres,
          totalUserGenres: userGenres.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async searchTMDb(req, res, next) {
    try {
      const { query } = req.query;

      if (!query || query.trim().length === 0) {
        throw new ValidationError("Search query is required");
      }

      const searchResults = await TMDbService.searchMovies(query.trim());

      if (!searchResults) {
        return res.json({
          success: true,
          message: "TMDB service not available",
          data: {
            results: [],
            total_results: 0,
          },
        });
      }

      // Format results
      const formattedResults = searchResults.results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        overview: movie.overview,
        poster_url: movie.poster_path
          ? `${process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/w500"}${movie.poster_path}`
          : null,
        vote_average: movie.vote_average,
        genre_ids: movie.genre_ids,
      }));

      res.json({
        success: true,
        message: "TMDB search completed successfully",
        data: {
          results: formattedResults,
          total_results: searchResults.total_results,
          total_pages: searchResults.total_pages,
          page: searchResults.page,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshPoster(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if movie exists and belongs to user
      const existingMovie = await Movie.findByIdAndUserId(id, userId);
      if (!existingMovie) {
        throw new NotFoundError("Movie not found");
      }

      // Try to fetch new poster from TMDB
      let posterUrl = null;
      try {
        posterUrl = await TMDbService.getPosterUrl(existingMovie.title);
      } catch (tmdbError) {
        throw new ValidationError(
          "Failed to fetch poster from TMDB: " + tmdbError.message,
        );
      }

      if (!posterUrl) {
        return res.json({
          success: false,
          message: "No poster found for this movie",
          data: {
            movie: existingMovie,
          },
        });
      }

      // Update movie with new poster
      const updatedMovie = await Movie.updateById(id, userId, {
        poster_url: posterUrl,
      });

      res.json({
        success: true,
        message: "Poster refreshed successfully",
        data: {
          movie: updatedMovie,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default MovieController;
