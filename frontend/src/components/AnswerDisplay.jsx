import { useMemo } from 'react'

const AnswerDisplay = ({ answer }) => {
  const formattedAnswer = useMemo(() => {
    if (!answer) return null

    // Parsează răspunsul și îl formatează
    const lines = answer.split('\n').filter(line => line.trim())
    const sections = []
    let currentSection = null
    let currentContent = []

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      // Detectează "Ce face bine" (prioritate mai mare)
      if (trimmed.match(/\*\*Ce face bine:\*\*/i) || trimmed.match(/^Ce face bine:/i)) {
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: currentContent.join('\n')
          })
        }
        currentSection = {
          title: 'Ce face bine',
          type: 'positive',
          icon: '✓'
        }
        currentContent = []
        const content = trimmed.replace(/\*\*Ce face bine:\*\*/gi, '').replace(/^Ce face bine:/gi, '').trim()
        if (content) currentContent.push(content)
      }
      // Detectează "Ce nu face bine"
      else if (trimmed.match(/\*\*Ce nu face bine:\*\*/i) || trimmed.match(/^Ce nu face bine:/i)) {
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: currentContent.join('\n')
          })
        }
        currentSection = {
          title: 'Ce nu face bine',
          type: 'negative',
          icon: '⚠'
        }
        currentContent = []
        const content = trimmed.replace(/\*\*Ce nu face bine:\*\*/gi, '').replace(/^Ce nu face bine:/gi, '').trim()
        if (content) currentContent.push(content)
      }
      // Detectează "Problema principală"
      else if (trimmed.match(/\*\*Problema principală:\*\*/i) || trimmed.match(/^Problema principală:/i)) {
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: currentContent.join('\n')
          })
        }
        currentSection = {
          title: 'Problema principală',
          type: 'problem',
          icon: '🔴'
        }
        currentContent = []
        const content = trimmed.replace(/\*\*Problema principală:\*\*/gi, '').replace(/^Problema principală:/gi, '').trim()
        if (content) currentContent.push(content)
      }
      // Detectează secțiuni principale (titluri cu **)
      else if (trimmed.match(/^\*\*.*\*\*$/) && trimmed.length > 4) {
        // Salvează secțiunea anterioară dacă există
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: currentContent.join('\n')
          })
        }
        
        // Creează secțiune nouă
        const title = trimmed.replace(/\*\*/g, '').replace(/:$/, '')
        currentSection = {
          title,
          type: 'section'
        }
        currentContent = []
      }
      // Detectează bullet points
      else if (trimmed.match(/^[-*–]\s/)) {
        currentContent.push(trimmed)
      }
      // Alt text
      else {
        if (trimmed) {
          currentContent.push(trimmed)
        }
      }
    })

    // Adaugă ultima secțiune
    if (currentSection) {
      sections.push({
        ...currentSection,
        content: currentContent.join('\n')
      })
    }

    return sections.length > 0 ? sections : [{ type: 'text', content: answer }]
  }, [answer])

  if (!formattedAnswer || formattedAnswer.length === 0) {
    return (
      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {answer}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {formattedAnswer.map((section, index) => {
        // Dacă este text simplu
        if (section.type === 'text') {
          return (
            <div key={index} className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          )
        }

        // Secțiuni speciale
        const getSectionStyles = () => {
          switch (section.type) {
            case 'positive':
              return {
                bg: 'bg-green-50',
                border: 'border-green-200',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600',
                titleColor: 'text-green-900',
                textColor: 'text-green-800'
              }
            case 'negative':
              return {
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-600',
                titleColor: 'text-amber-900',
                textColor: 'text-amber-800'
              }
            case 'problem':
              return {
                bg: 'bg-red-50',
                border: 'border-red-200',
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600',
                titleColor: 'text-red-900',
                textColor: 'text-red-800'
              }
            default:
              return {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                titleColor: 'text-blue-900',
                textColor: 'text-blue-800'
              }
          }
        }

        const styles = getSectionStyles()

        return (
          <div
            key={index}
            className={`${styles.bg} ${styles.border} border rounded-lg p-5 shadow-sm`}
          >
            <div className="flex items-start mb-3">
              <div className={`${styles.iconBg} ${styles.iconColor} rounded-full p-2 mr-3 flex-shrink-0`}>
                {section.type === 'positive' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {section.type === 'negative' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {section.type === 'problem' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {section.type === 'section' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <h4 className={`${styles.titleColor} font-bold text-lg flex-1`}>
                {section.title}
              </h4>
            </div>
            <div className={`${styles.textColor} leading-relaxed space-y-2`}>
              {section.content.split('\n').map((line, lineIndex) => {
                const trimmed = line.trim()
                if (!trimmed) return null
                
                // Detectează bullet points
                if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('–')) {
                  const content = trimmed.replace(/^[-*–]\s*/, '')
                  return (
                    <div key={lineIndex} className="flex items-start">
                      <span className="mr-2 mt-1.5">•</span>
                      <span className="flex-1">{content}</span>
                    </div>
                  )
                }
                
                // Text normal
                return (
                  <p key={lineIndex} className="mb-2 last:mb-0">
                    {trimmed}
                  </p>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AnswerDisplay
