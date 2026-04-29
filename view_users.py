import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('test.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print('=== Database Tables ===')
for table in tables:
    print(f'  • {table[0]}')

print('\n=== Users Login Data ===')
try:
    cursor.execute('SELECT id, email, name, role, is_verified FROM users;')
    users = cursor.fetchall()
    if users:
        for user in users:
            print(f'\n  ID: {user[0]}')
            print(f'  Email: {user[1]}')
            print(f'  Name: {user[2]}')
            print(f'  Role: {user[3]}')
            print(f'  Email Verified: {bool(user[4])}')
    else:
        print('  No users found!')
except Exception as e:
    print(f'  Error: {e}')

conn.close()
