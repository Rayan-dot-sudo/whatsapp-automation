import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Gemini Client Initialize
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

def load_company_knowledge() -> str:
    """Load knowledge base from knowledge.json file."""
    filepath = os.path.join(os.path.dirname(__file__), "knowledge.json")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return json.dumps(data, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Warning: Could not read knowledge.json: {e}")
        return "{}"

BASE_SYSTEM_INSTRUCTION = """
Aap ek professional, warm aur respectful customer support representative hain.
Aapka kaam customer ke WhatsApp message ka seedha, asaan aur natural jawab dena hai.

CRITICAL RULES:
1. ROBOTIC MAT BANO: AI jaisi kitabi zaban (jaise 'As an AI language model...', 'I am an artificial intelligence', 'Aapka din kaisa guzar raha hai?') bilkul use mat karo.
2. ZUBAN MATCH KARO: Agar customer Roman Urdu mein likhe toh jawab Roman Urdu mein do (e.g. 'Ji zaroor', 'Hamara office 10 baje khulta hai'). Agar customer English mein likhe toh fluent English mein do.
3. CONCISE & CRISP: WhatsApp par lamba bhashan ya baray paragraphs bilkul mat likho. Max 1 se 3 sentences mein jawab do.
4. STRICT TRUTH: Sirf neeche di gayi COMPANY KNOWLEDGE BASE se jawab do. Apne paas se koi qeemat ya fake wada mat karo.
5. ESCALATION: Agar customer aisi cheez pooche jo knowledge base mein na ho ya complaint kare, toh politely bolo:
   "Main ne aapka sawal note kar liya hai, hamari team jald hi aap se rabta karegi."
"""

async def generate_ai_reply(user_message: str, sender_number: str) -> str:
    """Generate a context-aware, human-like response using Gemini."""
    if not client:
        return "Salam! Hamari team aapke message ka jald jawab degi. Shukriya!"

    knowledge = load_company_knowledge()
    system_instruction = f"{BASE_SYSTEM_INSTRUCTION}\n\n=== COMPANY KNOWLEDGE BASE ===\n{knowledge}"

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,  # Low temperature keeps answers accurate and faithful to facts
                max_output_tokens=250
            )
        )
        
        reply = response.text.strip() if response.text else ""
        if not reply:
            return "Salam! Hamara representative jald aap se rabta karega."
        return reply

    except Exception as e:
        print(f"Gemini API Error for {sender_number}: {e}")
        return "Salam! Shukriya aapke message ka. Hamari team jald aapki rehnumai karegi."
