import axios from "axios";

class TMDbService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseUrl = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
    this.imageBaseUrl =
      process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/w500";

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      params: {
        api_key: this.apiKey,
      },
    });
  }

  async searchMovies(query, page = 1) {
    try {
      if (!this.apiKey) {
        console.warn("TMDB API key not configured");
        return null;
      }

      const response = await this.client.get("/search/movie", {
        params: {
          query: query.trim(),
          page,
          include_adult: false,
          language: "en-US",
        },
      });

      return response.data;
    } catch (error) {
      console.error("TMDB API Error:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        query,
      });
      return null;
    }
  }

  async getMovieById(movieId) {
    try {
      if (!this.apiKey) {
        console.warn("TMDB API key not configured");
        return null;
      }

      const response = await this.client.get(`/movie/${movieId}`, {
        params: {
          language: "en-US",
        },
      });

      return response.data;
    } catch (error) {
      console.error("TMDB API Error:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        movieId,
      });
      return null;
    }
  }

  async getPosterUrl(title, year = null) {
    try {
      if (!this.apiKey) {
        console.warn("TMDB API key not configured");
        return null;
      }

      // Search for the movie
      const searchQuery = year ? `${title} y:${year}` : title;
      const searchResults = await this.searchMovies(searchQuery);

      if (
        !searchResults ||
        !searchResults.results ||
        searchResults.results.length === 0
      ) {
        console.log(`No TMDB results found for: ${title}`);
        return null;
      }

      // Get the first result (most relevant)
      const movie = searchResults.results[0];

      if (!movie.poster_path) {
        console.log(`No poster found for: ${title}`);
        return null;
      }

      // Construct full poster URL
      const posterUrl = `${this.imageBaseUrl}${movie.poster_path}`;

      console.log(`Found poster for "${title}": ${posterUrl}`);
      return posterUrl;
    } catch (error) {
      console.error("Error getting poster URL:", {
        message: error.message,
        title,
        year,
      });
      return null;
    }
  }

  async getMovieDetails(title, year = null) {
    try {
      if (!this.apiKey) {
        console.warn("TMDB API key not configured");
        return null;
      }

      const searchQuery = year ? `${title} y:${year}` : title;
      const searchResults = await this.searchMovies(searchQuery);

      if (
        !searchResults ||
        !searchResults.results ||
        searchResults.results.length === 0
      ) {
        return null;
      }

      const movie = searchResults.results[0];

      return {
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title,
        overview: movie.overview,
        releaseDate: movie.release_date,
        posterPath: movie.poster_path,
        posterUrl: movie.poster_path
          ? `${this.imageBaseUrl}${movie.poster_path}`
          : null,
        backdropPath: movie.backdrop_path,
        backdropUrl: movie.backdrop_path
          ? `${this.imageBaseUrl.replace("w500", "w1280")}${movie.backdrop_path}`
          : null,
        genreIds: movie.genre_ids,
        popularity: movie.popularity,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        adult: movie.adult,
        video: movie.video,
        originalLanguage: movie.original_language,
      };
    } catch (error) {
      console.error("Error getting movie details:", {
        message: error.message,
        title,
        year,
      });
      return null;
    }
  }

  async getPopularMovies(page = 1) {
    try {
      if (!this.apiKey) {
        console.warn("TMDB API key not configured");
        return null;
      }

      const response = await this.client.get("/movie/popular", {
        params: {
          page,
          language: "en-US",
        },
      });

      return response.data;
    } catch (error) {
      console.error("TMDB API Error:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      return null;
    }
  }

  async getGenres() {
    try {
      if (!this.apiKey) {
        console.warn("TMDB API key not configured");
        return [];
      }

      const response = await this.client.get("/genre/movie/list", {
        params: {
          language: "en-US",
        },
      });

      return response.data.genres || [];
    } catch (error) {
      console.error("TMDB API Error:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      return [];
    }
  }

  // Helper method to construct image URLs
  getImageUrl(imagePath, size = "w500") {
    if (!imagePath) return null;
    return `https://image.tmdb.org/t/p/${size}${imagePath}`;
  }

  // Helper method to validate API configuration
  isConfigured() {
    return !!this.apiKey;
  }

  // Method to get configuration info
  getConfig() {
    return {
      isConfigured: this.isConfigured(),
      baseUrl: this.baseUrl,
      imageBaseUrl: this.imageBaseUrl,
      hasApiKey: !!this.apiKey,
    };
  }
}

export default new TMDbService();
