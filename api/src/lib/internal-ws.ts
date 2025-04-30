
import { WebSocket } from "ws"
import { logger } from "./logger"

export class InternalWebSocket {
  constructor(readonly ws: WebSocket) { }

  async sendMessage (message: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve) => {
      const messageString = JSON.stringify(message)
      const messageBuffer = Buffer.from(messageString)
      this.ws.send(messageBuffer, (err) => {
        if (err) {
          logger.error("Error sending message:", err)
          return resolve(false)
        }

        resolve(true)
      })
    })
  }
}
