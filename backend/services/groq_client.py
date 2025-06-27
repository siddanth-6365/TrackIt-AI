from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

groqClient = Groq(api_key=os.getenv("GROQ_API_KEY"))