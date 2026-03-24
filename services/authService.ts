import { API_URL } from "../config/api";

export interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

class AuthService {
  /**
   * Register a new user in the C# Backend
   */
  public async register(userData: UserProfile) {
    try {
      const response = await fetch(`${API_URL}/Users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      const response = await fetch(`${API_URL}/Users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return await response.json();
    } catch (error) {
      console.error("AuthService GetUsers Error:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
