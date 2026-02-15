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
      let errorMessage = 'Eroare la întrebare'
      try {
        const errorData = await response.json()
        // Backend-ul returnează 'error' sau 'detail'
        errorMessage = errorData.error || errorData.detail || errorMessage
        
        // Adaugă informații despre status code
        if (response.status === 503) {
          errorMessage = `Backend indisponibil: ${errorMessage}. Verifică dacă API key-ul Gemini este configurat.`
        } else if (response.status === 400) {
          errorMessage = `Date invalide: ${errorMessage}`
        } else if (response.status >= 500) {
          errorMessage = `Eroare server: ${errorMessage}`
        }
      } catch (parseError) {
        // Dacă nu se poate parsa JSON-ul, folosește status text
        errorMessage = `Eroare ${response.status}: ${response.statusText || 'Eroare necunoscută'}`
      }
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    console.error('Error asking question:', error)
    
    // Gestionează erorile de rețea
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Nu s-a putut conecta la server. Verifică dacă backend-ul rulează și dacă URL-ul este corect.')
    }
    
    // Re-throw eroarea cu mesajul complet
    throw error
  }
}
