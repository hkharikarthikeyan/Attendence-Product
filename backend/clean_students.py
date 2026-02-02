#!/usr/bin/env python3
"""
Clean duplicate register numbers in students table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import supabase

def check_students_table():
    """Check current students and clean duplicates"""
    
    print("Checking students table...")
    
    try:
        # Get all students
        result = supabase.table("students").select("*").execute()
        
        print(f"Total students found: {len(result.data)}")
        
        if result.data:
            print("\nCurrent students:")
            for student in result.data:
                print(f"  ID: {student['id']}")
                print(f"  Name: {student['name']}")
                print(f"  Register: {student['register_number']}")
                print(f"  Roll: {student['roll_number']}")
                print(f"  Class: {student['class_year']} - {student['section']}")
                print("-" * 40)
        
        # Check for duplicates or placeholder data
        duplicates = []
        placeholders = []
        
        for student in result.data:
            reg_num = student['register_number']
            if reg_num in ['REG NO.', 'REG_NO', 'REGISTER_NUMBER', '']:
                placeholders.append(student)
        
        if placeholders:
            print(f"\nFound {len(placeholders)} placeholder records:")
            for student in placeholders:
                print(f"  {student['name']} - {student['register_number']}")
            
            # Delete placeholder records
            for student in placeholders:
                supabase.table("students").delete().eq("id", student['id']).execute()
                print(f"[DELETED] {student['name']} - {student['register_number']}")
        
        print("\nStudents table cleaned!")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    check_students_table()