import { useState, useEffect } from 'react'
import { askQuestion } from '../services/api'
import AnswerDisplay from './AnswerDisplay'

const QuestionForm = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showFinalAnswer, setShowFinalAnswer] = useState(false)

  const questions = [
    {
      id: "age",
      question: "Câte luni are copilul?",
      type: "number",
      placeholder: "ex: 18",
      validation: { min: 0, max: 48 }
    },
    {
      id: "numberOfNaps",
      question: "Câte somnuri are copilul pe zi?",
      type: "number",
      placeholder: "ex: 2",
      validation: { min: 0, max: 6 }
    },
    {
      id: "sleepsWith",
      question: "Cu cine adoarme copilul?",
      type: "text",
      placeholder: "ex: singur, cu părinții, cu bunica, etc."
    },
    {
      id: "routine",
      question: "Care este rutina de culcare? Descrie activitățile în ordine.",
      type: "textarea",
      placeholder: "ex: baie, masaj, poveste, cântec, lumină stinsă"
    },
    {
      id: "routineConsistent",
      question: "Este rutina la fel zilnic sau variază?",
      type: "select",
      options: ["La fel zilnic", "Variază", "Parțial consistentă"]
    },
    {
      id: "wakesAtNight",
      question: "Se trezește copilul noaptea? Dacă da, de câte ori și cum reacționează?",
      type: "textarea",
      placeholder: "ex: se trezește de 3-4 ori, plânge, cere lapte, etc."
    },
    {
      id: "goesOutside",
      question: "Iese copilul afară pe timpul zilei? Dacă da, cât timp?",
      type: "text",
      placeholder: "ex: da, 1-2 ore pe zi"
    },
    {
      id: "eatingBeforeSleep",
      question: "Cu cât timp înainte de somn mănâncă copilul?",
      type: "text",
      placeholder: "ex: 30 minute, 1 oră, etc."
    },
    {
      id: "screenTime",
      question: "Se uită copilul la ecrane (TV, tabletă, telefon) înainte de culcare? Dacă da, cât timp?",
      type: "text",
      placeholder: "ex: da, 30 minute sau nu"
    },
    {
      id: "loudMusic",
      question: "Ascultă muzică tare în casă înainte sau în timpul culcării?",
      type: "text",
      placeholder: "ex: da, muzică tare sau nu"
    }
  ]

  const [currentAnswer, setCurrentAnswer] = useState('')

  const handleAnswerChange = (value) => {
    setCurrentAnswer(value)
  }

  const handleNext = () => {
    if (!currentAnswer.trim()) {
      setError('Te rog completează răspunsul')
      return
    }

    // Validare pentru număr
    const currentQ = questions[currentQuestionIndex]
    if (currentQ.type === 'number') {
      const num = parseInt(currentAnswer)
      if (isNaN(num) || num < currentQ.validation.min || num > currentQ.validation.max) {
        setError(`Te rog introdu un număr între ${currentQ.validation.min} și ${currentQ.validation.max}`)
        return
      }
    }

    setError(null)
    setAnswers({
      ...answers,
      [currentQ.id]: currentAnswer
    })

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentAnswer('')
    } else {
      // Toate întrebările au fost răspunse, trimite la backend
      handleSubmitAll()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      const prevQ = questions[currentQuestionIndex - 1]
      setCurrentAnswer(answers[prevQ.id] || '')
      setError(null)
    }
  }

  const handleSubmitAll = async () => {
    setLoading(true)
    setError(null)

    try {
      // Construiește întrebarea completă cu toate răspunsurile
      const fullQuestion = `Copilul are ${answers.age} luni. Are ${answers.numberOfNaps} somnuri pe zi. Adoarme ${answers.sleepsWith}. Rutina de culcare: ${answers.routine}. Rutina este ${answers.routineConsistent}. ${answers.wakesAtNight ? `Se trezește noaptea: ${answers.wakesAtNight}.` : ''} ${answers.goesOutside ? `Iese afară: ${answers.goesOutside}.` : ''} ${answers.eatingBeforeSleep ? `Mănâncă cu ${answers.eatingBeforeSleep} înainte de somn.` : ''} ${answers.screenTime ? `Ecrane: ${answers.screenTime}.` : ''} ${answers.loudMusic ? `Muzică: ${answers.loudMusic}.` : ''} Ce recomandări ai pentru îmbunătățirea somnului?`
      
      const response = await askQuestion(fullQuestion, answers)
      setAnswer(response.answer)
      setShowFinalAnswer(true)
    } catch (err) {
      setError(err.message || 'Eroare la trimiterea întrebării. Verifică dacă backend-ul rulează și dacă API key-ul Gemini este configurat.')
      console.error('Question error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentQuestionIndex(0)
    setAnswers({})
    setCurrentAnswer('')
    setAnswer('')
    setShowFinalAnswer(false)
    setError(null)
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Restaurează răspunsul dacă există
  useEffect(() => {
    if (currentQuestion && answers[currentQuestion.id]) {
      setCurrentAnswer(answers[currentQuestion.id])
    } else {
      setCurrentAnswer('')
    }
  }, [currentQuestionIndex])

  if (showFinalAnswer) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Răspuns Expert
          </h2>
          <p className="text-gray-600">
            Iată recomandările personalizate pentru copilul tău
          </p>
        </div>

        <div className="mb-6">
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <svg
                className="w-6 h-6 text-blue-600 mr-2"
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
              Analiză și Recomandări
            </h3>
          </div>
          <AnswerDisplay answer={answer} />
        </div>

        <button
          onClick={handleReset}
          className="btn-primary w-full"
        >
          Întreabă din nou
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Întreabă un Somnolog
        </h2>
        <p className="text-gray-600 mb-4">
          Completează următoarele întrebări pentru a primi recomandări personalizate
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 text-center">
          Întrebare {currentQuestionIndex + 1} din {questions.length}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="answer" className="label text-lg">
            {currentQuestion.question}
          </label>
          
          {currentQuestion.type === 'select' ? (
            <select
              id="answer"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="input-field"
              disabled={loading}
            >
              <option value="">Selectează...</option>
              {currentQuestion.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : currentQuestion.type === 'textarea' ? (
            <textarea
              id="answer"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={4}
              className="input-field resize-none"
              disabled={loading}
            />
          ) : (
            <input
              id="answer"
              type={currentQuestion.type}
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="input-field"
              disabled={loading}
              min={currentQuestion.validation?.min}
              max={currentQuestion.validation?.max}
            />
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 mr-2"
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
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {currentQuestionIndex > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              ← Înapoi
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={loading || !currentAnswer.trim()}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Se procesează...
              </span>
            ) : currentQuestionIndex === questions.length - 1 ? (
              'Trimite și primește răspuns'
            ) : (
              'Următorul →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionForm
