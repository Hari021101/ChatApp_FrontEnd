import { API_URL } from "../config/api";
import { auth } from "../config/firebase";

export interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

class AuthService {
  private async getAuthHeaders() {
    const token = await auth.currentUser?.getIdToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Register a new user in the C# Backend
   */
  public async register(userData: UserProfile) {
    try {
      const response = await fetch(`${API_URL}/Users`, {
        method: "POST",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("AuthService Register Error:", error);
      throw error;
    }
  }

  /**
   * Fetch all users from the C# Backend
   */
  public async getUsers() {
    try {
      const response = await fetch(`${API_URL}/Users`, {
        headers: await this.getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return await response.json();
    } catch (error) {
      console.error("AuthService GetUsers Error:", error);
      throw error;
    }
  }
  /**
   * Search for users by name or email
   */
  public async searchUsers(query: string) {
    try {
      const response = await fetch(`${API_URL}/Users/search?query=${encodeURIComponent(query)}`, {
        headers: await this.getAuthHeaders(),
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
