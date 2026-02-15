from http.server import BaseHTTPRequestHandler
import json
import os
import requests
import random
from urllib.parse import parse_qs, urlparse

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Încarcă datele statice
def load_static_data():
    """Încarcă datele statice din JSON"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Încearcă mai întâi în același folder (pentru Vercel)
    json_path = os.path.join(current_dir, 'sleep_priorities.json')
    if not os.path.exists(json_path):
        # Dacă nu există, încearcă în backend (pentru local)
        json_path = os.path.join(current_dir, '..', 'backend', 'sleep_priorities.json')
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

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

STATIC_DATA = load_static_data()

def get_synonym(category):
    """Obține un sinonim aleatoriu dintr-o categorie"""
    if STATIC_DATA.get('synonyms') and STATIC_DATA['synonyms'].get(category):
        return random.choice(STATIC_DATA['synonyms'][category])
    return ""

def detect_issues(answers):
    """Detectează problemele din răspunsuri"""
    issues = []
    problems = answers.get('problems', [])
    
    if isinstance(problems, list):
        for problem in problems:
            problem_lower = problem.lower()
            if 'rutin' in problem_lower or 'consistent' in problem_lower:
                issues.append('inconsistent_routine')
            if 'adoarme' in problem_lower and ('greu' in problem_lower or 'dificultate' in problem_lower):
                issues.append('sleep_association')
            if 'ecran' in problem_lower or 'tv' in problem_lower or 'tablet' in problem_lower or 'telefon' in problem_lower:
                issues.append('screen_before_bed')
            if ('trezeste' in problem_lower and 'des' in problem_lower) or 'treziri' in problem_lower:
                issues.append('wrong_wake_windows')
            if 'suficient' in problem_lower and 'nu' in problem_lower:
                issues.append('wrong_wake_windows')
            if 'devreme' in problem_lower:
                issues.append('wrong_wake_windows')
    
    routine_consistent = answers.get('routineConsistent', '').lower()
    if 'varia' in routine_consistent or 'parțial' in routine_consistent:
        issues.append('inconsistent_routine')
    
    screen_time = answers.get('screenTime', '').lower()
    if screen_time and ('da' in screen_time or 'yes' in screen_time or 'minute' in screen_time or 'ore' in screen_time):
        issues.append('screen_before_bed')
    
    sleeps_with = answers.get('sleepsWith', '').lower()
    if sleeps_with and ('bunica' in sleeps_with or 'legănat' in sleeps_with or 'lapte' in sleeps_with or 'brațe' in sleeps_with):
        issues.append('sleep_association')
    
    return list(set(issues))  # Elimină duplicatele

def get_priorities_for_issues(issues):
    """Obține prioritățile pentru problemele detectate"""
    if not STATIC_DATA.get('priorities'):
        return []
    
    priorities_list = []
    issues_data = STATIC_DATA.get('commonIssues', {})
    added_priority_ids = set()
    
    # Mapare directă issue -> priority
    issue_to_priority = {
        'inconsistent_routine': 'routine_consistency',
        'sleep_association': 'sleep_association',
        'screen_before_bed': 'screen_time',
        'wrong_wake_windows': 'wake_windows',
        'late_bedtime': 'bedtime_consistency'
    }
    
    for issue_id in issues:
        priority_id = issue_to_priority.get(issue_id)
        if priority_id and priority_id not in added_priority_ids:
            # Caută prioritatea în toate nivelurile
            for level in ['urgent', 'important', 'moderate']:
                if level in STATIC_DATA['priorities']:
                    for priority in STATIC_DATA['priorities'][level]:
                        if priority['id'] == priority_id:
                            priorities_list.append({
                                **priority,
                                'level': level
                            })
                            added_priority_ids.add(priority_id)
                            break
                    if priority_id in added_priority_ids:
                        break
    
    # Sortează după nivel (urgent, important, moderate)
    level_order = {'urgent': 0, 'important': 1, 'moderate': 2}
    priorities_list.sort(key=lambda x: level_order.get(x.get('level', 'moderate'), 2))
    
    return priorities_list

def build_gemini_prompt(question: str, answers: dict) -> str:
    """Construiește prompt-ul complet pentru Gemini - optimizat cu informații statice"""
    # Extrage numărul din răspunsul pentru vârstă (poate fi "19 luni" sau doar "19")
    age_value = answers.get('age', 0) or 0
    if isinstance(age_value, str):
        # Extrage primul număr din string
        import re
        age_match = re.search(r'\d+', str(age_value))
        age_months = int(age_match.group(0)) if age_match else 0
    else:
        age_months = int(age_value)
    age_group = get_age_group_from_months(age_months)
    
    # Folosește informații statice pentru vârstă (reduce costurile Gemini)
    age_data = STATIC_DATA.get('ageBasedSleepNeeds', {}).get(age_group, {})
    if age_data:
        age_info = f"""
INFORMAȚII STATICE DESPRE VÂRSTA COPILULUI ({age_months} luni - {age_group.replace('_', ' ')}):
- Somn total recomandat: {age_data['totalHours']['min']}-{age_data['totalHours']['max']} ore (optim: {age_data['totalHours']['optimal']} ore)
- Număr de somnuri recomandat: {age_data['naps']['min']}-{age_data['naps']['max']} somnuri (optim: {age_data['naps']['optimal']})
- Durată somn nocturn: {age_data['nightSleep']['min']}-{age_data['nightSleep']['max']} ore (optim: {age_data['nightSleep']['optimal']} ore)
- Ferestre de veghe (PV): {age_data['wakeWindows']}
- Ora culcării recomandată: {age_data['bedtime']}

NOTĂ: Aceste valori sunt standarde bazate pe cercetări științifice pentru această vârstă. Folosește-le ca referință în analiză.
"""
    else:
        age_info = ""
    
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
    
    # Detectează problemele (pentru a reduce prompt-ul și a oferi context)
    detected_issues = detect_issues(answers)
    issues_summary = ", ".join(detected_issues) if detected_issues else "Nu s-au detectat probleme specifice"
    
    # Folosește sinonime pentru varietate
    greeting = get_synonym('greetings') or "Bună!"
    introduction = get_synonym('introductions') or "Analizând situația copilului tău"
    
    prompt = f"""{greeting} {introduction}, ești Ruxandra Trufașu, somnolog expert specializat în somnul copiilor (0-4 ani).

{age_info}

PROBLEME DETECTATE (folosește aceste informații în analiză): {issues_summary}

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
   - IMPORTANT: Nu lăsa titluri goale sau incomplete (ex: "Somnuri:" fără explicație). Fiecare secțiune trebuie să aibă conținut complet și detaliat.
   - Dacă menționezi un aspect (ex: "Somnuri:", "Ecrane:", "Rutină:"), explică imediat ce face bine sau ce nu face bine, nu doar menționa titlul.

IMPORTANT:
- Răspunde ÎNTOTDEAUNA în limba română
- Fii detaliat dar clar
- Axează-te pe TOATE palierele și spune pentru fiecare ce face bine și ce nu
- Folosește termeni specifici somnului copiilor: PV (perioadă de veghe), SN (somn de noapte), ferestre de veghe, supra-oboseală, regresii, tranziții
- Nu fi prea formal - tonul e prietenos dar profesional
- Asigură-te că toate principiile fundamentale sunt menționate și explicate
- Folosește informațiile statice despre vârstă pentru recomandări precise
- Variind formulările folosind sinonime pentru a nu fi repetitiv
- La final, menționează că urmează un plan de acțiune cu priorități

Răspunsul tău (fără planul de acțiune - acesta va fi adăugat automat):"""
    
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
            
            # Detectează probleme și generează priorități
            issues = detect_issues(answers)
            priorities = get_priorities_for_issues(issues)
            
            # Dacă nu s-au găsit priorități specifice, adaugă priorități generale bazate pe probleme
            if not priorities:
                problems_list = answers.get('problems', [])
                if isinstance(problems_list, list) and len(problems_list) > 0:
                    # Adaugă priorități generale
                    if STATIC_DATA.get('priorities'):
                        # Adaugă primele 2-3 priorități urgente
                        urgent = STATIC_DATA['priorities'].get('urgent', [])[:2]
                        for p in urgent:
                            priorities.append({**p, 'level': 'urgent'})
            
            # Returnează răspunsul cu priorități
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'answer': answer,
                'priorities': priorities
            }).encode())
            
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
