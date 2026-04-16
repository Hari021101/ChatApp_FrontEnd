import { API_URL } from "../config/api";

export interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

class AuthService {
  private getAuthHeaders(token?: string | null) {
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Log in via C# Backend
   */
  public async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_URL}/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    return await response.json();
  }

  /**
   * Register via C# Backend
   */
  public async registerNew(userData: any) {
    const response = await fetch(`${API_URL}/Auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Registration failed");
    }

    return await response.json();
  }

  /**
   * Fetch all users
   */
  public async getUsers(token: string) {
    try {
      const response = await fetch(`${API_URL}/Users`, {
        headers: this.getAuthHeaders(token),
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return await response.json();
    } catch (error) {
      console.error("AuthService GetUsers Error:", error);
      throw error;
    }
  }

  /**
   * Search for users
   */
  public async searchUsers(query: string, token: string) {
    try {
      const response = await fetch(`${API_URL}/Users/search?query=${encodeURIComponent(query)}`, {
        headers: this.getAuthHeaders(token),
      });
      if (!response.ok) throw new Error("Search failed");
      return await response.json();
    } catch (error) {
      console.error("AuthService Search Error:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
