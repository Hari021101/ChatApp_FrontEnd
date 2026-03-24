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
  public onReceiveMessage(callback: (user: string, message: string) => void) {
    this.connection?.on("ReceiveMessage", callback);
  }

  /**
   * Send a message to the hub
   */
  public async sendMessage(user: string, message: string) {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke("SendMessage", user, message);
    } else {
      console.warn("Cannot send message: SignalR not connected.");
    }
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
