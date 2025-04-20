from dotenv import load_dotenv
import streamlit as st
import os
import sqlite3
import google.generativeai as genai

# Load .env variables
load_dotenv()

# Configure Gemini API Key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Prompt template
prompt = ["""
You are an expert in converting English questions to SQL query!
The SQL database has the name STUDENT with columns - NAME, CLASS, SECTION, MARKS.

Examples:
Q: How many entries are present?
A: SELECT COUNT(*) FROM STUDENT;

Q: Tell me all the students in Data Science class?
A: SELECT * FROM STUDENT WHERE CLASS="Data Science";

Only return the SQL query — no extra formatting, and no ``` or "sql" blocks.
"""]

# Gemini function
def get_gemini_response(question, prompt):
    model = genai.GenerativeModel(model_name="models/gemini-1.5-pro-latest")
    response = model.generate_content([prompt[0], question])
    return response.text.strip()


# SQL execution
def read_sql_query(sql, db):
    conn = sqlite3.connect(db)
    cur = conn.cursor()
    try:
        cur.execute(sql)
        rows = cur.fetchall()
    except sqlite3.Error as e:
        rows = [(f"SQL Error: {e}",)]
    conn.close()
    return rows

# Streamlit app
st.set_page_config(page_title="SQL Assistant")
st.title("💬 English to SQL (Gemini)")

question = st.text_input("Ask a question about the student database:")
if st.button("Submit") and question:
    sql_query = get_gemini_response(question, prompt)
    st.code(sql_query, language='sql')
    results = read_sql_query(sql_query, "student.db")
    st.subheader("Results:")
    st.table(results)
