"""
Test script to verify Supabase connection and students table
Run this to diagnose database issues
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import supabase
from app.config import settings

def test_connection():
    """Test Supabase connection"""
    print("=" * 60)
    print("SUPABASE CONNECTION TEST")
    print("=" * 60)
    
    print(f"\n1. Configuration:")
    print(f"   URL: {settings.SUPABASE_URL}")
    print(f"   Key: {settings.SUPABASE_KEY[:20]}..." if settings.SUPABASE_KEY else "   Key: NOT SET")
    
    try:
        print("\n2. Testing connection...")
        # Try to query students table
        result = supabase.table("students").select("*").limit(1).execute()
        print("   [OK] Connection successful!")
        print(f"   Students table exists and is accessible")
        
        # Get count
        count_result = supabase.table("students").select("id", count="exact").execute()
        print(f"   Total students in database: {count_result.count}")
        
        # Show sample student if exists
        if result.data:
            print(f"\n3. Sample student record:")
            student = result.data[0]
            for key, value in student.items():
                print(f"   {key}: {value}")
        else:
            print(f"\n3. No students found in database (table is empty)")
            
        # Test insert capability
        print(f"\n4. Testing insert capability...")
        test_student = {
            "name": "Test Student",
            "register_number": "TEST001",
            "roll_number": "99",
            "class_year": "1st Year",
            "section": "A",
            "batch": "Test Batch"
        }
        
        insert_result = supabase.table("students").insert(test_student).execute()
        
        if insert_result.data:
            print("   [OK] Insert test successful!")
            inserted_id = insert_result.data[0]['id']
            
            # Clean up test data
            supabase.table("students").delete().eq("id", inserted_id).execute()
            print("   [OK] Test data cleaned up")
        else:
            print("   [ERROR] Insert test failed - no data returned")
            
    except Exception as e:
        print(f"   [ERROR] Error: {str(e)}")
        print(f"\n   Possible issues:")
        print(f"   - Supabase credentials are incorrect")
        print(f"   - Students table doesn't exist")
        print(f"   - Network/firewall blocking connection")
        print(f"   - Supabase project is paused/inactive")
        return False
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED SUCCESSFULLY")
    print("=" * 60)
    return True

def check_table_structure():
    """Check students table structure"""
    print("\n" + "=" * 60)
    print("CHECKING TABLE STRUCTURE")
    print("=" * 60)
    
    try:
        # Get a sample record to see structure
        result = supabase.table("students").select("*").limit(1).execute()
        
        if result.data:
            print("\nCurrent table columns:")
            for key in result.data[0].keys():
                print(f"   - {key}")
        else:
            print("\nTable is empty, cannot determine structure")
            print("Expected columns:")
            expected = ["id", "name", "register_number", "roll_number", 
                       "class_year", "section", "batch", "mobile", "email",
                       "father_name", "mother_name", "created_at"]
            for col in expected:
                print(f"   - {col}")
                
    except Exception as e:
        print(f"Error checking structure: {str(e)}")

if __name__ == "__main__":
    print("\nStarting Supabase Diagnostics...\n")
    
    if test_connection():
        check_table_structure()
        print("\nAll tests passed! Database is ready for Excel uploads.\n")
    else:
        print("\nDatabase connection failed. Please check configuration.\n")
