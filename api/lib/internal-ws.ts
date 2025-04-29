
import { WebSocket } from "ws"

export class InternalWebSocket {
  constructor(readonly ws: WebSocket) { }

  async sendMessage (message: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve) => {
      const messageString = JSON.stringify(message)
      const messageBuffer = Buffer.from(messageString)
      this.ws.send(messageBuffer, (err) => {
        if (err) {
          console.error("Error sending message:", err)
          return resolve(false)
        }

        resolve(true)
      })
    })
  }
}
