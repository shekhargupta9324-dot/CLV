import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('test.db')
cursor = conn.cursor()

# Promote first user to admin
cursor.execute("UPDATE users SET role = 'admin' WHERE email = 'test@example.com'")
conn.commit()

print("✅ User 'test@example.com' promoted to ADMIN role!")

# Verify the change
cursor.execute('SELECT id, email, name, role FROM users;')
users = cursor.fetchall()
print('\n=== Updated Users ===')
for user in users:
    print(f'  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Role: {user[3]}')

conn.close()
