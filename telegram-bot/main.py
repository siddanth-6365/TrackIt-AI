import os
import requests
from io import BytesIO
from telegram import ReplyKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    filters,
)
from telegram import Update
from telegram.ext import ContextTypes
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_URL = "http://127.0.0.1:8000"

# For demo purposes; map Telegram users to this test user_id
TEST_USER_ID = "8de7b467-2b32-4dcb-bace-98672bbef103"

os.makedirs("received_images", exist_ok=True)

async def start(update, context):
    keyboard = [["Upload Image", "Ask Question"]]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)
    msg = (
        "Welcome! What would you like to do?\n\n"
        "1️⃣ *Upload Image* (send your receipt image)\n"
        "2️⃣ *Ask Question* (query your expenses)\n\n"
        "Choose an option below or type your question."
    )
    await update.message.reply_text(msg, reply_markup=reply_markup, parse_mode="Markdown")

async def handle_text(update, context):
    text = update.message.text.strip()
    if text.lower() in ("upload image", "upload", "image"):
        await update.message.reply_text("Please send your receipt image now.")
    elif text.lower() in ("ask question", "ask", "question"):
        await update.message.reply_text("Please type your expense question now.")
    else:
        await ask_expense_query(update, context, text)

async def ask_expense_query(update, context, question):
    await update.message.reply_text("🔄 Processing your question...")
    payload = {"q": question, "user_id": TEST_USER_ID}
    try:
        res = requests.post(f"{API_URL}/query/ask", json=payload)
        res.raise_for_status()
        data = res.json()
        answer = data.get("answer") or "No answer returned."
        await update.message.reply_text(f"💡 {answer}")
    except Exception as e:
        print("query error", e)
        await update.message.reply_text(f"❌ Error: {e}")


async def handle_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🔄 Processing your receipt...")
    
    photo = update.message.photo[-1]  
    file_obj = await photo.get_file()  
    bio = BytesIO()
    
    await file_obj.download_to_memory(out=bio)
    bio.seek(0)
    
    data = await file_obj.download_as_bytearray()
    bio = BytesIO(data)
    
    files = {"file": ("receipt.jpg", bio, "image/jpeg")}
    data  = {"user_id": TEST_USER_ID}
    try:
        resp = requests.post(f"{API_URL}/receipts/telegram_upload", files=files, data=data)
        resp.raise_for_status()
        rec = resp.json()
        await update.message.reply_text(
            f"✅ Receipt #{rec['id']}:\n"
            f"• Vendor: {rec.get('vendor','N/A')}\n"
            f"• Date:   {rec.get('transaction_date','N/A')}\n"
            f"• Total:  ${rec.get('total_amount','N/A')}\n"
            f"• Category: {rec.get('expense_category','N/A')}"
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Error saving receipt: {e}")


def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.PHOTO, handle_image))

    print("Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()