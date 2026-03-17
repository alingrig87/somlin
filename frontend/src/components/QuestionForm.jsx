import { useState, useEffect } from 'react'
import { askQuestion } from '../services/api'
import AnswerDisplay from './AnswerDisplay'
import { generatePDF } from '../utils/generatePDF'

const ROUTINE_OPTIONS = [
  { id: 'baie', label: 'Baie' },
  { id: 'masaj', label: 'Masaj' },
  { id: 'pijamale', label: 'Îmbrăcat pijamale' },
  { id: 'poveste', label: 'Poveste / Lectură' },
  { id: 'cantec', label: 'Cântec de leagăn' },
  { id: 'alaptare', label: 'Alăptare / Biberon' },
  { id: 'suzeta', label: 'Suzetă' },
  { id: 'joc_linistit', label: 'Joc liniștit' },
  { id: 'muzica', label: 'Muzică liniștită' },
  { id: 'rugaciune', label: 'Rugăciune' },
  { id: 'lumini', label: 'Stins lumina' },
]

const QuestionForm = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [answer, setAnswer] = useState('')
  const [priorities, setPriorities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showFinalAnswer, setShowFinalAnswer] = useState(false)
  const [napInputs, setNapInputs] = useState([])
  const [nightSleep, setNightSleep] = useState({ startTime: '', duration: '' })
  const [wakeWindows, setWakeWindows] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [selectedCheckboxes, setSelectedCheckboxes] = useState([])
  const [routineItems, setRoutineItems] = useState([])
  const [customRoutineInput, setCustomRoutineInput] = useState('')

  const questions = [
    {
      id: 'age',
      question: 'Câte luni are copilul?',
      type: 'number',
      placeholder: 'ex: 18',
      validation: { min: 0, max: 48 }
    },
    {
      id: 'problems',
      question: 'Ce problemă vrei să rezolvi? (Poți selecta mai multe)',
      type: 'checkbox',
      options: [
        'Se trezește des noaptea',
        'Nu doarme suficient',
        'Adoarme greu',
        'Se trezește devreme',
        'Plânge în timpul nopții',
        'Refuză să se culce',
        'Somn fragmentat',
        'Dificultate la somnurile de zi',
        'Altele'
      ]
    },
    {
      id: 'numberOfNaps',
      question: 'Câte somnuri de zi are copilul?',
      type: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6']
    },
    {
      id: 'napDetails',
      question: 'Detalii somnuri de zi și somnul de noapte',
      type: 'napInputs',
      conditional: true,
      dependsOn: 'numberOfNaps',
      showIf: (ans) => {
        const naps = ans.numberOfNaps
        if (!naps) return false
        const napsNum = typeof naps === 'string' ? parseInt(naps.replace(/[^\d]/g, '')) : parseInt(naps)
        return !isNaN(napsNum) && napsNum >= 0
      }
    },
    {
      id: 'bedtime',
      question: 'La ce oră se culcă copilul seara?',
      type: 'time'
    },
    {
      id: 'wakeTime',
      question: 'La ce oră se trezește copilul dimineața?',
      type: 'time'
    },
    {
      id: 'sleepLocation',
      question: 'Unde doarme copilul?',
      type: 'select',
      options: [
        'Pătuț propriu în camera lui',
        'Pătuț propriu în camera părinților',
        'Pat comun cu părinții',
        'Coș / Leagăn',
        'Altele'
      ]
    },
    {
      id: 'howFallsAsleep',
      question: 'Cum adoarme copilul de obicei?',
      type: 'select',
      options: [
        'Singur, fără ajutor',
        'Alăptat / cu biberon în brațe',
        'Legănat în brațe',
        'Cu suzetă',
        'Cu muzică / zgomot alb',
        'Plimbat în cărucior sau mașină',
        'Cu mângâieri / bătăi pe spate',
        'Altele'
      ]
    },
    {
      id: 'sleepsWith',
      question: 'Cu cine adoarme copilul?',
      type: 'select',
      options: [
        'Singur în patul lui',
        'Cu părinții în patul părinților',
        'Cu părinții în patul copilului',
        'Cu bunica / bunicul',
        'Cu frații',
        'Altele'
      ]
    },
    {
      id: 'routine',
      question: 'Care este rutina de culcare? Selectează și ordonează activitățile.',
      type: 'routineBuilder'
    },
    {
      id: 'routineConsistent',
      question: 'Este rutina la fel zilnic sau variază?',
      type: 'select',
      options: ['La fel zilnic', 'Variază', 'Parțial consistentă']
    },
    {
      id: 'wakesAtNightCount',
      question: 'De câte ori se trezește copilul noaptea?',
      type: 'select',
      options: ['Nu se trezește', '1 dată', '2-3 ori', '4-5 ori', 'Peste 5 ori']
    },
    {
      id: 'wakesAtNightReaction',
      question: 'Cum reacționează când se trezește noaptea și ce face pentru a adormi din nou?',
      type: 'textarea',
      placeholder: 'ex: plânge, cere lapte, vrea să fie ținut în brațe, cere suzeta...',
      conditional: true,
      showIf: (ans) => ans.wakesAtNightCount && ans.wakesAtNightCount !== 'Nu se trezește'
    },
    {
      id: 'goesOutside',
      question: 'Iese copilul afară pe timpul zilei? Dacă da, cât timp?',
      type: 'select',
      options: [
        'Nu iese afară',
        'Da, mai puțin de 30 minute',
        'Da, 30 minute - 1 oră',
        'Da, 1-2 ore',
        'Da, 2-3 ore',
        'Da, peste 3 ore'
      ]
    },
    {
      id: 'eatingBeforeSleep',
      question: 'Cu cât timp înainte de somn mănâncă copilul?',
      type: 'select',
      options: [
        'Nu mănâncă înainte de somn',
        '15 minute înainte',
        '30 minute înainte',
        '45 minute înainte',
        '1 oră înainte',
        '1.5 ore înainte',
        '2 ore înainte',
        'Peste 2 ore înainte'
      ]
    },
    {
      id: 'screenTime',
      question: 'Se uită copilul la ecrane (TV, tabletă, telefon) înainte de culcare?',
      type: 'select',
      options: [
        'Nu se uită la ecrane',
        'Da, mai puțin de 15 minute',
        'Da, 15-30 minute',
        'Da, 30-60 minute',
        'Da, peste 1 oră'
      ]
    },
    {
      id: 'loudMusic',
      question: 'Ascultă muzică tare în casă înainte sau în timpul culcării?',
      type: 'select',
      options: ['Nu', 'Da, ocazional', 'Da, frecvent', 'Da, zilnic']
    }
  ]

  // ─── Nap inputs init ────────────────────────────────────────────────────────
  useEffect(() => {
    const naps = answers.numberOfNaps
    if (naps) {
      const napsNum = typeof naps === 'string' ? parseInt(naps.replace(/[^\d]/g, '')) : parseInt(naps)
      if (!isNaN(napsNum) && napsNum > 0) {
        if (napInputs.length !== napsNum) {
          setNapInputs(Array.from({ length: napsNum }, (_, i) => ({
            startTime: napInputs[i]?.startTime || '',
            duration: napInputs[i]?.duration || ''
          })))
        }
      } else {
        setNapInputs([])
      }
    } else {
      setNapInputs([])
    }
  }, [answers.numberOfNaps])

  // ─── Wake windows calculation ───────────────────────────────────────────────
  useEffect(() => {
    if (napInputs.length === 0) { setWakeWindows([]); return }

    const ageMonths = parseInt(answers.age) || 0
    let recommendedPV = { min: 0, max: 0, optimal: 0 }
    if (ageMonths <= 3) recommendedPV = { min: 45/60, max: 90/60, optimal: 60/60 }
    else if (ageMonths <= 6) recommendedPV = { min: 90/60, max: 150/60, optimal: 120/60 }
    else if (ageMonths <= 12) recommendedPV = { min: 2.5, max: 4, optimal: 3 }
    else if (ageMonths <= 18) recommendedPV = { min: 4, max: 5.5, optimal: 5 }
    else if (ageMonths <= 24) recommendedPV = { min: 5, max: 6, optimal: 5.5 }
    else if (ageMonths <= 36) recommendedPV = { min: 5.5, max: 6.5, optimal: 6 }
    else recommendedPV = { min: 6, max: 7, optimal: 6.5 }

    const calculatedPVs = []

    for (let i = 0; i < napInputs.length - 1; i++) {
      const cur = napInputs[i], next = napInputs[i + 1]
      if (!cur.startTime || !cur.duration || !next.startTime) continue
      const [sh, sm] = cur.startTime.split(':').map(Number)
      const end = sh * 60 + sm + (parseInt(cur.duration) || 0)
      const [nh, nm] = next.startTime.split(':').map(Number)
      let pv = nh * 60 + nm - end
      if (pv < 0) pv += 24 * 60
      const pvH = pv / 60
      calculatedPVs.push({
        fromNap: i + 1, toNap: i + 2,
        pvHours: pvH.toFixed(1), recommended: recommendedPV,
        isOk: pvH >= recommendedPV.min && pvH <= recommendedPV.max,
        isTooShort: pvH < recommendedPV.min,
        isTooLong: pvH > recommendedPV.max,
        error: pvH < 0 || pvH > 24
      })
    }

    const lastNap = napInputs[napInputs.length - 1]
    if (lastNap.startTime && lastNap.duration && nightSleep.startTime) {
      const [sh, sm] = lastNap.startTime.split(':').map(Number)
      const end = sh * 60 + sm + (parseInt(lastNap.duration) || 0)
      const [nh, nm] = nightSleep.startTime.split(':').map(Number)
      let pv = nh * 60 + nm - end
      if (pv < 0) pv += 24 * 60
      const pvH = pv / 60
      calculatedPVs.push({
        fromNap: napInputs.length, toNap: 'noapte',
        fromType: 'zi', toType: 'noapte',
        pvHours: pvH.toFixed(1), recommended: recommendedPV,
        isOk: pvH >= recommendedPV.min && pvH <= recommendedPV.max,
        isTooShort: pvH < recommendedPV.min,
        isTooLong: pvH > recommendedPV.max,
        error: pvH < 0 || pvH > 24
      })
    }

    setWakeWindows(calculatedPVs)
  }, [napInputs, nightSleep, answers.age])

  // ─── Restore answer when navigating back ───────────────────────────────────
  useEffect(() => {
    const q = questions[currentQuestionIndex]
    if (!q) return
    if (q.type === 'checkbox') {
      setSelectedCheckboxes(Array.isArray(answers[q.id]) ? answers[q.id] : [])
      setCurrentAnswer('')
    } else if (q.type === 'routineBuilder') {
      setRoutineItems(answers.routineItems || [])
      setCurrentAnswer('')
    } else {
      setCurrentAnswer(answers[q.id] || '')
      setSelectedCheckboxes([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex])

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleNapInputChange = (index, field, value) => {
    const newInputs = [...napInputs]
    newInputs[index] = { ...newInputs[index], [field]: value }
    setNapInputs(newInputs)
  }

  const handleNightSleepChange = (field, value) =>
    setNightSleep(prev => ({ ...prev, [field]: value }))

  const handleAnswerChange = (value) => {
    setCurrentAnswer(value)
    const q = questions[currentQuestionIndex]
    if (q?.type === 'select' && value && value !== '') {
      setAnswers(prev => ({ ...prev, [q.id]: value }))
    }
  }

  const handleCheckboxChange = (option) => {
    setSelectedCheckboxes(prev =>
      prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]
    )
  }

  const handleRoutineToggle = (option) => {
    setRoutineItems(prev => {
      const exists = prev.find(i => i.id === option.id)
      return exists ? prev.filter(i => i.id !== option.id) : [...prev, option]
    })
  }

  const handleRoutineMove = (index, direction) => {
    setRoutineItems(prev => {
      const items = [...prev]
      const target = index + direction
      if (target < 0 || target >= items.length) return prev
      ;[items[index], items[target]] = [items[target], items[index]]
      return items
    })
  }

  const handleRoutineRemove = (index) =>
    setRoutineItems(prev => prev.filter((_, i) => i !== index))

  const handleAddCustomRoutine = () => {
    const label = customRoutineInput.trim()
    if (!label) return
    setRoutineItems(prev => [...prev, { id: `custom_${Date.now()}`, label }])
    setCustomRoutineInput('')
  }

  // ─── Navigate to next question ─────────────────────────────────────────────
  const navigateNext = (updatedAnswers) => {
    let nextIndex = currentQuestionIndex + 1
    while (nextIndex < questions.length) {
      const nq = questions[nextIndex]
      if (nq.conditional && nq.showIf && !nq.showIf(updatedAnswers)) {
        nextIndex++
      } else {
        break
      }
    }
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex)
      setCurrentAnswer('')
      setSelectedCheckboxes([])
      setError(null)
    } else {
      handleSubmitAll(updatedAnswers)
    }
  }

  const handleNext = () => {
    const q = questions[currentQuestionIndex]

    if (q.type === 'checkbox') {
      if (selectedCheckboxes.length === 0) { setError('Te rog selectează cel puțin o opțiune'); return }
      setError(null)
      const updated = { ...answers, [q.id]: selectedCheckboxes }
      setAnswers(updated)
      navigateNext(updated)
      return
    }

    if (q.type === 'napInputs') {
      if (napInputs.length > 0 && napInputs.some(n => !n.startTime || !n.duration || n.duration === '0')) {
        setError('Te rog completează ora de început și durata pentru toate somnurile de zi')
        return
      }
      if (!nightSleep.startTime || !nightSleep.duration || nightSleep.duration === '0' || parseFloat(nightSleep.duration) <= 0) {
        setError('Te rog completează ora de început și durata pentru somnul de noapte')
        return
      }
      setError(null)
      const updated = { ...answers, [q.id]: napInputs, nightSleep, wakeWindows }
      setAnswers(updated)
      navigateNext(updated)
      return
    }

    if (q.type === 'routineBuilder') {
      if (routineItems.length === 0) { setError('Te rog selectează cel puțin o activitate din rutină'); return }
      setError(null)
      const routineText = routineItems.map((item, i) => `${i + 1}. ${item.label}`).join(' → ')
      const updated = { ...answers, [q.id]: routineText, routineItems }
      setAnswers(updated)
      navigateNext(updated)
      return
    }

    if (q.type === 'number') {
      const num = parseInt(currentAnswer)
      if (isNaN(num) || num < q.validation.min || num > q.validation.max) {
        setError(`Te rog introdu un număr între ${q.validation.min} și ${q.validation.max}`)
        return
      }
    } else if (q.type === 'select') {
      if (!currentAnswer || currentAnswer === '') { setError('Te rog selectează o opțiune'); return }
    } else if (q.type === 'textarea' || q.type === 'time') {
      if (!currentAnswer.trim()) { setError('Te rog completează răspunsul'); return }
    }

    setError(null)
    const updated = { ...answers, [q.id]: currentAnswer }
    setAnswers(updated)
    navigateNext(updated)
  }

  const handlePrevious = () => {
    let prevIndex = currentQuestionIndex - 1
    while (prevIndex >= 0) {
      const pq = questions[prevIndex]
      if (pq.conditional && pq.showIf && !pq.showIf(answers)) prevIndex--
      else break
    }
    if (prevIndex >= 0) {
      setCurrentQuestionIndex(prevIndex)
      setError(null)
    }
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmitAll = async (finalAnswers) => {
    const ans = finalAnswers || answers
    setLoading(true)
    setError(null)

    try {
      const a = ans
      const problemsText = Array.isArray(a.problems) ? a.problems.join(', ') : 'Nu a fost specificat'
      const ageMatch = a.age?.toString().match(/\d+/)
      const ageNum = ageMatch ? parseInt(ageMatch[0]) : null
      const ageText = ageNum !== null ? ageNum.toString() : 'necunoscută'

      const napsMatch = a.numberOfNaps?.toString().match(/\d+/)
      const napsNum = napsMatch ? parseInt(napsMatch[0]) : null
      const napsText = napsNum !== null ? napsNum.toString() : 'necunoscut'

      let napDetailsText = 'Nu a fost specificat'
      let wakeWindowsText = ''
      if (Array.isArray(a.napDetails) && a.napDetails.length > 0) {
        napDetailsText = a.napDetails.map((nap, idx) => {
          const h = (parseInt(nap.duration) || 0) / 60
          return `Somnul ${idx + 1}: ${nap.startTime} (${h.toFixed(1)} ore)`
        }).join(', ')
        if (a.wakeWindows?.length > 0) {
          wakeWindowsText = '\nPV-uri calculate: ' + a.wakeWindows.map(pv => {
            const status = pv.isOk ? 'OK' : pv.isTooShort ? 'PREA SCURT' : 'PREA LUNG'
            return `PV ${pv.fromNap}→${pv.toNap}: ${pv.pvHours}h (${status}, recomandat: ${pv.recommended.min}-${pv.recommended.max}h)`
          }).join('; ')
        }
      }

      const nightSleepText = a.nightSleep
        ? `Somnul de noapte: ${a.nightSleep.startTime} (${a.nightSleep.duration} ore)`
        : 'Nu a fost specificat'

      const fullQuestion = [
        `Copilul are ${ageText} luni.`,
        `Problemele părintelui: ${problemsText}.`,
        `Somnuri de zi: ${napsText}.`,
        `Detalii somnuri: ${napDetailsText}.${wakeWindowsText}`,
        nightSleepText + '.',
        `Ora de culcare: ${a.bedtime || 'necunoscută'}.`,
        `Ora de trezire dimineața: ${a.wakeTime || 'necunoscută'}.`,
        `Locul de somn: ${a.sleepLocation || 'necunoscut'}.`,
        `Cum adoarme: ${a.howFallsAsleep || 'necunoscut'}.`,
        `Cu cine adoarme: ${a.sleepsWith || 'necunoscut'}.`,
        `Rutina de culcare: ${a.routine || 'necunoscută'}.`,
        `Rutina este: ${a.routineConsistent || 'necunoscut'}.`,
        `Treziri nocturne: ${a.wakesAtNightCount || 'necunoscut'}.`,
        a.wakesAtNightReaction ? `Reacție la treziri: ${a.wakesAtNightReaction}.` : '',
        `Iese afară: ${a.goesOutside || 'necunoscut'}.`,
        `Mâncare înainte de somn: ${a.eatingBeforeSleep || 'necunoscut'}.`,
        `Ecrane înainte de culcare: ${a.screenTime || 'necunoscut'}.`,
        `Muzică tare: ${a.loudMusic || 'necunoscut'}.`,
        'Ce recomandări ai pentru îmbunătățirea somnului? Analizează toate aspectele și PV-urile calculate.'
      ].filter(Boolean).join(' ')

      const cleanedAnswers = {
        ...a,
        age: ageNum !== null ? ageNum : a.age,
        numberOfNaps: napsNum !== null ? napsNum : a.numberOfNaps
      }

      const response = await askQuestion(fullQuestion, cleanedAnswers)
      setAnswer(response.answer)
      setPriorities(response.priorities || [])
      setShowFinalAnswer(true)
      setError(null)
    } catch (err) {
      setError(`Eroare la trimiterea întrebării:\n\n${err.message || 'Eroare necunoscută'}`)
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
    setRoutineItems([])
    setCustomRoutineInput('')
  }

  // ─── Progress ──────────────────────────────────────────────────────────────
  const getTotalCount = () =>
    questions.filter(q => !q.conditional || !q.showIf || q.showIf(answers)).length

  const totalQuestions = getTotalCount()
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100
  const currentQuestion = questions[currentQuestionIndex]

  const isNextDisabled = () => {
    if (loading) return true
    const q = currentQuestion
    if (q.type === 'checkbox') return selectedCheckboxes.length === 0
    if (q.type === 'napInputs') return (
      (napInputs.length > 0 && napInputs.some(n => !n.startTime || !n.duration || n.duration === '0')) ||
      !nightSleep.startTime || !nightSleep.duration || nightSleep.duration === '0' || parseFloat(nightSleep.duration) <= 0
    )
    if (q.type === 'routineBuilder') return routineItems.length === 0
    if (q.type === 'number') return !currentAnswer.toString().trim()
    return !currentAnswer.toString().trim()
  }

  // ─── Final answer screen ───────────────────────────────────────────────────
  if (showFinalAnswer) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Răspuns Expert</h2>
          <p className="text-gray-600">Iată recomandările personalizate pentru copilul tău</p>
        </div>

        <div className="mb-6">
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analiză și Recomandări
            </h3>
          </div>
          <AnswerDisplay answer={answer} priorities={priorities} answers={answers} />
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              const doc = generatePDF(answers, answer, priorities)
              doc.save(`Plan_Somn_${answers.age || 'copil'}_luni_${new Date().toISOString().split('T')[0]}.pdf`)
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
              const message = encodeURIComponent(`Plan de somn personalizat pentru copilul meu (${answers.age || 'necunoscută'} luni)\n\nAm primit recomandări expert pentru îmbunătățirea somnului.`)
              window.open(`https://wa.me/?text=${message}`, '_blank')
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Trimite pe WhatsApp
          </button>
        </div>

        <button onClick={handleReset} className="btn-primary w-full">
          Întreabă din nou
        </button>
      </div>
    )
  }

  // ─── Question form ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Întreabă un Somnolog</h2>
        <p className="text-gray-600 mb-4">Completează următoarele întrebări pentru a primi recomandări personalizate</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm text-gray-500 text-center">
          Întrebarea {currentQuestionIndex + 1} din {totalQuestions}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="label text-lg mb-3 block">{currentQuestion.question}</label>

          {/* ── Checkbox ── */}
          {currentQuestion.type === 'checkbox' && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label key={option} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
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
          )}

          {/* ── Select ── */}
          {currentQuestion.type === 'select' && (
            <select
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="input-field"
              disabled={loading}
            >
              <option value="">Selectează...</option>
              {currentQuestion.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}

          {/* ── Number ── */}
          {currentQuestion.type === 'number' && (
            <input
              type="number"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              min={currentQuestion.validation?.min}
              max={currentQuestion.validation?.max}
              className="input-field"
              disabled={loading}
            />
          )}

          {/* ── Time ── */}
          {currentQuestion.type === 'time' && (
            <input
              type="time"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="input-field"
              disabled={loading}
            />
          )}

          {/* ── Textarea ── */}
          {currentQuestion.type === 'textarea' && (
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={4}
              className="input-field resize-none"
              disabled={loading}
            />
          )}

          {/* ── Routine Builder ── */}
          {currentQuestion.type === 'routineBuilder' && (
            <div className="space-y-4">
              {/* Predefined options */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Selectează activitățile:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROUTINE_OPTIONS.map((opt) => {
                    const selected = routineItems.some(i => i.id === opt.id)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleRoutineToggle(opt)}
                        disabled={loading}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all text-left ${
                          selected
                            ? 'bg-blue-100 border-blue-500 text-blue-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom activity input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRoutineInput}
                  onChange={(e) => setCustomRoutineInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomRoutine()}
                  placeholder="Adaugă activitate custom..."
                  className="input-field flex-1"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddCustomRoutine}
                  disabled={!customRoutineInput.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors text-sm font-medium"
                >
                  + Adaugă
                </button>
              </div>

              {/* Ordered list */}
              {routineItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Ordinea rutinei (reordonează cu săgețile):</p>
                  <div className="space-y-2">
                    {routineItems.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
                        <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-gray-800 font-medium">{item.label}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleRoutineMove(idx, -1)}
                            disabled={idx === 0 || loading}
                            className="p-1 rounded text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 transition-colors"
                            title="Mută sus"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRoutineMove(idx, 1)}
                            disabled={idx === routineItems.length - 1 || loading}
                            className="p-1 rounded text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 transition-colors"
                            title="Mută jos"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRoutineRemove(idx)}
                            disabled={loading}
                            className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Elimină"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Rutina: {routineItems.map(i => i.label).join(' → ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Nap Inputs ── */}
          {currentQuestion.type === 'napInputs' && (
            <div className="space-y-4">
              {napInputs.map((nap, index) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-700 mb-3">Somnul de zi {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ora de început</label>
                      <input
                        type="time"
                        value={nap.startTime}
                        onChange={(e) => handleNapInputChange(index, 'startTime', e.target.value)}
                        className="input-field"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durata (minute)</label>
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

              <div className="p-4 border-2 border-indigo-300 rounded-lg bg-indigo-50">
                <h4 className="font-semibold text-indigo-900 mb-3">Somnul de noapte</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">Ora de început</label>
                    <input
                      type="time"
                      value={nightSleep.startTime}
                      onChange={(e) => handleNightSleepChange('startTime', e.target.value)}
                      className="input-field"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">Durata (ore)</label>
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

              {wakeWindows.filter(pv => !pv.isOk || pv.error).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <h4 className="font-bold text-red-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    PV-uri problematice:
                  </h4>
                  {wakeWindows.filter(pv => !pv.isOk || pv.error).map((pv, idx) => (
                    <div key={idx} className={`mb-3 p-3 rounded-lg ${pv.error ? 'bg-red-200 border-2 border-red-400' : pv.isTooShort ? 'bg-red-100 border border-red-300' : 'bg-amber-100 border border-amber-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">
                          PV {pv.fromType === 'zi' ? `somn zi ${pv.fromNap}` : `somn ${pv.fromNap}`} → {pv.toType === 'noapte' ? 'noapte' : `somn ${pv.toNap}`}: <strong>{pv.pvHours} ore</strong>
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${pv.error ? 'bg-red-300 text-red-900' : pv.isTooShort ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                          {pv.error ? '⚠ Date incorecte' : pv.isTooShort ? '⚠ Prea scurt' : '⚠ Prea lung'}
                        </span>
                      </div>
                      {!pv.error && (
                        <p className="text-xs text-gray-700">
                          Recomandat: <strong>{pv.recommended.min}-{pv.recommended.max} ore</strong> (optim: {pv.recommended.optimal} ore)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <pre className="text-red-800 text-sm whitespace-pre-wrap font-medium leading-relaxed">{error}</pre>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-4">
          {currentQuestionIndex > 0 && (
            <button type="button" onClick={handlePrevious} disabled={loading} className="btn-secondary flex-1">
              ← Înapoi
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled()}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
