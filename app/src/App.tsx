import { useState, useRef, useEffect } from "react"

type InternalMessage = {
  from: "sytem" | "user"
  content: string
  type: "text" | "answer"
  answeringId?: string
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

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  }

  const handleSendMessage = () => {
    if (ws.current && input) {
      const message: InternalMessage = {
        from: "user",
        content: input,
        type: "text",
      }
      const messageString = JSON.stringify(message);
      const messageBuffer = new TextEncoder().encode(messageString);
      ws.current.send(messageBuffer);
      setMessages([...messages, message]);
      setInput("");
    }
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

  const handleWebSocketClose = () => {
    console.log("WebSocket connection closed");
  }

  const handleWebSocketError = (error: Event) => {
    console.error("WebSocket error:", error);
  }

  const handleWebSocketMessage = (event: MessageEvent<ArrayBuffer>) => {
    const wsMessage = String.fromCharCode.apply(null, new Uint8Array(event.data));
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
      <aside className="w-1/4 bg-gray-200 p-4">

        <header>
          <button className="bg-blue-500 text-white px-4 py-2 w-full rounded-lg">
            Criar novo chat
          </button>
        </header>

        <section>
        </section>
      </aside>

      <section className="flex-1 p-4">
        <div className="bg-white shadow-md rounded-lg p-4 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4">Chat atual</h2>

          <div className="overflow-y-auto flex-1">
            {
              messages.map((message, index) => (
                <div key={index} className={`mb-4 ${message.from === "user" ? "text-right" : "text-left"}`}>
                  <div className={`inline-block p-2 rounded-lg ${message.from === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
                    {message.content}
                  </div>
                </div>
              ))
            }

            <div ref={(el) => { if (el) el.scrollIntoView({ behavior: "smooth" }) }} />
          </div>

          <textarea
            placeholder="Digite sua mensagem..."
            className="w-full p-2 border border-gray-300 rounded-lg mt-4 resize-none"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>
      </section>
    </main>
  )
}
