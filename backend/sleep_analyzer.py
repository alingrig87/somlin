"""
Sistem de analiză bazat pe reguli pentru datele de somn
Folosește JSON cu răspunsuri predefinite și logică bazată pe condiții
"""
import json
import os
import random
from typing import Dict, List, Any

# Mapare termeni calitate somn engleză -> română
SLEEP_QUALITY_MAP = {
    'excellent': 'excelentă',
    'good': 'bună',
    'fair': 'acceptabilă',
    'poor': 'slabă',
    'verypoor': 'foarte slabă',
    'veryPoor': 'foarte slabă',
    'VeryPoor': 'foarte slabă'
}

def get_sleep_quality_ro(quality: str) -> str:
    """Convertește calitatea somnului din engleză în română"""
    return SLEEP_QUALITY_MAP.get(quality.lower(), quality)

# Încarcă răspunsurile din JSON
def load_responses():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Încearcă să încarce fișierul complex, dacă nu există folosește cel simplu
    json_path = os.path.join(current_dir, 'sleep_responses_complex.json')
    if not os.path.exists(json_path):
        json_path = os.path.join(current_dir, 'sleep_responses.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_age_group(age_months: int) -> str:
    """Determină grupa de vârstă"""
    if age_months <= 3:
        return "0-3_months"
    elif age_months <= 6:
        return "3-6_months"
    elif age_months <= 12:
        return "6-12_months"
    elif age_months <= 18:
        return "12-18_months"
    elif age_months <= 24:
        return "18-24_months"
    elif age_months <= 36:
        return "2-3_years"
    else:
        return "3-4_years"

def check_condition(condition: Dict, data: Dict) -> bool:
    """Verifică dacă o condiție este îndeplinită"""
    for key, value in condition.items():
        if key not in data:
            return False
        
        data_value = data[key]
        
        # Verificare pentru range (min/max)
        if isinstance(value, dict):
            if "min" in value and data_value < value["min"]:
                return False
            if "max" in value and data_value > value["max"]:
                return False
            if "minLength" in value:
                if not isinstance(data_value, list) or len(data_value) < value["minLength"]:
                    return False
            if "include" in value:
                if isinstance(data_value, list):
                    if not any(item.lower() in [v.lower() for v in value["include"]] for item in data_value):
                        return False
                elif data_value.lower() not in [v.lower() for v in value["include"]]:
                    return False
            if "exclude" in value:
                if isinstance(data_value, list):
                    if any(item.lower() in [v.lower() for v in value["exclude"]] for item in data_value):
                        return False
                elif data_value.lower() in [v.lower() for v in value["exclude"]]:
                    return False
        
        # Verificare pentru listă de valori
        elif isinstance(value, list):
            if isinstance(data_value, list):
                if not any(v in value for v in data_value):
                    return False
            elif data_value not in value:
                return False
        
        # Verificare exactă
        else:
            if data_value != value:
                return False
    
    return True

def analyze_sleep_data(data: Dict) -> Dict:
    """
    Analizează datele de somn și returnează răspunsuri personalizate
    """
    responses_data = load_responses()
    age_months = data.get('childAgeMonths', 0)
    age_group = get_age_group(age_months)
    
    # Pregătește datele pentru analiză
    analysis_data = {
        'childAgeMonths': age_months,
        'totalSleepHours': data.get('totalSleepHours', 0),
        'sleepQuality': data.get('sleepQuality', ''),
        'numberOfNaps': data.get('numberOfNaps', 0),
        'sleepLocation': data.get('sleepLocation', ''),
        'sleepRoutine': data.get('sleepRoutine', []),
        'issues': data.get('issues', []),
        'putToSleepBy': data.get('putToSleepBy', ''),
    }
    
    # Colectează toate răspunsurile care se potrivesc
    matched_responses = []
    
    # Verifică răspunsurile specifice grupei de vârstă
    if age_group in responses_data.get('ageGroups', {}):
        age_responses = responses_data['ageGroups'][age_group].get('responses', {})
        
        for response_key, response_data in age_responses.items():
            if 'conditions' in response_data:
                if check_condition(response_data['conditions'], analysis_data):
                    matched_responses.append({
                        'type': 'age_specific',
                        'key': response_key,
                        'data': response_data
                    })
    
    # Verifică răspunsurile generale
    general_responses = responses_data.get('generalResponses', {})
    for response_key, response_data in general_responses.items():
        if 'conditions' in response_data:
            if check_condition(response_data['conditions'], analysis_data):
                matched_responses.append({
                    'type': 'general',
                    'key': response_key,
                    'data': response_data
                })
    
    # Combină răspunsurile
    combined_analysis = []
    combined_recommendations = []
    combined_concerns = []
    combined_positive_notes = []
    
    # Prioritizează răspunsurile specifice vârstei
    age_specific = [r for r in matched_responses if r['type'] == 'age_specific']
    general = [r for r in matched_responses if r['type'] == 'general']
    
    # Sortează răspunsurile după specificitate (mai multe condiții = mai specific)
    def count_conditions(response):
        conditions = response['data'].get('conditions', {})
        return len(conditions)
    
    age_specific.sort(key=count_conditions, reverse=True)
    general.sort(key=count_conditions, reverse=True)
    
    # Alege cel mai specific răspuns pentru analiză (primul din lista sortată)
    # Dar combină recomandările și preocupările din toate răspunsurile relevante
    primary_response = None
    if age_specific:
        primary_response = age_specific[0]
    elif general:
        primary_response = general[0]
    
    # Dacă există răspunsuri specifice, folosește-le
    if primary_response:
        data = primary_response['data']
        
        # Suport pentru variante de analiză
        if 'analysisVariants' in data:
            analysis_text = random.choice(data['analysisVariants'])
            combined_analysis.append(analysis_text)
        elif 'analysis' in data:
            combined_analysis.append(data['analysis'])
        
        # Combină recomandările din toate răspunsurile relevante (max 2-3 răspunsuri)
        relevant_responses = (age_specific[:2] if age_specific else []) + (general[:1] if general and not age_specific else [])
        for response in relevant_responses:
            resp_data = response['data']
            
            # Suport pentru variante de recomandări
            if 'recommendationVariants' in resp_data:
                recs = random.choice(resp_data['recommendationVariants'])
                combined_recommendations.extend(recs)
            elif 'recommendations' in resp_data:
                combined_recommendations.extend(resp_data['recommendations'])
            
            # Suport pentru variante de preocupări
            if 'concernVariants' in resp_data:
                concerns_list = random.choice(resp_data['concernVariants'])
                combined_concerns.extend(concerns_list)
            elif 'concerns' in resp_data:
                combined_concerns.extend(resp_data['concerns'])
            
            # Suport pentru variante de note pozitive
            if 'positiveNoteVariants' in resp_data:
                notes_list = random.choice(resp_data['positiveNoteVariants'])
                combined_positive_notes.extend(notes_list)
            elif 'positiveNotes' in resp_data:
                combined_positive_notes.extend(resp_data['positiveNotes'])
    else:
        # Dacă nu există răspunsuri specifice, combină toate răspunsurile generale
        for response in general:
            data = response['data']
            
            if 'analysisVariants' in data:
                analysis_text = random.choice(data['analysisVariants'])
                combined_analysis.append(analysis_text)
            elif 'analysis' in data:
                combined_analysis.append(data['analysis'])
            
            if 'recommendationVariants' in data:
                recs = random.choice(data['recommendationVariants'])
                combined_recommendations.extend(recs)
            elif 'recommendations' in data:
                combined_recommendations.extend(data['recommendations'])
            
            if 'concernVariants' in data:
                concerns_list = random.choice(data['concernVariants'])
                combined_concerns.extend(concerns_list)
            elif 'concerns' in data:
                combined_concerns.extend(data['concerns'])
            
            if 'positiveNoteVariants' in data:
                notes_list = random.choice(data['positiveNoteVariants'])
                combined_positive_notes.extend(notes_list)
            elif 'positiveNotes' in data:
                combined_positive_notes.extend(data['positiveNotes'])
    
    # Dacă nu s-au găsit răspunsuri specifice, folosește un răspuns generic
    if not combined_analysis:
        age_info = responses_data['ageGroups'].get(age_group, {})
        recommended = age_info.get('recommendedSleep', {})
        
        total_hours = analysis_data['totalSleepHours']
        # Obține valorile din JSON, fără default-uri greșite
        total_hours_info = recommended.get('totalHours', {})
        if isinstance(total_hours_info, dict):
            rec_min = total_hours_info.get('min', 10)
            rec_max = total_hours_info.get('max', 14)
        else:
            rec_min = 10
            rec_max = 14
        
        # Verifică dacă există probleme raportate
        has_issues = len(analysis_data.get('issues', [])) > 0
        # Mapare termeni englezi la română
        sleep_quality = analysis_data.get('sleepQuality', '').lower()
        poor_quality = sleep_quality in ['poor', 'verypoor', 'slabă', 'foarte slabă']
        
        if total_hours < rec_min:
            severity = "foarte preocupantă" if total_hours < rec_min - 2 else "preocupantă"
            deficit = rec_min - total_hours
            combined_analysis.append(
                f"Pentru vârsta de {age_months} luni, durata recomandată de somn este între {rec_min} și {rec_max} ore pe zi. "
                f"Durata totală de somn raportată ({total_hours} ore) este sub minimul recomandat cu {deficit:.1f} ore. "
                f"Situația este {severity} și necesită atenție imediată. "
                f"Somnul insuficient poate afecta grav dezvoltarea, creșterea și comportamentul copilului."
            )
            combined_recommendations.append(
                f"Încearcă urgent să extinzi timpul de somn la minim {rec_min} ore pe zi pentru a ajunge în intervalul recomandat"
            )
            if has_issues or poor_quality:
                combined_concerns.append(
                    "Somnul insuficient combinat cu probleme raportate indică o situație care necesită evaluare medicală"
                )
        elif total_hours > rec_max:
            combined_analysis.append(
                f"Durata totală de somn ({total_hours} ore) este peste recomandările normale. "
                "Verifică că copilul se trezește pentru mese și activități normale."
            )
        else:
            # Calculează poziția relativă în interval
            range_size = rec_max - rec_min
            position_in_range = (total_hours - rec_min) / range_size if range_size > 0 else 0.5
            
            # Determină poziția relativă
            if position_in_range < 0.3:
                position_text = "spre limita inferioară"
                position_warning = " Este important să monitorizezi că somnul nu scade sub minimul recomandat."
            elif position_in_range > 0.7:
                position_text = "spre limita superioară"
                position_warning = ""
            else:
                position_text = "în zona optimă"
                position_warning = ""
            
            # Construiește mesajul de bază cu evaluarea min/max
            base_analysis = (
                f"Pentru vârsta de {age_months} luni, durata recomandată de somn este între {rec_min} și {rec_max} ore pe zi. "
                f"Durata totală de somn raportată ({total_hours} ore) se încadrează în acest interval, ceea ce este bine, "
                f"însă se situează {position_text} a intervalului.{position_warning}"
            )
            
            # Doar dacă nu există probleme și calitatea este bună, spune că este ok
            if has_issues or poor_quality:
                quality_original = analysis_data.get('sleepQuality', 'necunoscută')
                quality_text = get_sleep_quality_ro(quality_original)
                combined_analysis.append(
                    f"{base_analysis} "
                    f"Cu toate acestea, există probleme raportate ({', '.join(analysis_data.get('issues', []))}) și calitatea somnului este {quality_text}. "
                    f"Aceste aspecte necesită atenție și îmbunătățiri."
                )
                combined_recommendations.append(
                    "Adresează problemele raportate pentru a îmbunătăți calitatea somnului"
                )
            else:
                combined_analysis.append(
                    f"{base_analysis} Programul de somn pare să fie adecvat."
                )
    
    # Elimină duplicatele
    combined_recommendations = list(dict.fromkeys(combined_recommendations))
    combined_concerns = list(dict.fromkeys(combined_concerns))
    combined_positive_notes = list(dict.fromkeys(combined_positive_notes))
    
    # Construiește răspunsul final
    return {
        'analysis': '\n\n'.join(combined_analysis) if combined_analysis else 
                    "Analiză generală: Programul de somn pare să fie în limite normale. Continuă să observi pattern-urile de somn.",
        'recommendations': combined_recommendations[:10] if combined_recommendations else [
            "Menține un program consistent de somn",
            "Asigură un mediu confortabil și liniștit pentru somn",
            "Observă pattern-urile de somn pentru a identifica nevoile copilului"
        ],
        'concerns': combined_concerns[:5] if combined_concerns else None,
        'positive_notes': combined_positive_notes[:5] if combined_positive_notes else None
    }
