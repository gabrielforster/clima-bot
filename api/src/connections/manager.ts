import { InternalWebSocket } from "../../lib/internal-ws";
import { FlowManager } from "../flows/flow-manager";
import { ChatRepository } from "../repositories/chat.repository";

export type Connection = {
  ws: InternalWebSocket;
  flowManager: FlowManager;
  chatRepo: ChatRepository;
};

export class ConnectionManager {
  private connections: Map<string, Connection> = new Map();

  addConnection(connectionId: string, connection: Connection) {
    this.connections.set(connectionId, connection);
  }

  getConnection(connectionId: string): Connection | undefined {
    return this.connections.get(connectionId);
  }

  removeConnection(connectionId: string) {
    this.connections.delete(connectionId);
  }

  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  getConnectionsCount(): number {
    return this.connections.size;
  }
}
