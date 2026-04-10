import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import { HUB_URL } from "../config/api";

class ChatHubService {
  private connection: HubConnection | null = null;

  /**
   * Initialize and start the SignalR connection
   */
  public async startConnection() {
    if (this.connection) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log("SignalR Connected! 🚀");
    } catch (err) {
      console.error("SignalR Connection Error: ", err);
      // Retry logic could go here
    }
  }

  /**
   * Listen for incoming messages
   */
  public onReceiveMessage(callback: (chatId: string, senderId: string, message: string, timestamp: string, type: string, isRead: boolean) => void) {
    this.connection?.on("ReceiveMessage", callback);
  }

  /**
   * Listen for when messages are read by other user
   */
  public onMessagesRead(callback: (chatId: string, readerId: string, readAt: string) => void) {
    this.connection?.on("MessagesRead", callback);
  }

  /**
   * Listen for user presence updates
   */
  public onPresenceUpdate(callback: (userId: string, isOnline: boolean, lastSeen: string) => void) {
    this.connection?.on("UserPresenceUpdate", callback);
  }

  /**
   * Join a specific chat group
   */
  public async joinChat(chatId: string) {
    await this.connection?.send("JoinChat", chatId);
  }

  /**
   * Send a message through the SignalR hub
   */
  public async sendMessage(chatId: string, senderId: string, content: string, type: string = "text") {
    await this.connection?.send("SendMessage", chatId, senderId, content, type);
  }

  /**
   * Mark messages as read in the backend
   */
  public async markAsRead(chatId: string) {
    await this.connection?.send("MarkAsRead", chatId);
  }

  /**
   * Get the current connection state
   */
  public getConnectionState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  /**
   * Listen for connection state changes
   */
  public onConnectionStateChange(callback: (state: HubConnectionState) => void) {
    if (!this.connection) return;
    
    this.connection.onclose(() => callback(HubConnectionState.Disconnected));
    this.connection.onreconnecting(() => callback(HubConnectionState.Reconnecting));
    this.connection.onreconnected(() => callback(HubConnectionState.Connected));
  }

  /**
   * Stop the connection
   */
  public stopConnection() {
    this.connection?.stop();
    this.connection = null;
  }
}

export const chatHub = new ChatHubService();
