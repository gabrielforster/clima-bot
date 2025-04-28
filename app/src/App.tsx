export default function App() {
  return (
    <>
      <Chat />
    </>
  )
}

function Chat() {
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

          </div>

          <textarea
            placeholder="Digite sua mensagem..."
            className="w-full p-2 border border-gray-300 rounded-lg mt-4 resize-none"
          />
        </div>
      </section>
    </main>
  )
}
