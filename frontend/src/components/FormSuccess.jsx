import { useState, useEffect } from 'react'
import { analyzeSleepData } from '../services/api'

const FormSuccess = ({ data, onReset }) => {
  const [aiResponse, setAiResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Apelează AI când componenta se încarcă
    handleAnalyze()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Rulează doar o dată când componenta se încarcă

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await analyzeSleepData(data)
      setAiResponse(response)
    } catch (err) {
      setError(err.message || 'Eroare la analiză. Verifică dacă backend-ul rulează.')
      console.error('AI Analysis Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2)
  }

  const downloadJSON = () => {
    const jsonStr = formatJSON(data)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sleep-data-${data.date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Formular trimis cu succes!
        </h2>
        <p className="text-gray-600">
          Datele au fost înregistrate. Poți descărca JSON-ul sau continua.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Date înregistrate:
          </h3>
          <button
            onClick={downloadJSON}
            className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Descarcă JSON
          </button>
        </div>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
          {formatJSON(data)}
        </pre>
      </div>

      {/* AI Analysis Section */}
      <div className="mt-6 border-t pt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Analiză AI - Recomandări Somnolog
        </h3>

        {loading && (
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-700">
              Analizez datele de somn... Acest proces poate dura câteva secunde.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-red-800 mb-1">Eroare la analiză AI</p>
                <p className="text-sm text-red-700 mb-2">{error}</p>
                {error.includes('quota') || error.includes('billing') ? (
                  <div className="bg-red-100 rounded p-2 mb-2">
                    <p className="text-xs text-red-800 font-medium mb-1">
                      ⚠️ Problemă cu creditul OpenAI:
                    </p>
                    <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                      <li>Verifică creditul la: <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/account/billing</a></li>
                      <li>Asigură-te că ai adăugat o metodă de plată</li>
                      <li>Verifică că cheia API este validă</li>
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-red-600">
                    Verifică că backend-ul rulează pe portul 8000
                  </p>
                )}
                <button
                  onClick={handleAnalyze}
                  className="mt-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Încearcă din nou
                </button>
              </div>
            </div>
          </div>
        )}

        {aiResponse && !loading && (
          <div className="space-y-4">
            {/* Analiză Generală */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Analiză Generală
              </h4>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {aiResponse.analysis}
              </div>
            </div>

            {/* Recomandări */}
            {aiResponse.recommendations && aiResponse.recommendations.length > 0 && (
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Recomandări
                </h4>
                <ul className="space-y-2">
                  {aiResponse.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preocupări */}
            {aiResponse.concerns && aiResponse.concerns.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Observații Importante
                </h4>
                <ul className="space-y-2">
                  {aiResponse.concerns.map((concern, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-1">⚠</span>
                      <span className="text-gray-700">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Puncte Pozitive */}
            {aiResponse.positive_notes && aiResponse.positive_notes.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Ce Funcționează Bine
                </h4>
                <ul className="space-y-2">
                  {aiResponse.positive_notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-1">✓</span>
                      <span className="text-gray-700">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <button onClick={onReset} className="btn-primary flex-1">
          Completează alt formular
        </button>
        <button
          onClick={downloadJSON}
          className="btn-secondary flex-1"
        >
          Descarcă JSON
        </button>
      </div>
    </div>
  )
}

export default FormSuccess
