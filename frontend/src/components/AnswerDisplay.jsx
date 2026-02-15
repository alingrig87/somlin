import { useMemo } from 'react'

const AnswerDisplay = ({ answer, priorities = [] }) => {
  const formattedAnswer = useMemo(() => {
    if (!answer) return null

    // Parsează răspunsul și îl formatează
    const lines = answer.split('\n').filter(line => line.trim())
    const sections = []
    let currentSection = null
    let currentContent = []
    let currentSubsection = null

    lines.forEach((line) => {
      const trimmed = line.trim()
      
      // Detectează "Ce face bine"
      if (trimmed.match(/\*\*Ce face bine:\*\*/i) || trimmed.match(/^Ce face bine:/i)) {
        if (currentSubsection) {
          if (currentSection) {
            if (!currentSection.subsections) currentSection.subsections = []
            currentSection.subsections.push(currentSubsection)
          }
        }
        currentSubsection = {
          title: 'Ce face bine',
          type: 'positive',
          content: []
        }
        const content = trimmed.replace(/\*\*Ce face bine:\*\*/gi, '').replace(/^Ce face bine:/gi, '').trim()
        if (content) currentSubsection.content.push(content)
      }
      // Detectează "Ce nu face bine"
      else if (trimmed.match(/\*\*Ce nu face bine:\*\*/i) || trimmed.match(/^Ce nu face bine:/i)) {
        if (currentSubsection) {
          if (currentSection) {
            if (!currentSection.subsections) currentSection.subsections = []
            currentSection.subsections.push(currentSubsection)
          }
        }
        currentSubsection = {
          title: 'Ce nu face bine',
          type: 'negative',
          content: []
        }
        const content = trimmed.replace(/\*\*Ce nu face bine:\*\*/gi, '').replace(/^Ce nu face bine:/gi, '').trim()
        if (content) currentSubsection.content.push(content)
      }
      // Detectează "Problema principală"
      else if (trimmed.match(/\*\*Problema principală:\*\*/i) || trimmed.match(/^Problema principală:/i)) {
        if (currentSubsection) {
          if (currentSection) {
            if (!currentSection.subsections) currentSection.subsections = []
            currentSection.subsections.push(currentSubsection)
          }
        }
        currentSubsection = {
          title: 'Problema principală',
          type: 'problem',
          content: []
        }
        const content = trimmed.replace(/\*\*Problema principală:\*\*/gi, '').replace(/^Problema principală:/gi, '').trim()
        if (content) currentSubsection.content.push(content)
      }
      // Detectează secțiuni principale (titluri cu **)
      else if (trimmed.match(/^\*\*.*\*\*$/) && trimmed.length > 4 && !trimmed.includes('Ce face') && !trimmed.includes('Ce nu face') && !trimmed.includes('Problema')) {
        // Salvează subsecțiunea curentă
        if (currentSubsection) {
          if (currentSection) {
            if (!currentSection.subsections) currentSection.subsections = []
            currentSection.subsections.push(currentSubsection)
          }
          currentSubsection = null
        }
        
        // Salvează secțiunea anterioară
        if (currentSection) {
          sections.push(currentSection)
        }
        
        // Creează secțiune nouă
        const title = trimmed.replace(/\*\*/g, '').replace(/:$/, '')
        currentSection = {
          title,
          type: 'section',
          subsections: [],
          content: []
        }
      }
      // Alt text - adaugă la conținutul curent
      else if (trimmed) {
        if (currentSubsection) {
          currentSubsection.content.push(trimmed)
        } else if (currentSection) {
          currentSection.content.push(trimmed)
        } else {
          // Text fără secțiune
          if (!currentSection) {
            currentSection = {
              title: '',
              type: 'text',
              content: []
            }
          }
          currentSection.content.push(trimmed)
        }
      }
    })

    // Adaugă ultima subsecțiune
    if (currentSubsection && currentSection) {
      if (!currentSection.subsections) currentSection.subsections = []
      currentSection.subsections.push(currentSubsection)
    }

    // Adaugă ultima secțiune
    if (currentSection) {
      sections.push(currentSection)
    }

    return sections.length > 0 ? sections : [{ type: 'text', content: [answer] }]
  }, [answer])

  if (!formattedAnswer || formattedAnswer.length === 0) {
    return (
      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {answer}
      </div>
    )
  }

  const cleanText = (text) => {
    // Elimină markdown bold (**text** devine text)
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
    // Elimină markdown italic (*text* devine text)
    text = text.replace(/\*([^*]+)\*/g, '$1')
    // Elimină asteriscuri rămase care nu sunt parte din markdown
    text = text.replace(/\*\s*/g, '')
    return text.trim()
  }

  const renderContent = (content) => {
    return content.map((line, idx) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      
      // Curăță textul de markdown
      const cleaned = cleanText(trimmed)
      if (!cleaned) return null
      
      // Detectează bullet points
      if (cleaned.match(/^[-–•]\s/) || trimmed.match(/^[-*–•]\s/)) {
        const text = cleaned.replace(/^[-–•]\s*/, '').trim()
        if (!text) return null
        return (
          <div key={idx} className="flex items-start mb-2">
            <span className="text-gray-400 mr-3 mt-1.5 flex-shrink-0">•</span>
            <span className="flex-1 text-gray-700 leading-relaxed">{text}</span>
          </div>
        )
      }
      
      // Text normal
      return (
        <p key={idx} className="mb-3 text-gray-700 leading-relaxed last:mb-0">
          {cleaned}
        </p>
      )
    })
  }

  return (
    <div className="space-y-8">
      {formattedAnswer.map((section, index) => {
        // Text simplu fără structură
        if (section.type === 'text' && !section.title) {
          return (
            <div key={index} className="text-gray-700 leading-relaxed space-y-3">
              {renderContent(section.content)}
            </div>
          )
        }

        // Secțiuni cu structură
        return (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            {/* Titlu secțiune principală */}
            {section.title && (
              <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                <div className="bg-blue-100 rounded-lg p-2 mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
              </div>
            )}

            {/* Subsecțiuni (Ce face bine, Ce nu face bine, etc.) */}
            {section.subsections && section.subsections.length > 0 && (
              <div className="space-y-5">
                {section.subsections.map((subsection, subIdx) => {
                  const getSubsectionStyles = () => {
                    switch (subsection.type) {
                      case 'positive':
                        return {
                          bg: 'bg-emerald-50',
                          border: 'border-emerald-200',
                          iconBg: 'bg-emerald-100',
                          iconColor: 'text-emerald-600',
                          titleColor: 'text-emerald-900',
                          dotColor: 'text-emerald-500'
                        }
                      case 'negative':
                        return {
                          bg: 'bg-amber-50',
                          border: 'border-amber-200',
                          iconBg: 'bg-amber-100',
                          iconColor: 'text-amber-600',
                          titleColor: 'text-amber-900',
                          dotColor: 'text-amber-500'
                        }
                      case 'problem':
                        return {
                          bg: 'bg-red-50',
                          border: 'border-red-200',
                          iconBg: 'bg-red-100',
                          iconColor: 'text-red-600',
                          titleColor: 'text-red-900',
                          dotColor: 'text-red-500'
                        }
                      default:
                        return {
                          bg: 'bg-gray-50',
                          border: 'border-gray-200',
                          iconBg: 'bg-gray-100',
                          iconColor: 'text-gray-600',
                          titleColor: 'text-gray-900',
                          dotColor: 'text-gray-500'
                        }
                    }
                  }

                  const styles = getSubsectionStyles()

                  return (
                    <div
                      key={subIdx}
                      className={`${styles.bg} ${styles.border} border rounded-lg p-5`}
                    >
                      <div className="flex items-center mb-3">
                        <div className={`${styles.iconBg} ${styles.iconColor} rounded-lg p-1.5 mr-3`}>
                          {subsection.type === 'positive' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {subsection.type === 'negative' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                          {subsection.type === 'problem' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <h4 className={`${styles.titleColor} font-semibold text-base`}>
                          {subsection.title}
                        </h4>
                      </div>
                      <div className="text-gray-700 leading-relaxed space-y-2 ml-11">
                        {renderContent(subsection.content)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Conținut direct al secțiunii (dacă nu are subsecțiuni) */}
            {(!section.subsections || section.subsections.length === 0) && section.content.length > 0 && (
              <div className="text-gray-700 leading-relaxed space-y-3">
                {renderContent(section.content)}
              </div>
            )}
          </div>
        )
      })}

      {/* Secțiunea de Priorități */}
      {priorities && priorities.length > 0 && (
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
              <svg className="w-7 h-7 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Plan de Acțiune - Priorități
            </h3>
            <p className="text-gray-600 text-sm">Următoarele acțiuni sunt organizate după prioritate și durata estimată</p>
          </div>

          <div className="space-y-4">
            {/* Priorități urgente */}
            {priorities.filter(p => p.level === 'urgent').length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                  <span className="bg-red-100 text-red-600 rounded-full px-3 py-1 text-sm font-bold mr-2">URGENT</span>
                  Acțiuni prioritare
                </h4>
                <div className="space-y-3">
                  {priorities.filter(p => p.level === 'urgent').map((priority, idx) => (
                    <PriorityCard key={idx} priority={priority} index={idx + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Priorități importante */}
            {priorities.filter(p => p.level === 'important').length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-amber-700 mb-3 flex items-center">
                  <span className="bg-amber-100 text-amber-600 rounded-full px-3 py-1 text-sm font-bold mr-2">IMPORTANT</span>
                  Acțiuni importante
                </h4>
                <div className="space-y-3">
                  {priorities.filter(p => p.level === 'important').map((priority, idx) => (
                    <PriorityCard key={idx} priority={priority} index={idx + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Priorități moderate */}
            {priorities.filter(p => p.level === 'moderate').length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-600 rounded-full px-3 py-1 text-sm font-bold mr-2">MODERAT</span>
                  Acțiuni de îmbunătățire
                </h4>
                <div className="space-y-3">
                  {priorities.filter(p => p.level === 'moderate').map((priority, idx) => (
                    <PriorityCard key={idx} priority={priority} index={idx + 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const PriorityCard = ({ priority, index }) => {
  const getIcon = (iconName) => {
    const icons = {
      calendar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bed: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      moon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      tv: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      thermometer: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      toy: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      lightbulb: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      sun: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      utensils: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      tree: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    }
    return icons[iconName] || icons.clock
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          textColor: 'text-red-900'
        }
      case 'important':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          textColor: 'text-amber-900'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-900'
        }
    }
  }

  const styles = getLevelColor(priority.level)

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4`}>
      <div className="flex items-start">
        <div className={`${styles.iconBg} ${styles.iconColor} rounded-lg p-2 mr-4 flex-shrink-0`}>
          {getIcon(priority.icon)}
        </div>
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className={`${styles.textColor} font-bold text-lg mr-2`}>{index}.</span>
            <h5 className={`${styles.textColor} font-semibold text-base`}>{priority.title}</h5>
          </div>
          <p className="text-gray-700 text-sm mb-3">{priority.description}</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="bg-white px-3 py-1 rounded-full text-gray-700 font-medium">
              ⏱️ Durată: {priority.duration}
            </span>
            {priority.gradual && (
              <span className="bg-white px-3 py-1 rounded-full text-gray-700 font-medium">
                📈 Progresiv: {priority.gradualDescription || 'Reducere treptată'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnswerDisplay
