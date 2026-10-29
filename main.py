import os
from fastapi import FastAPI, Request, Response, BackgroundTasks, Query
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv

from gemini_service import generate_ai_reply
from whatsapp_service import send_whatsapp_message

load_dotenv()

app = FastAPI(
    title="WhatsApp AI Automation Engine",
    description="24/7 Production-grade AI Assistant for WhatsApp",
    version="1.0.0"
)

VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "my_secret_verify_token_123")

@app.get("/")
def home():
    """Health check endpoint to ensure server is running 24/7."""
    html_path = os.path.join(os.path.dirname(__file__), "dashboard.html")
    if os.path.exists(html_path):
        return FileResponse(html_path)
    return {
        "status": "online",
        "service": "WhatsApp AI Engine 24/7",
        "cloud_status": "active"
    }

@app.get("/dashboard")
def view_dashboard():
    """Live interactive web dashboard."""
    html_path = os.path.join(os.path.dirname(__file__), "dashboard.html")
    return FileResponse(html_path)


# ==========================================
# 1. META WEBHOOK VERIFICATION (GET)
# ==========================================
@app.get("/webhook")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    """
    Meta Developer Dashboard jab webhook verify karta hai, toh yeh check hota hai.
    """
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        print("[Webhook Verification] Successfully verified with Meta!")
        return Response(content=hub_challenge, media_type="text/plain")
    
    print("[Webhook Verification] Failed. Token mismatch.")
    return Response(content="Verification failed", status_code=403)

# ==========================================
# 2. INCOMING WHATSAPP MESSAGES (POST)
# ==========================================
@app.post("/webhook")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Meta se aane wale har WhatsApp message ko receive karta hai.
    Meta ko 3 seconds ke andar 200 OK chahiye hota hai, is liye background task use hota hai.
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(content={"status": "invalid json"}, status_code=400)

    # Process message in background without blocking Meta
    background_tasks.add_task(process_whatsapp_event, body)
    return {"status": "event_received"}

async def process_whatsapp_event(payload: dict):
    """Payload se message extract kar ke Gemini AI se reply karwata hai."""
    try:
        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                
                # Agar sirf message delivery/read status update ho toh skip karein
                if "statuses" in value and "messages" not in value:
                    continue

                messages = value.get("messages", [])
                for msg in messages:
                    sender = msg.get("from")
                    msg_type = msg.get("type")

                    # Sirf text messages process karein
                    if msg_type == "text":
                        user_text = msg.get("text", {}).get("body", "").strip()
                        print(f"[New Message] From {sender}: {user_text}", flush=True)

                        # 1. Gemini AI se natural reply generate karwayein
                        ai_reply = await generate_ai_reply(user_text, sender)
                        print(f"[AI Reply] To {sender}: {ai_reply}", flush=True)

                        # 2. Meta WhatsApp Cloud API ke zariye send karein
                        success = await send_whatsapp_message(sender, ai_reply)
                        print(f"[Dispatch Status] Message sent: {success}", flush=True)

    except Exception as e:
        print(f"[Webhook Event Processing Error] {e}", flush=True)

# ==========================================
# 3. DIRECT LOCAL TEST ENDPOINT (POST)
# ==========================================
@app.post("/test-chat")
async def local_test_chat(request: Request):
    """
    Testing endpoint: WhatsApp connect kiye baghair AI ke answers test karne ke liye.
    Example payload: {"message": "Aapki services ki price kya hai?"}
    """
    try:
        data = await request.json()
    except Exception:
        data = {}
    user_text = data.get("message", "Salam") if isinstance(data, dict) else "Salam"
    reply = await generate_ai_reply(user_text, "test-user")
    return {
        "user_message": user_text,
        "ai_response": reply
    }
