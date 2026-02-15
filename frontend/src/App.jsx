import QuestionForm from './components/QuestionForm'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Somlin - Întreabă un Somnolog
          </h1>
          <p className="text-gray-600">
            Completează întrebările pentru a primi recomandări personalizate despre somnul copilului tău (0-4 ani)
          </p>
        </header>

        <QuestionForm />
      </div>
    </div>
  )
}

export default App
