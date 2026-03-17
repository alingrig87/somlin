export const generateHTMLReport = (answer, priorities = [], answers = {}) => {
  const date = new Date().toLocaleDateString('ro-RO', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const age = answers.age ? `${answers.age} luni` : null
  const naps = answers.numberOfNaps ?? null

  const escapeHtml = (text) =>
    String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const formatAnswerToHTML = (raw) => {
    if (!raw) return ''
    const lines = raw.split('\n')
    let html = ''
    let inList = false

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) {
        if (inList) { html += '</ul>'; inList = false }
        return
      }

      // Titluri bold **Titlu**
      if (/^\*\*.*\*\*$/.test(trimmed)) {
        if (inList) { html += '</ul>'; inList = false }
        const title = trimmed.replace(/\*\*/g, '')
        html += `<h3 class="section-title">${escapeHtml(title)}</h3>`
        return
      }

      // Sub-titluri tip "Ce face bine:" / "Ce nu face bine:"
      if (/^(Ce face bine|Ce nu face bine|Problema principală):/i.test(trimmed)) {
        if (inList) { html += '</ul>'; inList = false }
        const isPositive = /Ce face bine/i.test(trimmed)
        const isNegative = /Ce nu face bine/i.test(trimmed)
        const isProblem = /Problema principală/i.test(trimmed)
        const cls = isPositive ? 'sub-positive' : isNegative ? 'sub-negative' : isProblem ? 'sub-problem' : 'sub-neutral'
        const icon = isPositive ? '✓' : isNegative ? '⚠' : isProblem ? '!' : '•'
        const rest = trimmed.replace(/^[^:]+:\s*/i, '')
        html += `<div class="subsection ${cls}"><span class="sub-icon">${icon}</span><strong>${trimmed.replace(/:.*/i, '')}:</strong>${rest ? ' ' + escapeHtml(rest) : ''}</div>`
        return
      }

      // Bullet points
      if (/^[-–•*]\s/.test(trimmed)) {
        if (!inList) { html += '<ul>'; inList = true }
        const text = trimmed.replace(/^[-–•*]\s*/, '')
        const cleaned = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
        html += `<li>${cleaned}</li>`
        return
      }

      // Text normal
      if (inList) { html += '</ul>'; inList = false }
      const cleaned = escapeHtml(trimmed)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      html += `<p>${cleaned}</p>`
    })

    if (inList) html += '</ul>'
    return html
  }

  const priorityLevels = [
    { key: 'urgent', label: 'URGENT', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
    { key: 'important', label: 'IMPORTANT', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
    { key: 'moderate', label: 'MODERAT', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  ]

  const prioritiesHTML = priorities.length === 0 ? '' : `
    <div class="section">
      <div class="section-header">
        <span class="section-icon">📋</span>
        <h2>Plan de Acțiune — Priorități</h2>
      </div>
      ${priorityLevels.map(({ key, label, color, bg, border }) => {
        const group = priorities.filter(p => p.level === key)
        if (!group.length) return ''
        return `
          <div class="priority-group" style="--p-color:${color};--p-bg:${bg};--p-border:${border}">
            <div class="priority-badge">${label}</div>
            ${group.map((p, i) => `
              <div class="priority-card">
                <div class="priority-num">${i + 1}</div>
                <div class="priority-body">
                  <div class="priority-title">${escapeHtml(p.title || '')}</div>
                  <div class="priority-desc">${escapeHtml(p.description || p.recommendation || '')}</div>
                  ${p.duration ? `<div class="priority-meta">⏱ Durată: ${escapeHtml(p.duration)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>`
      }).join('')}
    </div>`

  const infoRows = [
    age && `<div class="info-pill">👶 Vârstă: <strong>${age}</strong></div>`,
    naps !== null && `<div class="info-pill">😴 Somnuri/zi: <strong>${naps}</strong></div>`,
    answers.problems && Array.isArray(answers.problems) && answers.problems.length > 0 &&
      `<div class="info-pill">⚠ Probleme: <strong>${answers.problems.join(', ')}</strong></div>`,
  ].filter(Boolean).join('')

  return `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Raport Somn — Somlin</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; color: #1e293b; line-height: 1.65; }

  .header {
    background: linear-gradient(135deg, #1e40af 0%, #4f46e5 100%);
    color: #fff; padding: 40px 48px; position: relative; overflow: hidden;
  }
  .header::after {
    content: ''; position: absolute; right: -60px; top: -60px;
    width: 240px; height: 240px; border-radius: 50%;
    background: rgba(255,255,255,0.06);
  }
  .header h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  .header .subtitle { font-size: 14px; opacity: 0.8; margin-top: 6px; }
  .header .meta { margin-top: 16px; font-size: 12px; opacity: 0.65; }

  .container { max-width: 820px; margin: 32px auto; padding: 0 20px 48px; }

  .info-bar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
  .info-pill {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 999px;
    padding: 6px 16px; font-size: 13px; color: #475569; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .info-pill strong { color: #1e293b; }

  .section {
    background: #fff; border-radius: 16px; padding: 28px 32px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.07); margin-bottom: 24px;
  }
  .section-header {
    display: flex; align-items: center; gap: 12px;
    padding-bottom: 16px; margin-bottom: 20px;
    border-bottom: 2px solid #e2e8f0;
  }
  .section-icon { font-size: 22px; }
  .section-header h2 { font-size: 20px; font-weight: 700; color: #0f172a; }

  .analysis-body h3.section-title {
    font-size: 17px; font-weight: 700; color: #1e40af;
    margin: 24px 0 10px; padding: 10px 16px;
    background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0;
  }
  .analysis-body p { color: #374151; margin-bottom: 10px; font-size: 14.5px; }
  .analysis-body ul { padding-left: 0; margin: 8px 0 16px; list-style: none; }
  .analysis-body ul li {
    position: relative; padding: 6px 12px 6px 32px;
    margin-bottom: 6px; background: #f8fafc; border-radius: 8px;
    font-size: 14px; color: #334155;
  }
  .analysis-body ul li::before {
    content: '→'; position: absolute; left: 10px; color: #6366f1; font-weight: 700;
  }

  .subsection {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 14px; border-radius: 10px; margin: 8px 0; font-size: 14px;
  }
  .sub-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .sub-positive { background: #f0fdf4; color: #166534; }
  .sub-negative { background: #fffbeb; color: #92400e; }
  .sub-problem  { background: #fef2f2; color: #991b1b; }
  .sub-neutral  { background: #f0f9ff; color: #0c4a6e; }

  .priority-group { margin-bottom: 20px; }
  .priority-badge {
    display: inline-block; padding: 4px 14px; border-radius: 999px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
    color: var(--p-color); background: var(--p-bg);
    border: 1px solid var(--p-border); margin-bottom: 12px;
  }
  .priority-card {
    display: flex; align-items: flex-start; gap: 14px;
    background: var(--p-bg); border: 1px solid var(--p-border);
    border-radius: 12px; padding: 14px 18px; margin-bottom: 10px;
  }
  .priority-num {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--p-color); color: #fff; font-size: 13px; font-weight: 700;
  }
  .priority-title { font-weight: 700; color: var(--p-color); font-size: 14px; margin-bottom: 4px; }
  .priority-desc { font-size: 13px; color: #374151; }
  .priority-meta { font-size: 12px; color: #6b7280; margin-top: 6px; }

  .footer {
    text-align: center; padding: 20px; font-size: 12px; color: #94a3b8;
    border-top: 1px solid #e2e8f0; margin-top: 16px;
  }

  @media print {
    body { background: #fff; }
    .container { margin: 0; padding: 20px; }
    .section { box-shadow: none; border: 1px solid #e2e8f0; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>🌙 Plan de Somn Personalizat</h1>
  <div class="subtitle">Recomandări expert — Ruxandra Trufașu, Somnolog</div>
  <div class="meta">Generat pe ${date}</div>
</div>

<div class="container">
  ${infoRows ? `<div class="info-bar">${infoRows}</div>` : ''}

  <div class="section">
    <div class="section-header">
      <span class="section-icon">🧠</span>
      <h2>Analiză și Recomandări</h2>
    </div>
    <div class="analysis-body">
      ${formatAnswerToHTML(answer)}
    </div>
  </div>

  ${prioritiesHTML}

  <div class="footer">
    Generat de <strong>Somlin</strong> · Consultație personalizată pentru somnul copilului
  </div>
</div>
</body>
</html>`
}

export const downloadHTMLReport = (answer, priorities = [], answers = {}) => {
  const html = generateHTMLReport(answer, priorities, answers)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `raport-somn-${new Date().toISOString().slice(0, 10)}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
