import { useState, useEffect } from 'react'
import { askQuestion } from '../services/api'
import AnswerDisplay from './AnswerDisplay'

const QuestionForm = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [answer, setAnswer] = useState('')
  const [priorities, setPriorities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showFinalAnswer, setShowFinalAnswer] = useState(false)

  const questions = [
    {
      id: "problems",
      question: "Ce problemă vrei să rezolvi? (Poți selecta mai multe)",
      type: "checkbox",
      options: [
        "Se trezește des noaptea",
        "Nu doarme suficient",
        "Adoarme greu",
        "Se trezește devreme",
        "Plânge în timpul nopții",
        "Refuză să se culce",
        "Somn fragmentat",
        "Dificultate la somnurile de zi",
        "Altele"
      ]
    },
    {
      id: "age",
      question: "Câte luni are copilul?",
      type: "select",
      options: Array.from({ length: 49 }, (_, i) => `${i} luni`)
    },
    {
      id: "numberOfNaps",
      question: "Câte somnuri are copilul pe zi?",
      type: "select",
      options: ["0", "1", "2", "3", "4", "5", "6"]
    },
    {
      id: "napDetails",
      question: "Descrie somnurile de zi (ora și durata aproximativă)",
      type: "textarea",
      placeholder: "ex: Somn 1: 10:00-11:30 (1.5 ore), Somn 2: 14:00-15:30 (1.5 ore)",
      conditional: true,
      dependsOn: "numberOfNaps",
      showIf: (answers) => parseInt(answers.numberOfNaps) > 0
    },
    {
      id: "sleepsWith",
      question: "Cu cine adoarme copilul?",
      type: "select",
      options: [
        "Singur în patul lui",
        "Cu părinții în patul părinților",
        "Cu părinții în patul copilului",
        "Cu bunica/bunicul",
        "Cu frații",
        "Altele"
      ]
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
      type: "select",
      options: [
        "Nu iese afară",
        "Da, mai puțin de 30 minute",
        "Da, 30 minute - 1 oră",
        "Da, 1-2 ore",
        "Da, 2-3 ore",
        "Da, peste 3 ore"
      ]
    },
    {
      id: "eatingBeforeSleep",
      question: "Cu cât timp înainte de somn mănâncă copilul?",
      type: "select",
      options: [
        "Nu mănâncă înainte de somn",
        "15 minute înainte",
        "30 minute înainte",
        "45 minute înainte",
        "1 oră înainte",
        "1.5 ore înainte",
        "2 ore înainte",
        "Peste 2 ore înainte"
      ]
    },
    {
      id: "screenTime",
      question: "Se uită copilul la ecrane (TV, tabletă, telefon) înainte de culcare? Dacă da, cât timp?",
      type: "select",
      options: [
        "Nu se uită la ecrane",
        "Da, mai puțin de 15 minute",
        "Da, 15-30 minute",
        "Da, 30-60 minute",
        "Da, peste 1 oră"
      ]
    },
    {
      id: "loudMusic",
      question: "Ascultă muzică tare în casă înainte sau în timpul culcării?",
      type: "select",
      options: [
        "Nu",
        "Da, ocazional",
        "Da, frecvent",
        "Da, zilnic"
      ]
    }
  ]

  const [currentAnswer, setCurrentAnswer] = useState('')
  const [selectedCheckboxes, setSelectedCheckboxes] = useState([])

  const handleAnswerChange = (value) => {
    setCurrentAnswer(value)
  }

  const handleCheckboxChange = (option) => {
    setSelectedCheckboxes(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option)
      } else {
        return [...prev, option]
      }
    })
  }

  const handleNext = () => {
    const currentQ = questions[currentQuestionIndex]
    
    // Validare pentru checkboxes
    if (currentQ.type === 'checkbox') {
      if (selectedCheckboxes.length === 0) {
        setError('Te rog selectează cel puțin o problemă')
        return
      }
      setError(null)
      setAnswers({
        ...answers,
        [currentQ.id]: selectedCheckboxes
      })
    } else {
      // Validare pentru select
      if (currentQ.type === 'select') {
        if (!currentAnswer || currentAnswer === '') {
          setError('Te rog selectează o opțiune')
          return
        }
      } else {
        // Validare pentru textarea și text
        if (!currentAnswer.trim()) {
          setError('Te rog completează răspunsul')
          return
        }
      }

      // Validare pentru număr (dacă mai există)
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
    }

    // Verifică dacă următoarea întrebare este condițională
    let nextIndex = currentQuestionIndex + 1
    while (nextIndex < questions.length) {
      const nextQ = questions[nextIndex]
      if (nextQ.conditional && nextQ.showIf) {
        if (nextQ.showIf(answers)) {
          break
        } else {
          nextIndex++
          continue
        }
      }
      break
    }

    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex)
      setCurrentAnswer('')
      setSelectedCheckboxes([])
    } else {
      // Toate întrebările au fost răspunse, trimite la backend
      handleSubmitAll()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      let prevIndex = currentQuestionIndex - 1
      // Găsește întrebarea anterioară validă (sări peste cele condiționale care nu se aplică)
      while (prevIndex >= 0) {
        const prevQ = questions[prevIndex]
        if (prevQ.conditional && prevQ.showIf) {
          if (!prevQ.showIf(answers)) {
            prevIndex--
            continue
          }
        }
        break
      }
      
      if (prevIndex >= 0) {
        setCurrentQuestionIndex(prevIndex)
        const prevQ = questions[prevIndex]
        if (prevQ.type === 'checkbox') {
          setSelectedCheckboxes(Array.isArray(answers[prevQ.id]) ? answers[prevQ.id] : [])
          setCurrentAnswer('')
        } else {
          setCurrentAnswer(answers[prevQ.id] || '')
          setSelectedCheckboxes([])
        }
        setError(null)
      }
    }
  }

  const handleSubmitAll = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validare completă - verifică toate întrebările obligatorii
      const missingFields = []
      const allQuestions = questions.filter(q => {
        // Sari peste întrebările condiționale care nu se aplică
        if (q.conditional && q.showIf && !q.showIf(answers)) {
          return false
        }
        return true
      })

      allQuestions.forEach(q => {
        const answer = answers[q.id]
        if (q.type === 'checkbox') {
          if (!Array.isArray(answer) || answer.length === 0) {
            missingFields.push({
              question: q.question,
              field: q.id,
              error: 'Nu ai selectat nicio opțiune'
            })
          }
        } else if (q.type === 'select') {
          if (!answer || answer === '' || answer === 'Selectează...') {
            missingFields.push({
              question: q.question,
              field: q.id,
              error: 'Nu ai selectat o opțiune'
            })
          }
        } else if (q.type === 'textarea' || q.type === 'text') {
          if (!answer || answer.trim() === '') {
            missingFields.push({
              question: q.question,
              field: q.id,
              error: 'Nu ai completat răspunsul'
            })
          }
        }
      })

      // Afișează avertismente dar permite trimiterea cu ce s-a primit
      if (missingFields.length > 0) {
        const errorMessages = missingFields.map(f => 
          `• ${f.question}: ${f.error}`
        ).join('\n')
        setError(`Atenție: Următoarele întrebări nu sunt completate:\n\n${errorMessages}\n\nRăspunsul va fi trimis cu informațiile disponibile.`)
        // Nu returnăm aici - continuăm cu trimiterea
      }

      // Construiește întrebarea completă cu toate răspunsurile (folosind valori default pentru lipsuri)
      const problemsText = Array.isArray(answers.problems) ? answers.problems.join(', ') : 'Nu a fost specificat'
      const napDetailsText = answers.napDetails || 'Nu a fost specificat'
      const routineText = answers.routine || 'Nu a fost specificat'
      const ageText = answers.age || 'Nu a fost specificat'
      const napsText = answers.numberOfNaps || 'Nu a fost specificat'
      const sleepsWithText = answers.sleepsWith || 'Nu a fost specificat'
      const routineConsistentText = answers.routineConsistent || 'Nu a fost specificat'
      const wakesAtNightText = answers.wakesAtNight || 'Nu se trezește noaptea'
      const goesOutsideText = answers.goesOutside || 'Nu a fost specificat'
      const eatingBeforeSleepText = answers.eatingBeforeSleep || 'Nu a fost specificat'
      const screenTimeText = answers.screenTime || 'Nu a fost specificat'
      const loudMusicText = answers.loudMusic || 'Nu a fost specificat'
      
      const fullQuestion = `Problemele pe care părintele vrea să le rezolve: ${problemsText}. Copilul are ${ageText} luni. Are ${napsText} somnuri pe zi. Detalii somnuri de zi: ${napDetailsText}. Adoarme ${sleepsWithText}. Rutina de culcare: ${routineText}. Rutina este ${routineConsistentText}. Se trezește noaptea: ${wakesAtNightText}. Iese afară: ${goesOutsideText}. Mănâncă cu ${eatingBeforeSleepText} înainte de somn. Ecrane: ${screenTimeText}. Muzică: ${loudMusicText}. Ce recomandări ai pentru îmbunătățirea somnului?`
      
      const response = await askQuestion(fullQuestion, answers)
      setAnswer(response.answer)
      setPriorities(response.priorities || [])
      setShowFinalAnswer(true)
      // Șterge eroarea după trimiterea cu succes
      setError(null)
    } catch (err) {
      // Eroarea de la askQuestion deja are mesajul complet
      const errorMessage = err.message || 'Eroare necunoscută'
      setError(`Eroare la trimiterea întrebării:\n\n${errorMessage}`)
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
    setPriorities([])
    setShowFinalAnswer(false)
    setError(null)
  }

  // Calculează numărul real de întrebări (excludând cele condiționale care nu se aplică)
  const getVisibleQuestionsCount = () => {
    let count = 0
    const tempAnswers = { ...answers }
    questions.forEach((q, idx) => {
      if (idx <= currentQuestionIndex || !q.conditional || !q.showIf) {
        if (!q.conditional || !q.showIf || q.showIf(tempAnswers)) {
          count++
        }
      }
    })
    return count
  }

  const getTotalQuestionsCount = () => {
    let count = 0
    questions.forEach((q) => {
      if (!q.conditional || !q.showIf || q.showIf(answers)) {
        count++
      }
    })
    return count
  }

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = getTotalQuestionsCount()
  const currentQuestionNumber = currentQuestionIndex + 1
  const progress = (currentQuestionNumber / totalQuestions) * 100

  // Restaurează răspunsul dacă există (doar când se schimbă întrebarea)
  useEffect(() => {
    if (currentQuestion) {
      if (currentQuestion.type === 'checkbox') {
        const savedAnswer = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : []
        setSelectedCheckboxes(savedAnswer)
        setCurrentAnswer('')
      } else {
        setCurrentAnswer(answers[currentQuestion.id] || '')
        setSelectedCheckboxes([])
      }
    } else {
      setCurrentAnswer('')
      setSelectedCheckboxes([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <AnswerDisplay answer={answer} priorities={priorities} />
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
          Întrebare {currentQuestionNumber} din {totalQuestions}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="answer" className="label text-lg">
            {currentQuestion.question}
          </label>
          
          {currentQuestion.type === 'checkbox' ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCheckboxes.includes(option)}
                    onChange={() => handleCheckboxChange(option)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-gray-700 flex-1">{option}</span>
                </label>
              ))}
            </div>
          ) : currentQuestion.type === 'select' ? (
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
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-sm">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0"
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
                <h4 className="text-red-900 font-bold mb-2 text-base">Eroare:</h4>
                <pre className="text-red-800 text-sm whitespace-pre-wrap font-medium leading-relaxed">{error}</pre>
              </div>
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
            disabled={loading || (currentQuestion.type !== 'checkbox' && !currentAnswer.trim()) || (currentQuestion.type === 'checkbox' && selectedCheckboxes.length === 0)}
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
