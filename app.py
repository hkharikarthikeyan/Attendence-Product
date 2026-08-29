import bcrypt

password = "Hod@121212"
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

print(hashed.decode())