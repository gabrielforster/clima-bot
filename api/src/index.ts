
import express, { Request, Response } from "express"
import helmet from "helmet"
import cors from "cors"

import { chatController } from "./controllers/chat.controller"

const app = express()
const PORT = process.env.PORT ?? "3000"

app.use(cors())
app.use(express.json())
app.use(helmet())

app.use((req: Request, res: Response, next) => {
  const start = Date.now()
  res.on("finish", () => {
    const duration = Date.now() - start
    console.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`)
  })
  next()
})

app.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({ status: "ok", message: "Server is healthy" })
})

app.use("/chat", chatController)

app.listen(PORT, () => console.info("server running"))
