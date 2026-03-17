from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List, Dict, Any
import os
import json
from dotenv import load_dotenv
from sleep_analyzer import analyze_sleep_data

# Opțional: pentru fallback la OpenAI dacă e necesar
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Gemini AI - folosim requests direct pentru a evita problemele de dependențe
import requests
GEMINI_AVAILABLE = True

# Load environment variables
load_dotenv()

app = FastAPI(title="Somlin API", version="1.0.0")

# CORS middleware
# Permite toate originile în development pentru Expo și alte aplicații mobile
cors_origins = ["http://localhost:3000", "http://localhost:5173", "http://localhost:19000", "http://localhost:8081"]
# Adaugă și IP-ul local pentru conexiuni mobile (poate fi configurat prin variabilă de mediu)
if os.getenv("ALLOWED_ORIGINS"):
    cors_origins.extend(os.getenv("ALLOWED_ORIGINS").split(","))
# În development, permite toate originile pentru a funcționa cu Expo
if os.getenv("ENV") != "production":
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client (opțional - pentru fallback)
if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
else:
    client = None

# Initialize Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Initialize Claude API key
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL = "claude-sonnet-4-6"

# Request/Response models
class NapTime(BaseModel):
    startTime: Optional[str] = None
    duration: Optional[int] = None
    durationHours: Optional[str] = None

class SleepDataRequest(BaseModel):
    childAge: Optional[str] = None
    childAgeMonths: int
    childAgeYears: Optional[str] = None
    date: str
    numberOfNaps: int
    bedtime: str
    wakeTime: str
    napTimes: List[NapTime]
    totalSleepHours: Optional[float] = None
    sleepQuality: str
    putToSleepBy: str
    sleepLocation: str
    sleepRoutine: List[str]
    issues: List[str]
    notes: Optional[str] = None
    timestamp: str
    
    @model_validator(mode='before')
    @classmethod
    def set_defaults(cls, values):
        if isinstance(values, dict):
            # Calculează childAgeYears dacă lipsește
            if 'childAgeYears' not in values or not values.get('childAgeYears'):
                if 'childAgeMonths' in values:
                    values['childAgeYears'] = f"{(values['childAgeMonths'] / 12):.1f}"
            # Calculează childAge dacă lipsește
            if 'childAge' not in values or not values.get('childAge'):
                if 'childAgeMonths' in values:
                    values['childAge'] = str(values['childAgeMonths'])
        return values

class AIResponse(BaseModel):
    analysis: str
    recommendations: List[str]
    concerns: Optional[List[str]] = None
    positive_notes: Optional[List[str]] = None

def generate_sleep_analysis_prompt(data: SleepDataRequest) -> str:
    """Generează un prompt detaliat pentru OpenAI bazat pe datele formularului"""
    
    age_months = data.childAgeMonths
    age_years = age_months / 12
    
    # Calculează durata somnului nocturn
    bedtime_parts = data.bedtime.split(':')
    wake_parts = data.wakeTime.split(':')
    bedtime_hours = int(bedtime_parts[0]) + int(bedtime_parts[1]) / 60
    wake_hours = int(wake_parts[0]) + int(wake_parts[1]) / 60
    
    if wake_hours < bedtime_hours:
        wake_hours += 24  # Trezirea este a doua zi
    
    night_sleep_hours = wake_hours - bedtime_hours
    
    # Calculează durata totală somnuri
    total_nap_minutes = sum(nap.duration or 0 for nap in data.napTimes)
    total_nap_hours = total_nap_minutes / 60
    
    prompt = f"""Ești un somnolog expert specializat în somnul copiilor (0-4 ani). 
Analizează următoarele date despre somnul unui copil și oferă o analiză detaliată, recomandări personalizate și observații.

DATE DESPRE COPIL:
- Vârstă: {age_months} luni ({age_years:.1f} ani)
- Data: {data.date}

PROGRAM SOMN:
- Ora culcării (seară): {data.bedtime}
- Ora trezirii (dimineață): {data.wakeTime}
- Durată somn nocturn: aproximativ {night_sleep_hours:.1f} ore
- Număr de somnuri (siestă): {data.numberOfNaps}
- Durată totală somnuri: {total_nap_hours:.1f} ore ({total_nap_minutes} minute)
- Durată totală somn (nocturn + somnuri): {data.totalSleepHours or (night_sleep_hours + total_nap_hours):.1f} ore

DETALII SOMNURI:"""
    
    for i, nap in enumerate(data.napTimes, 1):
        if nap.startTime and nap.duration:
            prompt += f"\n- Somn {i}: începe la {nap.startTime}, durată {nap.duration} minute ({nap.durationHours or (nap.duration/60):.2f} ore)"
    
    prompt += f"""

CALITATE ȘI DETALII:
- Calitatea somnului: {data.sleepQuality}
- Culcat de: {data.putToSleepBy}
- Locul de somn: {data.sleepLocation}
- Rutină pre-somn: {', '.join(data.sleepRoutine) if data.sleepRoutine else 'Nicio rutină specificată'}
- Probleme raportate: {', '.join(data.issues) if data.issues else 'Nicio problemă raportată'}
- Observații: {data.notes or 'Nicio observație'}

CERINȚE PENTRU RĂSPUNS:
1. Analizează dacă durata totală de somn este adecvată pentru vârsta copilului
2. Evaluează programul de somn (ora culcării, trezirii, somnuri)
3. Identifică puncte forte și aspecte care necesită îmbunătățiri
4. Oferă recomandări concrete și personalizate bazate pe datele furnizate
5. Menționează dacă există semne de alarmă care necesită consult medical
6. Fii empatic, clar și constructiv în răspuns

Răspunde în română, într-un stil profesional dar accesibil pentru părinți.
Structura răspunsului:
- O analiză generală (2-3 paragrafe)
- Recomandări specifice (liste cu bullet points)
- Observații importante (dacă există)
- Puncte pozitive (ce funcționează bine)
"""
    
    return prompt


def call_claude_api(prompt: str, max_tokens: int = 2048, temperature: float = 0.2) -> str:
    """Apelează API-ul Claude (Messages API) pentru un răspuns generativ"""
    if not CLAUDE_API_KEY:
        raise ValueError("CLAUDE_API_KEY nu este setat în variabila de mediu")

    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [
            {"role": "user", "content": prompt}
        ],
    }

    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    response = requests.post(CLAUDE_API_URL, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    data = response.json()

    # Messages API returnează content ca listă de blocks
    content = data.get("content", [])
    if content and content[0].get("type") == "text":
        return content[0]["text"]
    return ""


@app.post("/api/analyze-sleep", response_model=AIResponse)
async def analyze_sleep(data: SleepDataRequest, use_claude: bool = False):
    """Analizează datele de somn folosind sistemul bazat pe reguli (rule-based) și, opțional, Claude"""
    
    try:
        # Calculează câmpurile lipsă
        data_dict = data.dict()
        if not data_dict.get('childAge'):
            data_dict['childAge'] = str(data_dict['childAgeMonths'])
        if not data_dict.get('childAgeYears'):
            data_dict['childAgeYears'] = f"{(data_dict['childAgeMonths'] / 12):.1f}"
        
        # Folosește sistemul bazat pe reguli (rule-based)
        result = analyze_sleep_data(data_dict)

        if use_claude:
            # Pregătește prompt pentru Claude
            prompt = generate_sleep_analysis_prompt(data)
            claude_output = call_claude_api(prompt)
            return AIResponse(
                analysis=claude_output or result['analysis'],
                recommendations=result.get('recommendations', []),
                concerns=result.get('concerns'),
                positive_notes=result.get('positive_notes')
            )

        return AIResponse(
            analysis=result['analysis'],
            recommendations=result['recommendations'],
            concerns=result.get('concerns'),
            positive_notes=result.get('positive_notes')
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Eroare la procesare: {str(e)}"
        )

@app.get("/")
async def root():
    return {"message": "Somlin API - Sleep Analysis Service", "status": "running"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "claude_configured": bool(CLAUDE_API_KEY),
        "claude_model": CLAUDE_MODEL,
        "rule_based_system": "active"
    }

# Model pentru întrebări
class QuestionRequest(BaseModel):
    question: str
    answers: Optional[Dict[str, Any]] = {}

class QuestionResponse(BaseModel):
    answer: str

# Încarcă contextul despre somn
def load_sleep_context():
    """Încarcă contextul despre somn din fișierul JSON"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, 'sleep_context.json')
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

SLEEP_CONTEXT = load_sleep_context()

def get_age_group_from_months(months: int) -> str:
    """Determină grupa de vârstă din luni"""
    if months <= 3:
        return "0-3_months"
    elif months <= 6:
        return "3-6_months"
    elif months <= 12:
        return "6-12_months"
    elif months <= 18:
        return "12-18_months"
    elif months <= 24:
        return "18-24_months"
    elif months <= 36:
        return "2-3_years"
    else:
        return "3-4_years"

def build_context_prompt(answers: Dict[str, Any]) -> str:
    """Construiește prompt-ul cu contextul despre somn"""
    age_months = int(answers.get('age', 0))
    age_group = get_age_group_from_months(age_months)
    
    context_parts = []
    
    # Adaugă informații despre vârstă și recomandări
    if age_group in SLEEP_CONTEXT.get('sleepGuidelines', {}):
        guidelines = SLEEP_CONTEXT['sleepGuidelines'][age_group]
        wake_windows = guidelines['wakeWindows']
        # Verifică dacă sunt în minute (> 10 și întreg) sau ore (< 10 sau zecimal)
        if wake_windows['max'] > 10 and isinstance(wake_windows['max'], (int, float)) and wake_windows['max'] % 1 == 0:
            # Sunt în minute, convertim la ore
            min_hours = wake_windows['min'] / 60
            max_hours = wake_windows['max'] / 60
            wake_windows_str = f"{min_hours:.1f}-{max_hours:.1f}"
            if wake_windows.get('optimal'):
                optimal_hours = wake_windows['optimal'] / 60
                wake_windows_str += f" (optim: {optimal_hours:.1f})"
            wake_windows_str += " ore"
        else:
            # Sunt în ore
            wake_windows_str = f"{wake_windows['min']}-{wake_windows['max']}"
            if wake_windows.get('optimal'):
                wake_windows_str += f" (optim: {wake_windows['optimal']})"
            wake_windows_str += " ore"
        
        context_parts.append(f"""
INFORMAȚII DESPRE VÂRSTA COPILULUI ({age_months} luni):
- Somn total recomandat: {guidelines['totalSleepHours']['min']}-{guidelines['totalSleepHours']['max']} ore (optim: {guidelines['totalSleepHours']['optimal']} ore)
- Număr de somnuri recomandat: {guidelines['numberOfNaps']['min']}-{guidelines['numberOfNaps']['max']} somnuri (optim: {guidelines['numberOfNaps']['optimal']})
- Durată somn nocturn: {guidelines['nightSleep']['min']}-{guidelines['nightSleep']['max']} ore (optim: {guidelines['nightSleep']['optimal']} ore)
- Ferestre de veghe (PV): {wake_windows_str}
- Ora culcării recomandată: {guidelines['bedtime']['recommended']}
""")
    
    # Adaugă informații despre tranziții
    transitions_info = []
    for transition_key, transition_data in SLEEP_CONTEXT.get('sleepTransitions', {}).items():
        # Parsează cheia tranziției (ex: "4_months", "8-10_months", "12-18_months")
        key_parts = transition_key.split('_')[0]
        if '-' in key_parts:
            # Range de luni (ex: "8-10", "12-18")
            try:
                start, end = map(int, key_parts.split('-'))
                if start <= age_months <= end:
                    transitions_info.append(f"- {transition_data['description']}: {transition_data['duration']}")
            except (ValueError, TypeError):
                pass
        else:
            # Luni specifice (ex: "4")
            try:
                transition_month = int(key_parts)
                # Verifică dacă vârsta este în intervalul tranziției (aproximativ ±2 luni)
                if abs(age_months - transition_month) <= 2:
                    transitions_info.append(f"- {transition_data['description']}: {transition_data['duration']}")
            except (ValueError, TypeError):
                pass
    
    if transitions_info:
        context_parts.append(f"""
TRANZIȚII DE SOMN RELEVANTE:
{chr(10).join(transitions_info)}
""")
    
    # Adaugă principiile de bază
    core_principles = SLEEP_CONTEXT.get('corePrinciples', {})
    principles_text = """
PRINCIPII FUNDAMENTALE PENTRU SOMN OPTIMAL (APLICĂ ÎNTOTDEAUNA):

1. RUTINA TREBUIE SĂ FIE IDENTICĂ MEREU
   - Rutina de culcare trebuie să fie exact aceeași în fiecare seară, fără excepții
   - Aceasta ajută creierul copilului să recunoască semnalele de somn

2. PERIOADĂ LINIȘTITĂ DE JOC
   - Înainte de rutina de culcare, trebuie să existe o perioadă de joc liniștit (30-60 minute)
   - Fără activități stimulante care să excite copilul

3. FĂRĂ LUMINI EXTREME ÎN CASĂ
   - Luminile din casă trebuie să fie estomate înainte de culcare
   - Evită lumini strălucitoare, ecrane și surse de lumină albastră

4. CITIT ÎN LINIȘTE
   - Cititul unei povești înainte de somn este excelent pentru relaxare

5. NU SE LASĂ SĂ IASĂ DIN CAMERĂ DUPĂ CE ÎNCEPE SĂ ADORMĂ
   - Odată ce rutina de culcare a început și copilul începe să adoarmă, nu trebuie lăsat să iasă din cameră
   - Dacă încearcă să plece, să aprindă becul, să se joace sau orice altceva, trebuie să fie pus înapoi în pat într-un mod liniștit și blând, fără emoții negative

6. TEMPERATURĂ OPTIMALĂ
   - Temperatura camerei de somn trebuie redusă treptat cu 0.5 grade pe săptămână
   - La momentul culcării să fie cu 2 grade mai mică decât restul casei
   - Temperatura optimă pentru somn: 21-22 grade Celsius

7. ABORDARE BLANDĂ ȘI LINIȘTITĂ
   - Dacă copilul vrea să plece, să aprindă becul, să se joace, trebuie să fie pus înapoi în pat într-un mod liniștit, blând și consistent
   - Fără emoții negative sau frustrări
"""
    context_parts.append(principles_text)
    
    return "\n".join(context_parts)

# Șablon pentru răspunsuri Gemini
def build_gemini_prompt(question: str, answers: Dict[str, Any]) -> str:
    """Construiește prompt-ul complet pentru Gemini"""
    context = build_context_prompt(answers)
    
    prompt = f"""Ești Ruxandra Trufașu, somnolog expert specializat în somnul copiilor (0-4 ani), cu experiență vastă în consilierea părinților.

{context}

DATE DESPRE COPILUL PĂRINTELUI:
- Vârstă: {answers.get('age', 'necunoscută')} luni
- Număr somnuri pe zi: {answers.get('numberOfNaps', 'necunoscut')}
- Adoarme cu: {answers.get('sleepsWith', 'necunoscut')}
- Rutină de culcare: {answers.get('routine', 'necunoscută')}
- Rutina este: {answers.get('routineConsistent', 'necunoscută')}
- Se trezește noaptea: {answers.get('wakesAtNight', 'necunoscut')}
- Iese afară: {answers.get('goesOutside', 'necunoscut')}
- Mănâncă înainte de somn: {answers.get('eatingBeforeSleep', 'necunoscut')}
- Timp ecrane: {answers.get('screenTime', 'necunoscut')}
- Muzică tare: {answers.get('loudMusic', 'necunoscut')}

ÎNTREBAREA PĂRINTELUI:
{question}

CERINȚE PENTRU RĂSPUNS:

1. **Salutare prietenoasă**: Începe cu "Bună!" sau o altă salutare naturală

2. **Analiză pe fiecare palier**:
   - Analizează fiecare aspect: rutina, somnurile, mediu, alimentație, ecrane, etc.
   - Pentru fiecare palier, spune ce face bine și ce nu face bine
   - Identifică problemele principale imediat
   - Explică cauzele (ex: supra-oboseală, ferestre de veghe prea mari, regresii, etc.)
   - Folosește termeni tehnici simplificați (PV, SN, ferestre de veghe, supra-oboseală, regresii, tranziții)

3. **Recomandări practice și concrete pentru fiecare palier**:
   - Listează pașii clari cu bullet points (folosind "–" sau "-")
   - Fii specific cu ore, durate, intervale
   - Oferă soluții practice, nu doar teorie
   - Asigură-te că menționezi toate principiile fundamentale (rutină identică, perioadă liniștită, lumini, citit, nu iasă din cameră, temperatură, abordare blândă)

4. **Ton conversațional**:
   - Folosește "tu" (nu "dumneavoastră")
   - Fii empatic și înțelegător
   - Recunoaște dificultățile ("știu că e greu acum", "va trece")

5. **Structură clară**:
   - Organizează răspunsul pe paliere/aspecte
   - Pentru fiecare palier: ce face bine, ce nu face bine, ce trebuie schimbat

IMPORTANT:
- Răspunde ÎNTOTDEAUNA în limba română
- Fii detaliat dar clar
- Axează-te pe TOATE palierele și spune pentru fiecare ce face bine și ce nu
- Folosește termeni specifici somnului copiilor: PV (perioadă de veghe), SN (somn de noapte), ferestre de veghe, supra-oboseală, regresii, tranziții
- Nu fi prea formal - tonul e prietenos dar profesional
- Asigură-te că toate principiile fundamentale sunt menționate și explicate

Răspunsul tău:"""
    
    return prompt

@app.post("/api/ask-question", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Răspunde la întrebări despre somnul copiilor folosind Claude AI"""

    if not CLAUDE_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Serviciul Claude nu este disponibil. Verifică CLAUDE_API_KEY."
        )

    if not request.question or not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Întrebarea nu poate fi goală"
        )

    try:
        prompt = build_gemini_prompt(request.question.strip(), request.answers or {})
        answer = call_claude_api(prompt)

        if not answer:
            raise HTTPException(status_code=500, detail="Nu s-a primit răspuns de la Claude")

        return QuestionResponse(answer=answer)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Eroare la generarea răspunsului: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
