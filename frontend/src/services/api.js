const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8002')

export const analyzeSleepData = async (sleepData) => {
  try {
    const response = await fetch(`${API_URL}/api/analyze-sleep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sleepData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Eroare la analiză')
    }

    return await response.json()
  } catch (error) {
    console.error('Error analyzing sleep data:', error)
    throw error
  }
}

export const askQuestion = async (question, answers = {}) => {
  try {
    // Pe Vercel, API-ul este la /api/ask-question
    const apiEndpoint = import.meta.env.PROD 
      ? '/api/ask-question' 
      : `${API_URL}/api/ask-question`
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answers }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Eroare la întrebare')
    }

    return await response.json()
  } catch (error) {
    console.error('Error asking question:', error)
    throw error
  }
}
