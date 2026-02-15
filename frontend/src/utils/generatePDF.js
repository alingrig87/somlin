import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const generatePDF = (answers, answer, priorities) => {
  const doc = new jsPDF()
  
  // Culori
  const primaryColor = [59, 130, 246] // blue-500
  const successColor = [34, 197, 94] // green-500
  const warningColor = [245, 158, 11] // amber-500
  const dangerColor = [239, 68, 68] // red-500
  
  let yPos = 20
  
  // Header
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Plan de Somn Personalizat', 105, 20, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Recomandări expert pentru somnul copilului', 105, 30, { align: 'center' })
  
  yPos = 50
  doc.setTextColor(0, 0, 0)
  
  // Informații despre copil
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Informații despre copil', 14, yPos)
  yPos += 10
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const age = answers.age || 'necunoscută'
  const naps = answers.numberOfNaps || 'necunoscut'
  doc.text(`Vârstă: ${age} luni`, 14, yPos)
  yPos += 7
  doc.text(`Număr somnuri de zi: ${naps}`, 14, yPos)
  yPos += 7
  
  // Programul perfect de somn pentru vârstă
  const ageMonths = parseInt(age) || 0
  let sleepSchedule = getSleepScheduleForAge(ageMonths)
  
  if (sleepSchedule) {
    yPos += 5
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Programul Perfect de Somn', 14, yPos)
    yPos += 10
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Somn total recomandat: ${sleepSchedule.totalHours.min}-${sleepSchedule.totalHours.max} ore`, 14, yPos)
    yPos += 6
    doc.text(`Somnuri de zi: ${sleepSchedule.naps.min}-${sleepSchedule.naps.max} somnuri`, 14, yPos)
    yPos += 6
    doc.text(`Somn nocturn: ${sleepSchedule.nightSleep.min}-${sleepSchedule.nightSleep.max} ore`, 14, yPos)
    yPos += 6
    doc.text(`Perioade de veghe (PV): ${sleepSchedule.wakeWindows}`, 14, yPos)
    yPos += 6
    doc.text(`Ora culcării recomandată: ${sleepSchedule.bedtime}`, 14, yPos)
    yPos += 10
  }
  
  // Recomandări principale
  if (answer) {
    // Verifică dacă trebuie pagină nouă
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Recomandări și Analiză', 14, yPos)
    yPos += 10
    
    // Parsează și adaugă textul răspunsului
    const cleanAnswer = answer.replace(/\*\*/g, '').replace(/\*/g, '')
    const lines = doc.splitTextToSize(cleanAnswer, 180)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    lines.forEach((line) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      doc.text(line, 14, yPos)
      yPos += 6
    })
    yPos += 5
  }
  
  // Priorități
  if (priorities && priorities.length > 0) {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Plan de Acțiune - Priorități', 14, yPos)
    yPos += 10
    
    // Grupează prioritățile după nivel
    const urgent = priorities.filter(p => p.level === 'urgent')
    const important = priorities.filter(p => p.level === 'important')
    const moderate = priorities.filter(p => p.level === 'moderate')
    
    // Priorități urgente
    if (urgent.length > 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...dangerColor)
      doc.text('URGENT', 14, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      urgent.forEach((priority, idx) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}. ${priority.title || priority.recommendation?.substring(0, 50)}`, 14, yPos)
        yPos += 6
        doc.setFont('helvetica', 'normal')
        const desc = priority.recommendation || priority.description || ''
        const descLines = doc.splitTextToSize(desc, 180)
        descLines.forEach(line => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, 20, yPos)
          yPos += 5
        })
        if (priority.duration) {
          doc.text(`Durată estimată: ${priority.duration}`, 20, yPos)
          yPos += 5
        }
        yPos += 3
      })
    }
    
    // Priorități importante
    if (important.length > 0) {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...warningColor)
      doc.text('IMPORTANT', 14, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      important.forEach((priority, idx) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}. ${priority.title || priority.recommendation?.substring(0, 50)}`, 14, yPos)
        yPos += 6
        doc.setFont('helvetica', 'normal')
        const desc = priority.recommendation || priority.description || ''
        const descLines = doc.splitTextToSize(desc, 180)
        descLines.forEach(line => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, 20, yPos)
          yPos += 5
        })
        if (priority.duration) {
          doc.text(`Durată estimată: ${priority.duration}`, 20, yPos)
          yPos += 5
        }
        yPos += 3
      })
    }
    
    // Priorități moderate
    if (moderate.length > 0) {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryColor)
      doc.text('MODERAT', 14, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      moderate.forEach((priority, idx) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}. ${priority.title || priority.recommendation?.substring(0, 50)}`, 14, yPos)
        yPos += 6
        doc.setFont('helvetica', 'normal')
        const desc = priority.recommendation || priority.description || ''
        const descLines = doc.splitTextToSize(desc, 180)
        descLines.forEach(line => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, 20, yPos)
          yPos += 5
        })
        if (priority.duration) {
          doc.text(`Durată estimată: ${priority.duration}`, 20, yPos)
          yPos += 5
        }
        yPos += 3
      })
    }
  }
  
  // Footer pe ultima pagină
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Pagina ${i} din ${pageCount} - Generat de Somlin`,
      105,
      290,
      { align: 'center' }
    )
  }
  
  return doc
}

const getSleepScheduleForAge = (ageMonths) => {
  if (ageMonths <= 3) {
    return {
      totalHours: { min: 14, max: 17, optimal: 15.5 },
      naps: { min: 4, max: 6, optimal: 5 },
      nightSleep: { min: 8, max: 10, optimal: 9 },
      wakeWindows: '45-90 minute',
      bedtime: '19:00-20:00'
    }
  } else if (ageMonths <= 6) {
    return {
      totalHours: { min: 13, max: 16, optimal: 14.5 },
      naps: { min: 3, max: 5, optimal: 4 },
      nightSleep: { min: 9, max: 11, optimal: 10 },
      wakeWindows: '1.5-2.5 ore',
      bedtime: '19:00-20:00'
    }
  } else if (ageMonths <= 12) {
    return {
      totalHours: { min: 12, max: 15, optimal: 13.5 },
      naps: { min: 2, max: 3, optimal: 2 },
      nightSleep: { min: 10, max: 12, optimal: 11 },
      wakeWindows: '2.5-4 ore',
      bedtime: '19:00-20:00'
    }
  } else if (ageMonths <= 18) {
    return {
      totalHours: { min: 11, max: 14, optimal: 12.5 },
      naps: { min: 1, max: 2, optimal: 2 },
      nightSleep: { min: 10, max: 12, optimal: 11 },
      wakeWindows: '4-5 ore',
      bedtime: '19:00-20:00'
    }
  } else if (ageMonths <= 24) {
    return {
      totalHours: { min: 11, max: 14, optimal: 12.5 },
      naps: { min: 1, max: 2, optimal: 1 },
      nightSleep: { min: 10, max: 12, optimal: 11 },
      wakeWindows: '5-6 ore',
      bedtime: '19:00-20:00'
    }
  } else if (ageMonths <= 36) {
    return {
      totalHours: { min: 10, max: 13, optimal: 11.5 },
      naps: { min: 0, max: 1, optimal: 1 },
      nightSleep: { min: 10, max: 12, optimal: 11 },
      wakeWindows: '5.5-6.5 ore',
      bedtime: '19:00-20:00'
    }
  } else {
    return {
      totalHours: { min: 10, max: 13, optimal: 11.5 },
      naps: { min: 0, max: 1, optimal: 0 },
      nightSleep: { min: 10, max: 12, optimal: 11 },
      wakeWindows: '6-7 ore',
      bedtime: '19:00-20:30'
    }
  }
}
