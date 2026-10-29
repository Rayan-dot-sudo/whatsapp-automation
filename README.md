# 🚀 WhatsApp AI Automation Engine (24/7 Free)

Yeh system aapke WhatsApp number par aane wale har customer message ko **Google Gemini AI** ke zariye **company ke data** ko parh kar natural aur accurate reply deta hai.

---

## 📁 Project Structure (Aapka Folder)
```text
D:\projectssssss\whatsapp automation\
├── main.py              # FastAPI server aur Meta Webhook
├── gemini_service.py    # Google Gemini AI ka logic aur prompt
├── whatsapp_service.py  # Meta WhatsApp Cloud API ko message bhejne ka code
├── knowledge.json       # Company ki profile, services, prices aur FAQs
├── requirements.txt     # Python packages
├── Procfile             # 24/7 Cloud deployment instruction
└── .env.example         # API keys ka template
```

---

## 🛠️ Step 1: Local Setup & Dependencies Install

Terminal / PowerShell open karein aur is folder mein yeh commands chalayein:

```bash
# 1. Dependencies install karein
pip install -r requirements.txt

# 2. .env file banayein
cp .env.example .env
```

Ab `.env` file open karein aur apna **GEMINI_API_KEY** add karein:
* [Google AI Studio](https://aistudio.google.com/) se free API key lein.

---

## 🧪 Step 2: WhatsApp Connect Kiye Baghair AI Test Karein

Aap abhi apne laptop par server chala kar test kar sakte hain:

```bash
uvicorn main:app --reload --port 8000
```

Browser mein open karein: `http://localhost:8000/docs`
* Wahan `/test-chat` endpoint par ja kar koi bhi question likhein (jaise *"Aapki service ki price kya hai?"*).
* AI aapki `knowledge.json` file se parh kar bilkul natural human-like reply dega.

---

## 📱 Step 3: Meta WhatsApp Cloud API Connect Karna

1. [Meta Developers Portal](https://developers.facebook.com/) par free account banayein.
2. **Create App** -> Select **Business** -> Add **WhatsApp** product.
3. Meta aapko ek **Test Number** aur **Temporary Access Token** dega.
4. `.env` file mein yeh keys daalein:
   * `WHATSAPP_TOKEN`
   * `PHONE_NUMBER_ID`
   * `VERIFY_TOKEN` (jo aapki marzi ka secret word ho)

---

## ☁️ Step 4: Laptop Band Hone Par 24/7 Kaise Chalega? (Cloud Deployment)

Jab local testing theek ho jaye:
1. Is folder ko **GitHub** par private repo mein push karein.
2. [Render.com](https://render.com/) par free account banayein.
3. **New Web Service** select karein aur apni repo connect karein.
4. Environment Variables mein apni `.env` wali keys paste kar dein.
5. Render aapko ek live URL de dega (e.g. `https://my-whatsapp-bot.onrender.com`).
6. Meta Developer Portal ke **Webhooks** section mein ja kar:
   * **Callback URL:** `https://my-whatsapp-bot.onrender.com/webhook`
   * **Verify Token:** Jo aapne `.env` mein rakha tha.
   * **Subscribe:** `messages` field ko tick karein.

Ab aap apna laptop bilkul band kar dein, **Aapka WhatsApp Bot cloud par 24/7 active rahega!**
