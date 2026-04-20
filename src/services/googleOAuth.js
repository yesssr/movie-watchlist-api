import axios from "axios";
import { ValidationError } from "../middleware/error.js";

const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

class GoogleOAuthService {
  static validateConfig() {
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_CALLBACK_URL
    ) {
      throw new ValidationError(
        "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL"
      );
    }
  }

  static getAuthorizationUrl(state) {
    this.validateConfig();

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `${GOOGLE_AUTH_BASE_URL}?${params.toString()}`;
  }

  static async exchangeCodeForTokens(code) {
    this.validateConfig();

    const payload = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    });

    const { data } = await axios.post(GOOGLE_TOKEN_URL, payload.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return data;
  }

  static async getUserInfo(accessToken) {
    const { data } = await axios.get(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return data;
  }
}

export default GoogleOAuthService;
