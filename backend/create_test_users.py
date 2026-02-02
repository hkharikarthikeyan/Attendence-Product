#!/usr/bin/env python3
"""
Create test users for login testing
Run this script to add test users to your database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import supabase
import bcrypt

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_test_users():
    """Create test users with known passwords"""
    
    # Hash the passwords
    hod_hash = hash_password("hod123")
    faculty_hash = hash_password("faculty123")
    student_hash = hash_password("student123")
    
    users = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "email": "hod@college.edu",
            "password_hash": hod_hash,
            "role": "hod"
        },
        {
            "id": "22222222-2222-2222-2222-222222222222", 
            "email": "faculty@college.edu",
            "password_hash": faculty_hash,
            "role": "faculty"
        },
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "email": "student@college.edu", 
            "password_hash": student_hash,
            "role": "student"
        }
    ]
    
    print("Creating test users...")
    
    for user in users:
        try:
            # Check if user exists
            existing = supabase.table("users").select("*").eq("email", user["email"]).execute()
            
            if existing.data:
                # Update password
                supabase.table("users").update({"password_hash": user["password_hash"]}).eq("email", user["email"]).execute()
                print(f"[OK] Updated {user['role']}: {user['email']}")
            else:
                # Insert new user
                supabase.table("users").insert(user).execute()
                print(f"[OK] Created {user['role']}: {user['email']}")
                
        except Exception as e:
            print(f"[ERROR] Error with {user['email']}: {str(e)}")
    
    # Create profile records
    profiles = [
        {"table": "hod", "id": "11111111-1111-1111-1111-111111111111", "name": "Dr. John Smith", "employee_id": "HOD001", "department": "Computer Science"},
        {"table": "faculty", "id": "22222222-2222-2222-2222-222222222222", "name": "Prof. Jane Doe", "employee_id": "FAC001", "department": "Computer Science"},
        {"table": "students", "id": "33333333-3333-3333-3333-333333333333", "name": "Alex Johnson", "register_number": "REG2024001", "roll_number": "01", "class_year": "3rd Year", "section": "A", "batch": "2022-2026", "mobile": "9876543210", "email": "student@college.edu"}
    ]
    
    for profile in profiles:
        try:
            table_name = profile.pop("table")
            existing = supabase.table(table_name).select("*").eq("id", profile["id"]).execute()
            
            if not existing.data:
                supabase.table(table_name).insert(profile).execute()
                print(f"[OK] Created {table_name} profile")
            else:
                print(f"[OK] {table_name} profile exists")
                
        except Exception as e:
            print(f"[ERROR] Error creating profile: {str(e)}")
    
    print("\n" + "="*50)
    print("TEST USERS READY!")
    print("="*50)
    print("HOD Login: hod@college.edu / hod123")
    print("Faculty Login: faculty@college.edu / faculty123") 
    print("Student Login: student@college.edu / student123")
    print("="*50)

if __name__ == "__main__":
    create_test_users()