import os
import httpx
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")
API_VERSION = os.getenv("META_API_VERSION", "v21.0")

GRAPH_API_URL = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages"

async def send_whatsapp_message(to_phone: str, message_text: str) -> bool:
    """
    Meta WhatsApp Cloud API ke zariye customer ko reply send karta hai.
    """
    if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID:
        print("[WhatsApp Service Error] WHATSAPP_TOKEN ya PHONE_NUMBER_ID set nahi hai .env mein!")
        return False

    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message_text
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(GRAPH_API_URL, json=payload, headers=headers)
            
            if response.status_code in [200, 201]:
                print(f"[Success] Message sent to {to_phone}")
                return True
            else:
                print(f"[Meta API Error {response.status_code}] Response: {response.text}")
                return False

    except Exception as e:
        print(f"[WhatsApp Sending Exception] {e}")
        return False
