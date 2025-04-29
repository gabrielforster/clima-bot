import { useState, useRef, useEffect, useMemo } from "react"
import { MousePointerClick } from "lucide-react"

import { cn } from "./lib/utils";

type InternalMessage = {
  id?: string
  from: "system" | "user"
  content: string
  type: "text" | "answer" | "question" | "error"
  answeringId?: string
  answerIdentifier?: string
  answers?: {
    identifier: string
    content: string
  }[]
}

export default function App() {
  return (
    <>
      <Chat />
    </>
  )
}

function Chat() {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [input, setInput] = useState<string>("");

  const hasError = useMemo(() => {
    return messages.some((message) => message.type === "error");
  }, [messages])

  const lastMessage = useMemo(() => {
    return messages[messages.length - 1];
  }, [messages])

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  }

  const sendMessageToWebSocket = (message: InternalMessage) => {
    if (!ws.current) {
      console.error("WebSocket connection is not open");
      return;
    }

    const messageString = JSON.stringify(message);
    const messageBuffer = new TextEncoder().encode(messageString);
    ws.current.send(messageBuffer);
    setMessages([...messages, message]);
    setInput("");
  }

  const handleSendMessage = () => {
    if (input) {
      const message: InternalMessage = {
        from: "user",
        content: input,
        type: "text",
      }
      sendMessageToWebSocket(message);
    }
  }

  const handleAnswerClick = ({ identifier, content }: { identifier: string, content: string }) => {
    const lastMessage = messages[messages.length - 1];

    const message: InternalMessage = {
      type: "answer",
      from: "user",
      content: content,
      answeringId: lastMessage.id,
      answerIdentifier: identifier,
    }

    sendMessageToWebSocket(message);
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  const handleWebSocketOpen = () => {
    console.log("WebSocket connection opened");
  }

  const handleWebSocketClose = (event: CloseEvent) => {
    if (event.reason === "connection_already_open") {
      const errorMessage: InternalMessage = {
        from: "system",
        content: "Uma conexão já está aberta. Tente novamente mais tarde.",
        type: "error",
      }
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
    console.log("WebSocket connection closed");
  }

  const handleWebSocketError = (error: Event) => {
    console.error("WebSocket error:", error);
  }

  const handleWebSocketMessage = (event: MessageEvent<ArrayBuffer>) => {
    const wsMessage = new TextDecoder().decode(event.data)
    const message: InternalMessage = JSON.parse(wsMessage);
    setMessages((prevMessages) => [...prevMessages, message]);
  }

  const connectWebSocket = () => {
    ws.current = new WebSocket("ws://localhost:3000");
    ws.current.binaryType = "arraybuffer";

    ws.current.addEventListener("open", handleWebSocketOpen);
    ws.current.addEventListener("close", handleWebSocketClose);
    ws.current.addEventListener("error", handleWebSocketError);
    ws.current.addEventListener("message", handleWebSocketMessage);
  }

  const disconnectWebSocket = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }

  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <main className="flex h-screen">
      {/*
        <aside className="w-1/4 bg-gray-200 p-4">
          <header>
            <button className="bg-blue-500 text-white px-4 py-2 w-full rounded-lg">
              Criar novo chat
            </button>
          </header>
          <section>
          </section>
        </aside>
      */}

      <section className="flex-1 p-4">
        <div className="bg-white shadow-md rounded-lg p-4 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4">Chat atual</h2>

          <div className="overflow-y-auto flex-1">
            {
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "mb-4",
                    message.from === "user" ? "text-right" : "text-left"
                  )}
                >
                  {message.answeringId && (
                    <div className="text-sm text-gray-500 mt-1">
                      Resposta para: {messages.find(m => m.id === message.answeringId)?.content}
                    </div>
                  )}
                  <div
                    className={cn(
                      "inline-block p-2 rounded-lg",
                      message.from === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black",
                      message.type === "error" ? "bg-red-400 text-white" : "",
                      message.type === "question" ? "border border-gray-300 p-4 rounded-lg shadow-sm" : ""
                    )}
                  >
                    {message.content}
                  </div>
                  {
                    message.type === "question" && message.answers && message.answers.length > 0 && (
                      <div className="mt-2">
                        {message.answers.map((answer, answerIndex) => (
                          <div
                            key={answerIndex}
                            className={cn(
                              "bg-gray-300 p-3 rounded-lg mb-2 flex items-center gap-2 hover:bg-gray-400 transition-colors",
                              lastMessage.id === message.id && "cursor-pointer"
                            )}
                            onClick={() => {
                              if (lastMessage.id !== message.id) {
                                return
                              }

                              handleAnswerClick(answer);
                            }}
                          >
                            {
                              lastMessage.id === message.id && (
                                <MousePointerClick className="text-gray-600 size-4" />
                              )
                            }
                            <span>{answer.content}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
              ))
            }

            <div ref={(el) => { if (el) el.scrollIntoView({ behavior: "smooth" }) }} />
          </div>

          <textarea
            placeholder="Digite sua mensagem..."
            className="w-full p-2 border border-gray-300 rounded-lg mt-4 resize-none"
            disabled={hasError}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>
      </section>
    </main>
  )
}

