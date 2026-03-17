import { useState, useEffect } from 'react'
import { askQuestion } from '../services/api'
import AnswerDisplay from './AnswerDisplay'
import { generatePDF } from '../utils/generatePDF'

const QuestionForm = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [answer, setAnswer] = useState('')
  const [priorities, setPriorities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showFinalAnswer, setShowFinalAnswer] = useState(false)
  const [napInputs, setNapInputs] = useState([]) // [{startTime: "10:00", duration: "90"}, ...]
  const [nightSleep, setNightSleep] = useState({ startTime: '', duration: '' }) // Somnul de noapte
  const [wakeWindows, setWakeWindows] = useState([]) // Calculated PV-uri

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
      question: "Detalii somnuri de zi și somnul de noapte",
      type: "napInputs",
      conditional: true,
      dependsOn: "numberOfNaps",
      showIf: (answers) => {
        const naps = answers.numberOfNaps
        if (!naps) return false
        // Gestionează atât string cât și număr
        const napsNum = typeof naps === 'string' ? parseInt(naps.replace(/[^\d]/g, '')) : parseInt(naps)
        return !isNaN(napsNum) && napsNum >= 0
      }
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

  // Inițializează input-urile pentru somnuri când numberOfNaps se schimbă
  useEffect(() => {
    const naps = answers.numberOfNaps
    if (naps) {
      const napsNum = typeof naps === 'string' ? parseInt(naps.replace(/[^\d]/g, '')) : parseInt(naps)
      if (!isNaN(napsNum) && napsNum > 0) {
        // Creează array-ul de input-uri dacă nu există sau dacă numărul s-a schimbat
        if (napInputs.length !== napsNum) {
          const newInputs = Array.from({ length: napsNum }, (_, i) => ({
            startTime: napInputs[i]?.startTime || '',
            duration: napInputs[i]?.duration || ''
          }))
          setNapInputs(newInputs)
        }
      } else {
        setNapInputs([])
      }
    } else {
      setNapInputs([])
    }
  }, [answers.numberOfNaps])

  // Calculează PV-urile când se schimbă input-urile de somnuri
  useEffect(() => {
    if (napInputs.length === 0) {
      setWakeWindows([])
      return
    }

    const calculatedPVs = []
    const ageMonths = parseInt(answers.age) || 0

    // Obține PV-urile recomandate pentru vârstă (o singură dată, pentru toate calculele)
    let recommendedPV = { min: 0, max: 0, optimal: 0 }
    if (ageMonths <= 3) {
      recommendedPV = { min: 45/60, max: 90/60, optimal: 60/60 }
    } else if (ageMonths <= 6) {
      recommendedPV = { min: 90/60, max: 150/60, optimal: 120/60 }
    } else if (ageMonths <= 12) {
      recommendedPV = { min: 2.5, max: 4, optimal: 3 }
    } else if (ageMonths <= 18) {
      recommendedPV = { min: 4, max: 5.5, optimal: 5 }
    } else if (ageMonths <= 24) {
      recommendedPV = { min: 5, max: 6, optimal: 5.5 }
    } else if (ageMonths <= 36) {
      recommendedPV = { min: 5.5, max: 6.5, optimal: 6 }
    } else {
      recommendedPV = { min: 6, max: 7, optimal: 6.5 }
    }

    // Calculează PV între somnuri
    for (let i = 0; i < napInputs.length - 1; i++) {
      const currentNap = napInputs[i]
      const nextNap = napInputs[i + 1]

      if (currentNap.startTime && currentNap.duration && nextNap.startTime) {
        // Calculează ora de sfârșit a somnului curent
        const [startHour, startMin] = currentNap.startTime.split(':').map(Number)
        const durationMinutes = parseInt(currentNap.duration) || 0
        
        // Calculează minutele totale de la începutul zilei
        const startTotalMinutes = startHour * 60 + startMin
        const endTotalMinutes = startTotalMinutes + durationMinutes
        
        // Calculează ora de început a următorului somn
        const [nextHour, nextMin] = nextNap.startTime.split(':').map(Number)
        const nextStartTotalMinutes = nextHour * 60 + nextMin
        
        // Calculează diferența în minute
        // Dacă următorul somn este a doua zi, adaugă 24 ore
        let pvMinutes = nextStartTotalMinutes - endTotalMinutes
        if (pvMinutes < 0) {
          // Dacă este negativ, înseamnă că următorul somn este a doua zi
          pvMinutes = (24 * 60) + pvMinutes
        }
        
        const pvHours = pvMinutes / 60

        // Verifică dacă PV-ul este ok (doar dacă este pozitiv și rezonabil)
        if (pvHours >= 0 && pvHours <= 24) {
          const isOk = pvHours >= recommendedPV.min && pvHours <= recommendedPV.max
          const isTooShort = pvHours < recommendedPV.min
          const isTooLong = pvHours > recommendedPV.max

          calculatedPVs.push({
            fromNap: i + 1,
            toNap: i + 2,
            pvHours: pvHours.toFixed(1),
            recommended: recommendedPV,
            isOk,
            isTooShort,
            isTooLong
          })
        } else {
          // Dacă PV-ul este negativ sau prea mare, înseamnă că datele sunt incorecte
          calculatedPVs.push({
            fromNap: i + 1,
            toNap: i + 2,
            pvHours: pvHours.toFixed(1),
            recommended: recommendedPV,
            isOk: false,
            isTooShort: true,
            isTooLong: false,
            error: true
          })
        }
      }
    }

    // Calculează PV între ultimul somn de zi și somnul de noapte
    if (napInputs.length > 0 && napInputs[napInputs.length - 1].startTime && napInputs[napInputs.length - 1].duration && nightSleep.startTime) {
      const lastDayNap = napInputs[napInputs.length - 1]
      const [startHour, startMin] = lastDayNap.startTime.split(':').map(Number)
      const durationMinutes = parseInt(lastDayNap.duration) || 0
      const startTotalMinutes = startHour * 60 + startMin
      const endTotalMinutes = startTotalMinutes + durationMinutes
      
      const [nightHour, nightMin] = nightSleep.startTime.split(':').map(Number)
      const nightStartTotalMinutes = nightHour * 60 + nightMin
      
      let pvMinutes = nightStartTotalMinutes - endTotalMinutes
      if (pvMinutes < 0) {
        pvMinutes = (24 * 60) + pvMinutes
      }
      
      const pvHours = pvMinutes / 60

      if (pvHours >= 0 && pvHours <= 24) {
        const isOk = pvHours >= recommendedPV.min && pvHours <= recommendedPV.max
        const isTooShort = pvHours < recommendedPV.min
        const isTooLong = pvHours > recommendedPV.max

        calculatedPVs.push({
          fromNap: napInputs.length,
          toNap: 'noapte',
          fromType: 'zi',
          toType: 'noapte',
          pvHours: pvHours.toFixed(1),
          recommended: recommendedPV,
          isOk,
          isTooShort,
          isTooLong,
          error: false
        })
      } else {
        calculatedPVs.push({
          fromNap: napInputs.length,
          toNap: 'noapte',
          fromType: 'zi',
          toType: 'noapte',
          pvHours: pvHours.toFixed(1),
          recommended: recommendedPV,
          isOk: false,
          isTooShort: true,
          isTooLong: false,
          error: true
        })
      }
    }

    setWakeWindows(calculatedPVs)
  }, [napInputs, nightSleep, answers.age])

  const handleNapInputChange = (index, field, value) => {
    const newInputs = [...napInputs]
    newInputs[index] = {
      ...newInputs[index],
      [field]: value
    }
    setNapInputs(newInputs)
  }

  const handleNightSleepChange = (field, value) => {
    setNightSleep(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAnswerChange = (value) => {
    setCurrentAnswer(value)
    // Pentru select, salvează imediat răspunsul în answers pentru a evita probleme de validare
    const currentQ = questions[currentQuestionIndex]
    if (currentQ && currentQ.type === 'select' && value && value !== '' && value !== 'Selectează...') {
      setAnswers(prev => ({
        ...prev,
        [currentQ.id]: value
      }))
    }
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
      const updatedAnswers = {
        ...answers,
        [currentQ.id]: selectedCheckboxes
      }
      setAnswers(updatedAnswers)

      // Navighează la următoarea întrebare
      let nextIndex = currentQuestionIndex + 1
      while (nextIndex < questions.length) {
        const nextQ = questions[nextIndex]
        if (nextQ.conditional && nextQ.showIf) {
          if (nextQ.showIf(updatedAnswers)) {
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
        setError(null) // Șterge orice eroare anterioară
      } else {
        handleSubmitAll()
      }
      return
    } else if (currentQ.type === 'napInputs') {
      // Validare pentru napInputs (somnuri de zi) - doar dacă există somnuri de zi
      if (napInputs.length > 0) {
        const incompleteDayNaps = napInputs.some((nap, idx) => !nap.startTime || !nap.duration || nap.duration === '0')
        if (incompleteDayNaps) {
          setError('Te rog completează ora de început și durata pentru toate somnurile de zi')
          return
        }
      }
      
      // Validare pentru somnul de noapte
      if (!nightSleep.startTime || !nightSleep.duration || nightSleep.duration === '0' || parseFloat(nightSleep.duration) <= 0) {
        setError('Te rog completează ora de început și durata pentru somnul de noapte')
        return
      }
      
      setError(null)
      const updatedAnswers = {
        ...answers,
        [currentQ.id]: napInputs,
        nightSleep: nightSleep,
        wakeWindows: wakeWindows
      }
      setAnswers(updatedAnswers)

      // Navighează la următoarea întrebare
      let nextIndex = currentQuestionIndex + 1
      while (nextIndex < questions.length) {
        const nextQ = questions[nextIndex]
        if (nextQ.conditional && nextQ.showIf) {
          if (nextQ.showIf(updatedAnswers)) {
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
        handleSubmitAll()
      }
      return
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
      // Actualizează answers înainte de a verifica condițiile
      const updatedAnswers = {
        ...answers,
        [currentQ.id]: currentAnswer
      }
      setAnswers(updatedAnswers)

      // Verifică dacă următoarea întrebare este condițională
      // Folosește updatedAnswers pentru a verifica condițiile corect
      let nextIndex = currentQuestionIndex + 1
      while (nextIndex < questions.length) {
        const nextQ = questions[nextIndex]
        if (nextQ.conditional && nextQ.showIf) {
          // Folosește updatedAnswers pentru a verifica dacă întrebarea trebuie afișată
          if (nextQ.showIf(updatedAnswers)) {
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
        // Skip validation for napInputs as they are handled separately
        if (q.type === 'napInputs') {
          return
        }
        if (q.type === 'checkbox') {
          if (!Array.isArray(answer) || answer.length === 0) {
            missingFields.push({
              question: q.question,
              field: q.id,
              error: 'Nu ai selectat nicio opțiune'
            })
          }
        } else if (q.type === 'select') {
          // Verifică dacă răspunsul este gol, undefined, null sau este opțiunea default
          // Verifică și dacă răspunsul este un string valid (nu gol și nu este opțiunea default)
          const isValidAnswer = answer && 
                                answer !== '' && 
                                answer !== 'Selectează...' && 
                                (typeof answer !== 'string' || answer.trim() !== '')
          if (!isValidAnswer) {
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
      
      // Formatează detalii somnuri și PV-uri
      let napDetailsText = 'Nu a fost specificat'
      let wakeWindowsText = ''
      if (Array.isArray(answers.napDetails) && answers.napDetails.length > 0) {
        napDetailsText = answers.napDetails.map((nap, idx) => {
          const durationHours = (parseInt(nap.duration) || 0) / 60
          return `Somnul ${idx + 1}: ${nap.startTime} (${durationHours.toFixed(1)} ore)`
        }).join(', ')
        
        if (answers.wakeWindows && answers.wakeWindows.length > 0) {
          wakeWindowsText = '\nPerioade de veghe (PV) calculate: ' + answers.wakeWindows.map((pv, idx) => {
            const status = pv.isOk ? 'OK' : pv.isTooShort ? 'PREA SCURT' : 'PREA LUNG'
            return `PV între somnul ${pv.fromNap}-${pv.toNap}: ${pv.pvHours} ore (${status}, recomandat: ${pv.recommended.min}-${pv.recommended.max} ore)`
          }).join('; ')
        }
      }
      const routineText = answers.routine || 'Nu a fost specificat'
      
      // Extrage numărul din răspunsul pentru vârstă (ex: "19 luni" -> "19")
      let ageText = 'Nu a fost specificat'
      let ageNumber = null
      if (answers.age) {
        const ageMatch = answers.age.toString().match(/\d+/)
        if (ageMatch) {
          ageNumber = parseInt(ageMatch[0])
          ageText = ageNumber.toString()
        } else {
          ageText = answers.age
        }
      }
      
      // Extrage numărul din răspunsul pentru număr somnuri
      let napsText = 'Nu a fost specificat'
      let napsNumber = null
      if (answers.numberOfNaps) {
        const napsMatch = answers.numberOfNaps.toString().match(/\d+/)
        if (napsMatch) {
          napsNumber = parseInt(napsMatch[0])
          napsText = napsNumber.toString()
        } else {
          napsText = answers.numberOfNaps
        }
      }
      
      // Trimite doar numerele în answers pentru backend
      const cleanedAnswers = {
        ...answers,
        age: ageNumber !== null ? ageNumber : answers.age,
        numberOfNaps: napsNumber !== null ? napsNumber : answers.numberOfNaps
      }
      const nightSleepText = answers.nightSleep ? `Somnul de noapte: ${answers.nightSleep.startTime} (${answers.nightSleep.duration} ore)` : 'Nu a fost specificat'
      const sleepsWithText = answers.sleepsWith || 'Nu a fost specificat'
      const routineConsistentText = answers.routineConsistent || 'Nu a fost specificat'
      const wakesAtNightText = answers.wakesAtNight || 'Nu se trezește noaptea'
      const goesOutsideText = answers.goesOutside || 'Nu a fost specificat'
      const eatingBeforeSleepText = answers.eatingBeforeSleep || 'Nu a fost specificat'
      const screenTimeText = answers.screenTime || 'Nu a fost specificat'
      const loudMusicText = answers.loudMusic || 'Nu a fost specificat'
      
      const fullQuestion = `Problemele pe care părintele vrea să le rezolve: ${problemsText}. Copilul are ${ageText} luni. Are ${napsText} somnuri de zi. Detalii somnuri de zi: ${napDetailsText}${wakeWindowsText}. ${nightSleepText}. Adoarme ${sleepsWithText}. Rutina de culcare: ${routineText}. Rutina este ${routineConsistentText}. Se trezește noaptea: ${wakesAtNightText}. Iese afară: ${goesOutsideText}. Mănâncă cu ${eatingBeforeSleepText} înainte de somn. Ecrane: ${screenTimeText}. Muzică: ${loudMusicText}. Ce recomandări ai pentru îmbunătățirea somnului? Analizează și interpretează PV-urile calculate și spune dacă sunt potrivite pentru vârsta copilului.`
      
      const response = await askQuestion(fullQuestion, cleanedAnswers)
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
          <AnswerDisplay answer={answer} priorities={priorities} answers={answers} />
        </div>

        {/* Butoane pentru PDF */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              const doc = generatePDF(answers, answer, priorities)
              const fileName = `Plan_Somn_${answers.age || 'copil'}_luni_${new Date().toISOString().split('T')[0]}.pdf`
              doc.save(fileName)
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descarcă PDF
          </button>
          <button
            onClick={() => {
              const doc = generatePDF(answers, answer, priorities)
              const pdfBlob = doc.output('blob')
              const pdfUrl = URL.createObjectURL(pdfBlob)
              
              // Creează mesajul pentru WhatsApp
              const message = encodeURIComponent(
                `Plan de somn personalizat pentru copilul meu (${answers.age || 'necunoscută'} luni)\n\n` +
                `Am primit recomandări expert pentru îmbunătățirea somnului.`
              )
              
              // Deschide WhatsApp cu mesajul (pentru share PDF, utilizatorul va trebui să-l atașeze manual)
              window.open(`https://wa.me/?text=${message}`, '_blank')
              
              // Oferă opțiunea de download
              setTimeout(() => {
                const link = document.createElement('a')
                link.href = pdfUrl
                link.download = `Plan_Somn_${answers.age || 'copil'}_luni_${new Date().toISOString().split('T')[0]}.pdf`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(pdfUrl)
              }, 500)
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.041-.024-2.432 1.395.548-2.387-.013-.031a9.901 9.901 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Trimite pe WhatsApp
          </button>
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
          ) : currentQuestion.type === 'napInputs' ? (
            <div className="space-y-4">
              {/* Somnurile de zi */}
              {napInputs.map((nap, index) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-700 mb-3">Somnul de zi {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ora de început
                      </label>
                      <input
                        type="time"
                        value={nap.startTime}
                        onChange={(e) => handleNapInputChange(index, 'startTime', e.target.value)}
                        className="input-field"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durata (minute)
                      </label>
                      <input
                        type="number"
                        value={nap.duration}
                        onChange={(e) => handleNapInputChange(index, 'duration', e.target.value)}
                        placeholder="ex: 90"
                        min="15"
                        max="240"
                        className="input-field"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Somnul de noapte */}
              <div className="p-4 border-2 border-indigo-300 rounded-lg bg-indigo-50">
                <h4 className="font-semibold text-indigo-900 mb-3">Somnul de noapte</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Ora de început
                    </label>
                    <input
                      type="time"
                      value={nightSleep.startTime}
                      onChange={(e) => handleNightSleepChange('startTime', e.target.value)}
                      className="input-field"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Durata (ore)
                    </label>
                    <input
                      type="number"
                      value={nightSleep.duration}
                      onChange={(e) => handleNightSleepChange('duration', e.target.value)}
                      placeholder="ex: 11"
                      min="8"
                      max="14"
                      step="0.5"
                      className="input-field"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              
              {/* Afișează doar PV-urile problematice */}
              {wakeWindows.filter(pv => !pv.isOk || pv.error || parseFloat(pv.pvHours) < 0).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <h4 className="font-bold text-red-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    PV-uri problematice (necesită atenție):
                  </h4>
                  {wakeWindows.filter(pv => !pv.isOk || pv.error || parseFloat(pv.pvHours) < 0).map((pv, idx) => (
                    <div key={idx} className={`mb-3 p-3 rounded-lg ${pv.error || parseFloat(pv.pvHours) < 0 ? 'bg-red-200 border-2 border-red-400' : pv.isTooShort ? 'bg-red-100 border border-red-300' : 'bg-amber-100 border border-amber-300'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base">
                          PV între {pv.fromType === 'zi' ? `somnul de zi ${pv.fromNap}` : 'somnul de noapte'} și {pv.toType === 'noapte' ? 'somnul de noapte' : `somnul de zi ${pv.toNap}`}: <strong className="text-red-800">{pv.pvHours} ore</strong>
                        </span>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${pv.error || parseFloat(pv.pvHours) < 0 ? 'bg-red-300 text-red-900' : pv.isTooShort ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                          {pv.error || parseFloat(pv.pvHours) < 0 ? '⚠ Date incorecte' : pv.isTooShort ? '⚠ Prea scurt' : '⚠ Prea lung'}
                        </span>
                      </div>
                      {pv.error || parseFloat(pv.pvHours) < 0 ? (
                        <div className="text-sm text-red-800 font-semibold">
                          ⚠ Verifică orele introduse - ora de sfârșit a somnului anterior este după ora de început a somnului următor
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700">
                          Recomandat pentru vârsta copilului: <strong>{pv.recommended.min}-{pv.recommended.max} ore</strong> (optim: {pv.recommended.optimal} ore)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentQuestion.type === 'time' ? (
            <input
              id="answer"
              type="time"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="input-field"
              disabled={loading}
            />
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
            disabled={
              loading || 
              (currentQuestion.type === 'checkbox' && selectedCheckboxes.length === 0) ||
              (currentQuestion.type === 'napInputs' && (
                (napInputs.length > 0 && napInputs.some(nap => !nap.startTime || !nap.duration || nap.duration === '0')) ||
                !nightSleep.startTime || !nightSleep.duration || nightSleep.duration === '0' || parseFloat(nightSleep.duration) <= 0
              )) ||
              (currentQuestion.type !== 'checkbox' && currentQuestion.type !== 'napInputs' && !currentAnswer.trim())
            }
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
