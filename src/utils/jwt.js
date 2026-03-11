import jwt from "jsonwebtoken";

class JWTUtil {
  static generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      issuer: "movie-watchlist-app",
    });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      issuer: "movie-watchlist-app",
    });
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid or expired access token");
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  static generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
    };
  }

  static decodeToken(token) {
    return jwt.decode(token);
  }

  static getTokenExpirationTime(token) {
    const decoded = this.decodeToken(token);
    return decoded ? new Date(decoded.exp * 1000) : null;
  }

  static isTokenExpired(token) {
    const expirationTime = this.getTokenExpirationTime(token);
    return expirationTime ? expirationTime < new Date() : true;
  }
}

export default JWTUtil;
