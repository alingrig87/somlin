import { downloadHTMLReport } from '../utils/generateHTML'

// Convertește inline markdown (**bold**, *italic*) în JSX
const parseInline = (text) => {
  const parts = []
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[1]) parts.push(<strong key={match.index}>{match[1]}</strong>)
    else if (match[2]) parts.push(<em key={match.index}>{match[2]}</em>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

const AnswerDisplay = ({ answer, priorities = [], answers = {} }) => {
  if (!answer) return null

  // ─── Parser markdown → blocuri structurate ──────────────────────────────────
  const blocks = []
  const lines = answer.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { i++; continue }

    // H1: # Titlu
    if (/^#\s+/.test(trimmed)) {
      blocks.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') })
      i++; continue
    }

    // H2: ## Titlu
    if (/^##\s+/.test(trimmed)) {
      blocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') })
      i++; continue
    }

    // H3: ### Titlu
    if (/^###\s+/.test(trimmed)) {
      blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') })
      i++; continue
    }

    // Separator ---
    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      i++; continue
    }

    // Lista cu bullet points (colectează liniile consecutive)
    if (/^[-–•*]\s/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^[-–•*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-–•*]\s*/, ''))
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    }

    // Paragraf normal
    blocks.push({ type: 'p', text: trimmed })
    i++
  }

  // ─── Render blocuri ─────────────────────────────────────────────────────────
  const renderBlock = (block, idx) => {
    switch (block.type) {
      case 'h1':
        return (
          <div key={idx} className="mt-2 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {parseInline(block.text)}
            </h1>
          </div>
        )

      case 'h2':
        return (
          <div key={idx} className="mt-6 mb-3">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-indigo-100">
              <div className="w-1 h-6 bg-indigo-500 rounded-full flex-shrink-0" />
              <h2 className="text-lg font-bold text-indigo-800">{parseInline(block.text)}</h2>
            </div>
          </div>
        )

      case 'h3':
        return (
          <div key={idx} className="mt-4 mb-2">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0" />
              {parseInline(block.text)}
            </h3>
          </div>
        )

      case 'hr':
        return <hr key={idx} className="my-4 border-gray-200" />

      case 'list':
        return (
          <ul key={idx} className="my-2 space-y-1.5 ml-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-gray-700 text-sm leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                <span>{parseInline(item)}</span>
              </li>
            ))}
          </ul>
        )

      case 'p':
        return (
          <p key={idx} className="text-gray-700 text-sm leading-relaxed my-2">
            {parseInline(block.text)}
          </p>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-1">
      {/* Buton download */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => downloadHTMLReport(answer, priorities, answers)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descarcă Raport HTML
        </button>
      </div>

      {/* Conținut răspuns */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {blocks.map(renderBlock)}
      </div>

      {/* Priorități */}
      {priorities && priorities.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-indigo-100">
            <div className="w-1 h-6 bg-indigo-500 rounded-full" />
            <h2 className="text-lg font-bold text-indigo-800">Plan de Acțiune — Priorități</h2>
          </div>

          <div className="space-y-6">
            {[
              { key: 'urgent', label: 'URGENT', color: 'red' },
              { key: 'important', label: 'IMPORTANT', color: 'amber' },
              { key: 'moderate', label: 'MODERAT', color: 'blue' },
            ].map(({ key, label, color }) => {
              const group = priorities.filter(p => p.level === key)
              if (!group.length) return null
              const styles = {
                red:   { badge: 'bg-red-100 text-red-700',   card: 'bg-red-50 border-red-200',   num: 'bg-red-500',   icon: 'text-red-600' },
                amber: { badge: 'bg-amber-100 text-amber-700', card: 'bg-amber-50 border-amber-200', num: 'bg-amber-500', icon: 'text-amber-600' },
                blue:  { badge: 'bg-blue-100 text-blue-700',  card: 'bg-blue-50 border-blue-200',  num: 'bg-blue-500',  icon: 'text-blue-600' },
              }[color]
              return (
                <div key={key}>
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${styles.badge}`}>
                    {label}
                  </span>
                  <div className="space-y-3">
                    {group.map((p, idx) => (
                      <div key={idx} className={`flex items-start gap-3 p-4 rounded-xl border ${styles.card}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 ${styles.num}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm mb-1 ${styles.icon}`}>{p.title}</p>
                          <p className="text-gray-600 text-xs leading-relaxed">{p.description || p.recommendation}</p>
                          {p.duration && (
                            <span className="inline-block mt-2 text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                              ⏱ {p.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnswerDisplay
