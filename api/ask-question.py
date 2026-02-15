from http.server import BaseHTTPRequestHandler
import json
import os
import requests
from urllib.parse import parse_qs, urlparse

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

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

def load_sleep_context():
    """Încarcă contextul despre somn din fișierul JSON"""
    import json as json_module
    # Contextul va fi încorporat în cod sau încărcat din fișier
    # Pentru simplitate, vom include doar principiile fundamentale
    return {
        "corePrinciples": {
            "routine": "Rutina trebuie să fie identică mereu",
            "quietPlay": "Perioadă liniștită de joc (30-60 minute)",
            "lighting": "Fără lumini extreme în casă",
            "quietReading": "Citit în liniște",
            "stayInRoom": "Nu se lasă să iasă din cameră după ce începe să adoarmă",
            "temperature": "Temperatură 21-22°C, redusă cu 0.5 grade/săptămână",
            "gentleApproach": "Abordare blândă și liniștită"
        }
    }

def build_gemini_prompt(question: str, answers: dict) -> str:
    """Construiește prompt-ul complet pentru Gemini"""
    age_months = int(answers.get('age', 0) or 0)
    
    # Informații despre vârstă pentru recomandări
    age_info = ""
    if age_months > 0:
        if age_months <= 3:
            age_info = f"""
INFORMAȚII DESPRE VÂRSTA COPILULUI ({age_months} luni - 0-3 luni):
- Somn total recomandat: 14-17 ore (optim: 15.5 ore)
- Număr de somnuri recomandat: 4-6 somnuri (optim: 5)
- Durată somn nocturn: 8-10 ore (optim: 9 ore)
- Ferestre de veghe (PV): 45-90 minute
- Ora culcării recomandată: 19:00-20:00
"""
        elif age_months <= 6:
            age_info = f"""
INFORMAȚII DESPRE VÂRSTA COPILULUI ({age_months} luni - 3-6 luni):
- Somn total recomandat: 13-16 ore (optim: 14.5 ore)
- Număr de somnuri recomandat: 3-5 somnuri (optim: 4)
- Durată somn nocturn: 9-11 ore (optim: 10 ore)
- Ferestre de veghe (PV): 1.5-2.5 ore
- Ora culcării recomandată: 19:00-20:00
"""
        elif age_months <= 12:
            age_info = f"""
INFORMAȚII DESPRE VÂRSTA COPILULUI ({age_months} luni - 6-12 luni):
- Somn total recomandat: 12-15 ore (optim: 13.5 ore)
- Număr de somnuri recomandat: 2-3 somnuri (optim: 2)
- Durată somn nocturn: 10-12 ore (optim: 11 ore)
- Ferestre de veghe (PV): 2.5-4 ore
- Ora culcării recomandată: 19:00-20:00
"""
        elif age_months <= 18:
            age_info = f"""
INFORMAȚII DESPRE VÂRSTA COPILULUI ({age_months} luni - 12-18 luni):
- Somn total recomandat: 11-14 ore (optim: 12.5 ore)
- Număr de somnuri recomandat: 1-2 somnuri (optim: 2)
- Durată somn nocturn: 10-12 ore (optim: 11 ore)
- Ferestre de veghe (PV): 4-5 ore
- Ora culcării recomandată: 19:00-20:00
"""
        elif age_months <= 24:
            age_info = f"""
INFORMAȚII DESPRE VÂRSTA COPILULUI ({age_months} luni - 18-24 luni):
- Somn total recomandat: 11-14 ore (optim: 12.5 ore)
- Număr de somnuri recomandat: 1-2 somnuri (optim: 1)
- Durată somn nocturn: 10-12 ore (optim: 11 ore)
- Ferestre de veghe (PV): 5-6 ore
- Ora culcării recomandată: 19:00-20:00
"""
        elif age_months <= 36:
            age_info = f"""
INFORMAȚII DESPRE VÂRSTA COPILULUI ({age_months} luni - 2-3 ani):
- Somn total recomandat: 10-13 ore (optim: 11.5 ore)
- Număr de somnuri recomandat: 0-1 somn (optim: 1)
- Durată somn nocturn: 10-12 ore (optim: 11 ore)
- Ferestre de veghe (PV): 5.5-6.5 ore
- Ora culcării recomandată: 19:00-20:00
"""
        else:
            age_info = f"""
INFORMAȚII DESPRE VÂRSTA COPILULUI ({age_months} luni - 3-4 ani):
- Somn total recomandat: 10-13 ore (optim: 11.5 ore)
- Număr de somnuri recomandat: 0-1 somn (optim: 0)
- Durată somn nocturn: 10-12 ore (optim: 11 ore)
- Ferestre de veghe (PV): 6-7 ore
- Ora culcării recomandată: 19:00-20:30
"""
    
    context = f"""
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
    
    prompt = f"""Ești Ruxandra Trufașu, somnolog expert specializat în somnul copiilor (0-4 ani), cu experiență vastă în consilierea părinților.

{age_info}

{context}

DATE DESPRE COPILUL PĂRINTELUI:
- Vârstă: {answers.get('age', 'necunoscută')} luni
- Probleme raportate: {', '.join(answers.get('problems', [])) if isinstance(answers.get('problems'), list) else answers.get('problems', 'necunoscut')}
- Număr somnuri pe zi: {answers.get('numberOfNaps', 'necunoscut')}
- Detalii somnuri de zi: {answers.get('napDetails', 'necunoscut')}
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

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            question = data.get('question', '')
            answers = data.get('answers', {})
            
            if not question:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Întrebarea nu poate fi goală'}).encode())
                return
            
            if not GEMINI_API_KEY:
                self.send_response(503)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'GEMINI_API_KEY nu este configurată'}).encode())
                return
            
            # Construiește prompt-ul
            prompt = build_gemini_prompt(question, answers)
            
            # Generează răspunsul folosind Gemini API
            headers = {
                "Content-Type": "application/json",
                "X-goog-api-key": GEMINI_API_KEY
            }
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }]
            }
            
            response = requests.post(
                GEMINI_API_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                self.send_response(response.status_code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Eroare API Gemini: {response.text}'}).encode())
                return
            
            result = response.json()
            
            # Extrage textul răspunsului
            if 'candidates' in result and len(result['candidates']) > 0:
                candidate = result['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content']:
                    parts = candidate['content']['parts']
                    if len(parts) > 0 and 'text' in parts[0]:
                        answer = parts[0]['text']
                    else:
                        raise Exception("Format răspuns neașteptat de la Gemini")
                else:
                    raise Exception("Format răspuns neașteptat de la Gemini")
            else:
                raise Exception("Nu s-a primit răspuns de la Gemini")
            
            # Returnează răspunsul
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'answer': answer}).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'Eroare: {str(e)}'}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
