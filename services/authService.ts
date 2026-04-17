import { API_URL } from "../config/api";

// ── Types ──────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  website?: string;
  isOnline?: boolean;
  lastSeen?: string;
  pushToken?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
// ──────────────────────────────────────────────────────────────────────────

class AuthService {
  private getAuthHeaders(token: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Log in via C# Backend → POST /api/Auth/login
   */
  public async login(credentials: LoginPayload): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    return response.json();
  }

  /**
   * Register via C# Backend → POST /api/Auth/register
   */
  public async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/Auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Registration failed");
    }

    return response.json();
  }

  /**
   * Fetch all users → GET /api/Users
   */
  public async getUsers(token: string): Promise<UserProfile[]> {
    const response = await fetch(`${API_URL}/Users`, {
      headers: this.getAuthHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
  }

  /**
   * Search for users → GET /api/Users/search?query=...
   */
  public async searchUsers(query: string, token: string): Promise<UserProfile[]> {
    const response = await fetch(
      `${API_URL}/Users/search?query=${encodeURIComponent(query)}`,
      { headers: this.getAuthHeaders(token) }
    );
    if (!response.ok) throw new Error("Search failed");
    return response.json();
  }
}

export const authService = new AuthService();
