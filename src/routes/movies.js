import express from "express";
import MovieController from "../controllers/movieController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All movie routes require authentication
router.use(authenticateToken);

// Movie CRUD routes
router.get("/", MovieController.getAllMovies);
router.get("/stats", MovieController.getMovieStats);
router.get("/genres", MovieController.getGenres);
router.get("/search-tmdb", MovieController.searchTMDb);
router.get("/:id", MovieController.getMovieById);
router.post("/", MovieController.createMovie);
router.put("/:id", MovieController.updateMovie);
router.put("/:id/refresh-poster", MovieController.refreshPoster);
router.delete("/:id", MovieController.deleteMovie);

export default router;
