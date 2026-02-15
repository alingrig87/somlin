import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'

const SleepForm = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      childAge: '',
      childAgeMonths: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      numberOfNaps: '1',
      bedtime: '',
      wakeTime: '',
      napTimes: [],
      totalSleepHours: '',
      sleepQuality: 'good',
      putToSleepBy: 'parent',
      sleepLocation: 'ownBed',
      sleepRoutine: [],
      issues: [],
      notes: '',
    },
  })

  const childAge = watch('childAge')
  const numberOfNaps = watch('numberOfNaps')
  const sleepRoutine = watch('sleepRoutine') || []

  // Funcții pentru demo - 20 de situații problematice
  const loadDemoCase1 = () => {
    // Copil 2 luni - somn insuficient, treziri foarte frecvente
    setValue('childAge', '2')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '22:00')
    setValue('wakeTime', '05:00')
    // Așteaptă puțin pentru ca napOptions să se calculeze, apoi setează numberOfNaps
    setTimeout(() => {
      setValue('numberOfNaps', '5')
      setValue('napTimes', [
        { startTime: '08:00', duration: 30 },
        { startTime: '11:00', duration: 45 },
        { startTime: '14:00', duration: 30 },
        { startTime: '16:30', duration: 40 },
        { startTime: '19:00', duration: 25 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '11')
    setValue('sleepQuality', 'veryPoor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'parentsBed')
    setValue('sleepRoutine', [])
    setValue('issues', ['treziri frecvente', 'plâns în timpul nopții', 'dificultate la adormit'])
    setValue('notes', 'Copilul se trezește la fiecare 30-45 minute, plânge mult și nu doarme suficient.')
  }

  const loadDemoCase2 = () => {
    // Copil 4 luni - regresie somn, treziri constante
    setValue('childAge', '4')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '21:30')
    setValue('wakeTime', '06:00')
    setTimeout(() => {
      setValue('numberOfNaps', '4')
      setValue('napTimes', [
        { startTime: '09:00', duration: 45 },
        { startTime: '12:00', duration: 60 },
        { startTime: '15:00', duration: 30 },
        { startTime: '17:30', duration: 20 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '12')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'bothParents')
    setValue('sleepLocation', 'crib')
    setValue('sleepRoutine', ['cântec'])
    setValue('issues', ['treziri frecvente', 'dificultate la adormit', 'refuz să se culce'])
    setValue('notes', 'După 4 luni, copilul a început să se trezească foarte des și refuză să se culce.')
  }

  const loadDemoCase3 = () => {
    // Copil 6 luni - somn fragmentat, oboseală excesivă
    setValue('childAge', '6')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '20:00')
    setValue('wakeTime', '05:30')
    setTimeout(() => {
      setValue('numberOfNaps', '3')
      setValue('napTimes', [
        { startTime: '10:00', duration: 40 },
        { startTime: '13:30', duration: 50 },
        { startTime: '16:00', duration: 35 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '10.5')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'crib')
    setValue('sleepRoutine', ['poveste'])
    setValue('issues', ['treziri frecvente', 'treziri devreme', 'plâns în timpul nopții'])
    setValue('notes', 'Copilul se trezește devreme și are somn foarte fragmentat pe parcursul nopții.')
  }

  const loadDemoCase4 = () => {
    // Copil 8 luni - tăiere dinți, somn agitat
    setValue('childAge', '8')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '20:30')
    setValue('wakeTime', '06:00')
    setTimeout(() => {
      setValue('numberOfNaps', '2')
      setValue('napTimes', [
        { startTime: '10:30', duration: 60 },
        { startTime: '14:00', duration: 45 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '11')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'parentsBed')
    setValue('sleepRoutine', ['baie', 'poveste'])
    setValue('issues', ['treziri frecvente', 'plâns în timpul nopții', 'dificultate la adormit'])
    setValue('notes', 'Copilul tăie dinții, se trezește plângând și nu se poate calma decât dacă e luat în brațe.')
  }

  const loadDemoCase5 = () => {
    // Copil 10 luni - regresie somn, separare anxietate
    setValue('childAge', '10')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '21:00')
    setValue('wakeTime', '06:30')
    setTimeout(() => {
      setValue('numberOfNaps', '2')
      setValue('napTimes', [
        { startTime: '11:00', duration: 50 },
        { startTime: '15:00', duration: 40 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '9.5')
    setValue('sleepQuality', 'veryPoor')
    setValue('putToSleepBy', 'bothParents')
    setValue('sleepLocation', 'parentsBed')
    setValue('sleepRoutine', ['poveste', 'lumină stinsă'])
    setValue('issues', ['treziri frecvente', 'dificultate la adormit', 'refuz să se culce', 'plâns în timpul nopții'])
    setValue('notes', 'Copilul refuză să se culce singur, se trezește constant și cere să fie luat în brațe.')
  }

  const loadDemoCase6 = () => {
    // Copil 12 luni - somn insuficient, obiceiuri nepotrivite
    setValue('childAge', '12')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '22:00')
    setValue('wakeTime', '06:00')
    setTimeout(() => {
      setValue('numberOfNaps', '1')
      setValue('napTimes', [
        { startTime: '13:00', duration: 60 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '9')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'parentsBed')
    setValue('sleepRoutine', ['lapte/mâncare'])
    setValue('issues', ['treziri frecvente', 'dificultate la adormit', 'treziri devreme'])
    setValue('notes', 'Copilul doarme prea puțin, se culcă târziu și se trezește devreme. Are nevoie de lapte pentru a adormi.')
  }

  const loadDemoCase7 = () => {
    // Copil 14 luni - refuz somn, lupte de putere
    setValue('childAge', '14')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '21:30')
    setValue('wakeTime', '05:30')
    setTimeout(() => {
      setValue('numberOfNaps', '1')
      setValue('napTimes', [
        { startTime: '13:30', duration: 45 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '9.5')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'bothParents')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['poveste'])
    setValue('issues', ['refuz să se culce', 'dificultate la adormit', 'treziri frecvente'])
    setValue('notes', 'Copilul refuză categoric să se culce, iese din pat constant și face crize când îl culci.')
  }

  const loadDemoCase8 = () => {
    // Copil 16 luni - somn fragmentat, oboseală
    setValue('childAge', '16')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '20:00')
    setValue('wakeTime', '06:00')
    setTimeout(() => {
      setValue('numberOfNaps', '1')
      setValue('napTimes', [
        { startTime: '12:30', duration: 90 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '10')
    setValue('sleepQuality', 'fair')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['baie', 'poveste'])
    setValue('issues', ['treziri frecvente', 'treziri devreme'])
    setValue('notes', 'Copilul se trezește de 4-5 ori pe noapte și se trezește devreme, pare obosit pe parcursul zilei.')
  }

  const loadDemoCase9 = () => {
    // Copil 18 luni - terrori nocturne, somn agitat
    setValue('childAge', '18')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '21:00')
    setValue('wakeTime', '06:30')
    setTimeout(() => {
      setValue('numberOfNaps', '1')
      setValue('napTimes', [
        { startTime: '13:00', duration: 90 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '10.5')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'bothParents')
    setValue('sleepLocation', 'parentsBed')
    setValue('sleepRoutine', ['poveste', 'lumină stinsă'])
    setValue('issues', ['terrori nocturne', 'treziri frecvente', 'plâns în timpul nopții'])
    setValue('notes', 'Copilul are episoade de terrori nocturne, se trezește țipând și nu se poate calma rapid.')
  }

  const loadDemoCase10 = () => {
    // Copil 20 luni - refuz somn, obiceiuri nepotrivite
    setValue('childAge', '20')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '22:00')
    setValue('wakeTime', '07:00')
    setTimeout(() => {
      setValue('numberOfNaps', '1')
      setValue('napTimes', [
        { startTime: '14:00', duration: 60 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '9')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'parentsBed')
    setValue('sleepRoutine', ['lapte/mâncare', 'cântec'])
    setValue('issues', ['refuz să se culce', 'dificultate la adormit', 'treziri frecvente'])
    setValue('notes', 'Copilul refuză să se culce în patul său, cere constant lapte și se trezește de multe ori.')
  }

  const loadDemoCase11 = () => {
    // Copil 22 luni - somn insuficient, oboseală excesivă
    setValue('childAge', '22')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '20:30')
    setValue('wakeTime', '05:00')
    setTimeout(() => {
      setValue('numberOfNaps', '1')
      setValue('napTimes', [
        { startTime: '12:00', duration: 75 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '8.5')
    setValue('sleepQuality', 'veryPoor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['baie'])
    setValue('issues', ['treziri devreme', 'treziri frecvente', 'dificultate la adormit'])
    setValue('notes', 'Copilul se trezește foarte devreme și doarme prea puțin, pare obosit și iritabil pe parcursul zilei.')
  }

  const loadDemoCase12 = () => {
    // Copil 24 luni - coșmaruri, somn agitat
    setValue('childAge', '24')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '21:00')
    setValue('wakeTime', '06:00')
    setTimeout(() => {
      setValue('numberOfNaps', '1')
      setValue('napTimes', [
        { startTime: '13:00', duration: 90 }
      ])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '9')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['baie', 'poveste', 'cântec'])
    setValue('issues', ['coșmaruri', 'treziri frecvente', 'plâns în timpul nopții'])
    setValue('notes', 'Copilul are coșmaruri frecvente, se trezește plângând și are nevoie de consolare pentru a readormi.')
  }

  const loadDemoCase13 = () => {
    // Copil 28 luni - somnambulism, somn agitat
    setValue('childAge', '28')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '20:00')
    setValue('wakeTime', '06:30')
    setTimeout(() => {
      setValue('numberOfNaps', '0')
      setValue('napTimes', [])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '10.5')
    setValue('sleepQuality', 'fair')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['baie', 'poveste'])
    setValue('issues', ['somnambulism', 'treziri frecvente'])
    setValue('notes', 'Copilul umblă în somn, se trezește des și nu-și amintește dimineața ce s-a întâmplat.')
  }

  const loadDemoCase14 = () => {
    // Copil 30 luni - grindănit dinți, somn agitat
    setValue('childAge', '30')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '21:00')
    setValue('wakeTime', '06:00')
    setTimeout(() => {
      setValue('numberOfNaps', '0')
      setValue('napTimes', [])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '9')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['poveste', 'muzică relaxantă'])
    setValue('issues', ['grindănit dinți', 'treziri frecvente', 'ronțăit'])
    setValue('notes', 'Copilul scârțâie dinții în somn, ronțăie și se trezește des. Zgomotul este foarte puternic.')
  }

  const loadDemoCase15 = () => {
    // Copil 32 luni - apnee de somn, somn agitat
    setValue('childAge', '32')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '20:30')
    setValue('wakeTime', '06:00')
    setTimeout(() => {
      setValue('numberOfNaps', '0')
      setValue('napTimes', [])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '9.5')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['baie', 'poveste'])
    setValue('issues', ['apnee de somn', 'ronțăit', 'treziri frecvente'])
    setValue('notes', 'Copilul ronțăie foarte tare și pare să aibă pauze în respirație în timpul somnului.')
  }

  const loadDemoCase16 = () => {
    // Copil 36 luni - transpirație excesivă, somn agitat
    setValue('childAge', '36')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '21:00')
    setValue('wakeTime', '06:30')
    setTimeout(() => {
      setValue('numberOfNaps', '0')
      setValue('napTimes', [])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '9.5')
    setValue('sleepQuality', 'fair')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['baie', 'poveste', 'cântec'])
    setValue('issues', ['transpirație excesivă', 'treziri frecvente'])
    setValue('notes', 'Copilul transpiră foarte mult în somn, pijamaua și așternuturile sunt ude dimineața.')
  }

  const loadDemoCase17 = () => {
    // Copil 40 luni - coșmaruri frecvente, refuz somn
    setValue('childAge', '40')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '22:00')
    setValue('wakeTime', '07:00')
    setTimeout(() => {
      setValue('numberOfNaps', '0')
      setValue('napTimes', [])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '9')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['poveste'])
    setValue('issues', ['coșmaruri', 'refuz să se culce', 'treziri frecvente'])
    setValue('notes', 'Copilul refuză să se culce din cauza coșmarurilor, se trezește plângând și are frică de întuneric.')
  }

  const loadDemoCase18 = () => {
    // Copil 42 luni - somn insuficient, oboseală
    setValue('childAge', '42')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '22:30')
    setValue('wakeTime', '06:00')
    setTimeout(() => {
      setValue('numberOfNaps', '0')
      setValue('napTimes', [])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '7.5')
    setValue('sleepQuality', 'veryPoor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', [])
    setValue('issues', ['dificultate la adormit', 'treziri devreme', 'treziri frecvente'])
    setValue('notes', 'Copilul doarme extrem de puțin, se culcă foarte târziu și se trezește devreme. Este obosit constant.')
  }

  const loadDemoCase19 = () => {
    // Copil 44 luni - multiple probleme, somn agitat
    setValue('childAge', '44')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '21:30')
    setValue('wakeTime', '05:30')
    setTimeout(() => {
      setValue('numberOfNaps', '0')
      setValue('napTimes', [])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '8')
    setValue('sleepQuality', 'veryPoor')
    setValue('putToSleepBy', 'bothParents')
    setValue('sleepLocation', 'parentsBed')
    setValue('sleepRoutine', ['poveste'])
    setValue('issues', ['treziri frecvente', 'dificultate la adormit', 'coșmaruri', 'refuz să se culce', 'plâns în timpul nopții'])
    setValue('notes', 'Copilul are multiple probleme de somn: se trezește des, are coșmaruri, refuză să se culce și plânge mult.')
  }

  const loadDemoCase20 = () => {
    // Copil 48 luni - somn fragmentat, oboseală
    setValue('childAge', '48')
    setValue('date', format(new Date(), 'yyyy-MM-dd'))
    setValue('bedtime', '22:00')
    setValue('wakeTime', '06:00')
    setTimeout(() => {
      setValue('numberOfNaps', '0')
      setValue('napTimes', [])
      trigger('numberOfNaps')
    }, 100)
    setValue('totalSleepHours', '8')
    setValue('sleepQuality', 'poor')
    setValue('putToSleepBy', 'parent')
    setValue('sleepLocation', 'ownBed')
    setValue('sleepRoutine', ['baie'])
    setValue('issues', ['treziri frecvente', 'treziri devreme', 'dificultate la adormit'])
    setValue('notes', 'Copilul are somn foarte fragmentat, se trezește de multe ori pe noapte și se trezește devreme.')
  }

  // Opțiuni pentru vârstă (0-4 ani)
  const ageOptions = Array.from({ length: 49 }, (_, i) => {
    const months = i
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (years === 0) {
      return { value: months, label: `${months} luni` }
    } else if (remainingMonths === 0) {
      return { value: months, label: `${years} ${years === 1 ? 'an' : 'ani'}` }
    } else {
      return {
        value: months,
        label: `${years} ${years === 1 ? 'an' : 'ani'} ${remainingMonths} ${remainingMonths === 1 ? 'lună' : 'luni'}`,
      }
    }
  })

  // Număr de somnuri în funcție de vârstă
  const getNapOptions = () => {
    if (!childAge) return []
    const ageInMonths = parseInt(childAge)
    
    if (ageInMonths < 6) return ['3', '4', '5', '6'] // 3-6 somnuri pentru 0-6 luni
    if (ageInMonths < 12) return ['2', '3', '4'] // 2-4 somnuri pentru 6-12 luni
    if (ageInMonths < 18) return ['1', '2', '3'] // 1-3 somnuri pentru 12-18 luni
    if (ageInMonths < 24) return ['1', '2'] // 1-2 somnuri pentru 18-24 luni
    return ['0', '1'] // 0-1 somn pentru 2-4 ani
  }

  const napOptions = getNapOptions()

  const onSubmitForm = (data) => {
    // Procesare date pentru JSON
    const processedData = {
      ...data,
      childAge: data.childAge || String(parseInt(data.childAge) || 0), // Asigură că childAge există
      childAgeMonths: parseInt(data.childAge),
      childAgeYears: (parseInt(data.childAge) / 12).toFixed(1),
      numberOfNaps: parseInt(data.numberOfNaps),
      totalSleepHours: parseFloat(data.totalSleepHours) || null,
      napTimes: Array.isArray(data.napTimes)
        ? data.napTimes.map((nap) => ({
            startTime: nap.startTime || nap, // Backward compatibility
            duration: parseInt(nap.duration) || null,
            durationHours: nap.duration
              ? (parseInt(nap.duration) / 60).toFixed(2)
              : null,
          }))
        : [],
      sleepRoutine: Array.isArray(data.sleepRoutine) ? data.sleepRoutine : [],
      issues: Array.isArray(data.issues) ? data.issues : [],
      timestamp: new Date().toISOString(),
    }
    onSubmit(processedData)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6"
    >
      {/* Butoane Demo - 20 Situații Problematică */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-5 h-5 text-red-600"
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
          <h3 className="font-semibold text-red-900">
            Demo - Situații Problematică (20 scenarii)
          </h3>
        </div>
        <p className="text-sm text-red-800 mb-3">
          Click pe unul dintre butoanele de mai jos pentru a completa automat formularul cu situații problematice de somn:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={loadDemoCase1}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="2 luni - Somn insuficient, treziri foarte frecvente"
          >
            Demo 1: 2 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase2}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="4 luni - Regresie somn"
          >
            Demo 2: 4 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase3}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="6 luni - Somn fragmentat"
          >
            Demo 3: 6 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase4}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="8 luni - Tăiere dinți"
          >
            Demo 4: 8 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase5}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="10 luni - Regresie somn, anxietate"
          >
            Demo 5: 10 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase6}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="12 luni - Somn insuficient"
          >
            Demo 6: 12 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase7}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="14 luni - Refuz somn"
          >
            Demo 7: 14 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase8}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="16 luni - Somn fragmentat"
          >
            Demo 8: 16 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase9}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="18 luni - Terrori nocturne"
          >
            Demo 9: 18 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase10}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="20 luni - Refuz somn"
          >
            Demo 10: 20 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase11}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="22 luni - Somn insuficient"
          >
            Demo 11: 22 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase12}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="24 luni - Coșmaruri"
          >
            Demo 12: 24 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase13}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="28 luni - Somnambulism"
          >
            Demo 13: 28 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase14}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="30 luni - Grindănit dinți"
          >
            Demo 14: 30 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase15}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="32 luni - Apnee de somn"
          >
            Demo 15: 32 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase16}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="36 luni - Transpirație"
          >
            Demo 16: 36 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase17}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="40 luni - Coșmaruri frecvente"
          >
            Demo 17: 40 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase18}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="42 luni - Somn insuficient"
          >
            Demo 18: 42 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase19}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="44 luni - Multiple probleme"
          >
            Demo 19: 44 luni
          </button>
          <button
            type="button"
            onClick={loadDemoCase20}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            title="48 luni - Somn fragmentat"
          >
            Demo 20: 48 luni
          </button>
        </div>
      </div>

      {/* Informații Copil */}
      <section className="border-b pb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Informații Copil
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Vârsta copilului <span className="text-red-500">*</span>
            </label>
            <select
              {...register('childAge', { required: 'Selectează vârsta' })}
              className="input-field"
            >
              <option value="">Selectează vârsta...</option>
              {ageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.childAge && (
              <p className="text-red-500 text-sm mt-1">
                {errors.childAge.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">
              Data <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('date', { required: 'Selectează data' })}
              className="input-field"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Program Somn */}
      <section className="border-b pb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Program Somn
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">
              Ora culcării (seară) <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              {...register('bedtime', { required: 'Selectează ora culcării' })}
              className="input-field"
            />
            {errors.bedtime && (
              <p className="text-red-500 text-sm mt-1">
                {errors.bedtime.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">
              Ora trezirii (dimineață) <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              {...register('wakeTime', { required: 'Selectează ora trezirii' })}
              className="input-field"
            />
            {errors.wakeTime && (
              <p className="text-red-500 text-sm mt-1">
                {errors.wakeTime.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Număr de somnuri (siestă) <span className="text-red-500">*</span>
            </label>
            <select
              {...register('numberOfNaps', {
                required: 'Selectează numărul de somnuri',
              })}
              className="input-field"
              disabled={!childAge || napOptions.length === 0}
            >
              <option value="">
                {!childAge
                  ? 'Selectează mai întâi vârsta'
                  : 'Selectează numărul de somnuri...'}
              </option>
              {napOptions.map((num) => (
                <option key={num} value={num}>
                  {num === '0'
                    ? 'Fără somn'
                    : `${num} ${num === '1' ? 'somn' : 'somnuri'}`}
                </option>
              ))}
            </select>
            {errors.numberOfNaps && (
              <p className="text-red-500 text-sm mt-1">
                {errors.numberOfNaps.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">
              Durată totală somn (ore) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              {...register('totalSleepHours', {
                required: 'Introdu durata totală de somn',
                min: { value: 0, message: 'Minim 0 ore' },
                max: { value: 24, message: 'Maxim 24 ore' },
              })}
              className="input-field"
              placeholder="ex: 12.5"
            />
            {errors.totalSleepHours && (
              <p className="text-red-500 text-sm mt-1">
                {errors.totalSleepHours.message}
              </p>
            )}
          </div>
        </div>

        {/* Detalii somnuri (dacă are somnuri) */}
        {numberOfNaps && parseInt(numberOfNaps) > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <label className="label text-lg font-semibold">
              Detalii somnuri (siestă) <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Completează ora de început și durata pentru fiecare somn
            </p>
            <div className="space-y-4">
              {Array.from({ length: parseInt(numberOfNaps) }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg border border-gray-200"
                >
                  <h3 className="font-medium text-gray-800 mb-3">
                    Somn {index + 1}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label text-sm">
                        Ora de început <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        {...register(`napTimes.${index}.startTime`, {
                          required: `Selectează ora de început pentru somnul ${index + 1}`,
                        })}
                        className="input-field"
                      />
                      {errors.napTimes?.[index]?.startTime && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.napTimes[index].startTime.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label text-sm">
                        Durată (minute) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        step="5"
                        {...register(`napTimes.${index}.duration`, {
                          required: `Introdu durata pentru somnul ${index + 1}`,
                          min: { value: 5, message: 'Minim 5 minute' },
                          max: { value: 300, message: 'Maxim 300 minute (5 ore)' },
                        })}
                        className="input-field"
                        placeholder="ex: 90 (minute)"
                      />
                      {errors.napTimes?.[index]?.duration && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.napTimes[index].duration.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Detalii Somn */}
      <section className="border-b pb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Detalii Somn
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">
              Calitatea somnului <span className="text-red-500">*</span>
            </label>
            <select
              {...register('sleepQuality', {
                required: 'Selectează calitatea somnului',
              })}
              className="input-field"
            >
              <option value="excellent">Excelent</option>
              <option value="good">Bun</option>
              <option value="fair">Acceptabil</option>
              <option value="poor">Slab</option>
              <option value="veryPoor">Foarte slab</option>
            </select>
            {errors.sleepQuality && (
              <p className="text-red-500 text-sm mt-1">
                {errors.sleepQuality.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">
              Culcat de <span className="text-red-500">*</span>
            </label>
            <select
              {...register('putToSleepBy', {
                required: 'Selectează cine îl culcă',
              })}
              className="input-field"
            >
              <option value="parent">Părinte</option>
              <option value="bothParents">Ambii părinți</option>
              <option value="grandparent">Bunic/Bunică</option>
              <option value="babysitter">Babysitter</option>
              <option value="alone">Singur (self-soothing)</option>
              <option value="other">Altcineva</option>
            </select>
            {errors.putToSleepBy && (
              <p className="text-red-500 text-sm mt-1">
                {errors.putToSleepBy.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="label">
            Locul de somn <span className="text-red-500">*</span>
          </label>
          <select
            {...register('sleepLocation', {
              required: 'Selectează locul de somn',
            })}
            className="input-field"
          >
            <option value="ownBed">Pat propriu</option>
            <option value="parentsBed">Pat cu părinții</option>
            <option value="crib">Pătuț (crib)</option>
            <option value="bassinet">Bassinet</option>
            <option value="roomShare">Împărtășește camera cu părinții</option>
            <option value="other">Alt loc</option>
          </select>
          {errors.sleepLocation && (
            <p className="text-red-500 text-sm mt-1">
              {errors.sleepLocation.message}
            </p>
          )}
        </div>
      </section>

      {/* Rutină Pre-Somn */}
      <section className="border-b pb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Rutină Pre-Somn
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Selectează activitățile din rutina de culcare:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            'Baie',
            'Poveste',
            'Cântec',
            'Masaj',
            'Lapte/Mâncare',
            'Lumină stinsă',
            'Muzică relaxantă',
            'Joc calm',
            'Meditație/Respirație',
            'Altele',
          ].map((activity) => (
            <label
              key={activity}
              className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
            >
              <input
                type="checkbox"
                value={activity.toLowerCase()}
                {...register('sleepRoutine')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{activity}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Probleme/Probleme */}
      <section className="border-b pb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Probleme/Probleme
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Selectează problemele întâmpinate (dacă există):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Treziri frecvente',
            'Dificultate la adormit',
            'Treziri devreme',
            'Plâns în timpul nopții',
            'Coșmaruri',
            'Terrori nocturne',
            'Somnambulism',
            'Grindănit dinți',
            'Apnee de somn',
            'Ronțăit',
            'Transpirație excesivă',
            'Refuz să se culce',
            'Niciuna',
          ].map((issue) => (
            <label
              key={issue}
              className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
            >
              <input
                type="checkbox"
                value={issue.toLowerCase()}
                {...register('issues')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{issue}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Observații */}
      <section>
        <label className="label">Observații suplimentare</label>
        <textarea
          {...register('notes')}
          rows="4"
          className="input-field"
          placeholder="Adaugă orice observații sau detalii suplimentare despre somnul copilului..."
        />
      </section>

      {/* Butoane */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <button type="submit" className="btn-primary flex-1">
          Trimite Formular
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-secondary flex-1"
        >
          Resetează
        </button>
      </div>
    </form>
  )
}

export default SleepForm
