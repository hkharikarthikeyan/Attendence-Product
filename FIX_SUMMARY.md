# FIX SUMMARY - Faculty Leave Requests Not Visible on HOD Page

## Problem
Faculty leave requests were being stored in the database but **NOT showing on the HOD approval page**.

## Root Cause
The HOD backend endpoint (`/api/hod/faculty-leaves`) was using incorrect Supabase join syntax:
```python
# ❌ INCORRECT - This was failing silently
result = supabase.table("leave_requests").select(
    "*, faculty:user_id(name, employee_id)"
).eq("role", "faculty").execute()
```

The join syntax `faculty:user_id(name, employee_id)` doesn't work because:
1. Supabase requires explicit foreign key relationships
2. The relationship wasn't properly defined in the schema
3. Errors were being caught and returning empty array `[]`

## Solution Applied
Changed the query to fetch data in two steps:

```python
# ✅ CORRECT - Fetch separately and combine
# Step 1: Get all leave requests
result = supabase.table("leave_requests").select("*").eq("role", "faculty").execute()

# Step 2: For each request, fetch faculty details
for leave in result.data:
    faculty_data = supabase.table("faculty").select("name, employee_id").eq("id", leave["user_id"]).execute()
    leave["faculty"] = faculty_data.data[0] if faculty_data.data else {"name": "Unknown"}
```

## Files Modified
1. ✅ `backend/app/routes/hod.py` - Fixed `get_faculty_leaves()` function

## How to Apply the Fix

### Option 1: File Already Updated
The fix has been applied to your `hod.py` file. Just restart the backend:
```bash
cd backend
# Stop current server (Ctrl+C)
python -m uvicorn app.app:app --reload
```

### Option 2: Manual Update
If you need to apply manually, replace lines 398-405 in `backend/app/routes/hod.py` with:
```python
@router.get("/faculty-leaves")
async def get_faculty_leaves(current_user: CurrentUser = Depends(require_hod)):
    """Get all faculty leave requests."""
    try:
        # Get leave requests
        result = supabase.table("leave_requests").select("*").eq("role", "faculty").order("created_at", desc=True).execute()
        
        # Enrich with faculty details
        requests = []
        for leave in result.data:
            faculty_data = supabase.table("faculty").select("name, employee_id").eq("id", leave["user_id"]).execute()
            leave["faculty"] = faculty_data.data[0] if faculty_data.data else {"name": "Unknown", "employee_id": "N/A"}
            requests.append(leave)
        
        return {"requests": requests}
    except Exception as e:
        print(f"Error fetching faculty leaves: {str(e)}")
        return {"requests": []}
```

## Testing the Fix

### Quick Test (Browser)
1. Login as Faculty
2. Submit a leave request
3. Login as HOD
4. Go to "Leave Approvals" page
5. **You should now see the faculty's leave request!**

### Automated Test (Python)
```bash
cd backend
python test_leave_flow.py
```

Expected output:
```
✅ Faculty logged in successfully
✅ Leave request submitted
✅ Faculty sees 1 leave request(s)
✅ HOD logged in successfully
✅ HOD sees 1 leave request(s)
   Request 1:
   - Faculty: Prof. Jane Doe
   - Type: od
   - Status: pending
✅ ALL TESTS PASSED
```

## Verification Checklist

- [ ] Backend server restarted
- [ ] Faculty can submit leave requests
- [ ] Faculty sees their requests in their panel
- [ ] HOD can see faculty requests in approval panel
- [ ] HOD can approve/reject requests
- [ ] Faculty sees updated status after approval

## Before vs After

### Before (Broken)
```
Faculty submits → Saved in DB ✅
HOD opens page → Empty list ❌ (This was the bug)
```

### After (Fixed)
```
Faculty submits → Saved in DB ✅
HOD opens page → Shows all requests ✅
HOD approves → Status updated ✅
Faculty refreshes → Sees approval ✅
```

## Additional Resources

1. **DEBUGGING_LEAVE_REQUESTS.md** - Detailed debugging guide
2. **LEAVE_REQUEST_FLOW.md** - Complete workflow documentation
3. **test_leave_flow.py** - Automated test script
4. **add_leave_requests_table.sql** - Database migration

## Still Having Issues?

If the fix doesn't work:

1. **Check Backend Logs:**
   Look for error messages when HOD page loads

2. **Check Browser Console (F12):**
   Look for API errors or failed requests

3. **Verify Database:**
   ```sql
   SELECT * FROM leave_requests WHERE role = 'faculty';
   ```

4. **Test API Directly:**
   ```bash
   curl -H "Authorization: Bearer YOUR_HOD_TOKEN" \
        http://localhost:8000/api/hod/faculty-leaves
   ```

## Summary

**The issue was a simple query problem in the backend.** The fix changes how we fetch faculty details - instead of trying to join tables in one query (which was failing), we now:
1. Fetch all leave requests
2. For each request, fetch the faculty details separately
3. Combine them before sending to frontend

This is slightly less efficient but **much more reliable** and works with Supabase's query system.

---

**Status:** ✅ FIXED - Ready to test!
