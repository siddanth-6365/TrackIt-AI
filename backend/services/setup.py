import sqlite3

# Connect to SQLite
connection = sqlite3.connect("student.db")
cursor = connection.cursor()

# Create table
table_info = """
CREATE TABLE IF NOT EXISTS STUDENT(
    NAME TEXT,
    CLASS TEXT,
    SECTION TEXT,
    MARKS INTEGER
);
"""
cursor.execute(table_info)

# Insert records
students = [
    ('Krish', 'Data Science', 'A', 90),
    ('Sudhanshu', 'Data Science', 'B', 100),
    ('Darius', 'Data Science', 'A', 86),
    ('Vikash', 'DEVOPS', 'A', 50),
    ('Dipesh', 'DEVOPS', 'A', 35)
]

cursor.executemany("INSERT INTO STUDENT VALUES (?, ?, ?, ?)", students)

# Display inserted records
print("The inserted records are:")
data = cursor.execute("SELECT * FROM STUDENT")
for row in data:
    print(row)

connection.commit()
connection.close()




# import sqlite3

# # Connect to SQLite
# connection = sqlite3.connect("expense_tracker.db")
# cursor = connection.cursor()

# # Create Users table
# cursor.execute("""
# CREATE TABLE IF NOT EXISTS Users (
#     user_id INTEGER PRIMARY KEY AUTOINCREMENT,
#     name TEXT NOT NULL
# );
# """)

# # Create Categories table
# cursor.execute("""
# CREATE TABLE IF NOT EXISTS Categories (
#     category_id INTEGER PRIMARY KEY AUTOINCREMENT,
#     name TEXT NOT NULL
# );
# """)

# # Create Transactions table
# cursor.execute("""
# CREATE TABLE IF NOT EXISTS Transactions (
#     transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
#     user_id INTEGER,
#     category_id INTEGER,
#     amount REAL,
#     date TEXT,
#     description TEXT,
#     FOREIGN KEY(user_id) REFERENCES Users(user_id),
#     FOREIGN KEY(category_id) REFERENCES Categories(category_id)
# );
# """)

# # Insert sample data
# cursor.execute("INSERT INTO Users (name) VALUES ('John Doe');")
# cursor.execute("INSERT INTO Categories (name) VALUES ('Groceries');")
# cursor.execute("INSERT INTO Categories (name) VALUES ('Utilities');")
# cursor.execute("""
# INSERT INTO Transactions (user_id, category_id, amount, date, description)
# VALUES (1, 1, 100.50, '2025-04-20', 'Weekly grocery shopping');
# """)

# # Display inserted records
# print("The inserted transactions are:")
# data = cursor.execute("SELECT * FROM Transactions")
# for row in data:
#     print(row)

# connection.commit()
# connection.close()
