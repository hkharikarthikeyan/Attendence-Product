# DEBUGGING GUIDE - Faculty Leave Requests Not Visible on HOD Page

## Problem Identified
The HOD endpoint was using incorrect Supabase join syntax: `faculty:user_id(name, employee_id)` which was failing silently.

## Solution Applied
Changed the query to:
1. Fetch all leave requests with `role = 'faculty'`
2. For each request, fetch faculty details separately
3. Combine the data before returning

---

## How to Verify the Fix

### Step 1: Check Backend Logs
When HOD page loads, you should see in terminal:
```
INFO:     GET /api/hod/faculty-leaves
```

If there's an error, you'll see:
```
Error fetching faculty leaves: [error message]
```

### Step 2: Test in Browser Console

**Open HOD page and press F12, then run:**
```javascript
// Check if API is being called
fetch('http://localhost:8000/api/hod/faculty-leaves', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(r => r.json())
.then(data => console.log('Leave Requests:', data))
.catch(err => console.error('Error:', err));
```

**Expected Output:**
```json
{
  "requests": [
    {
      "id": "...",
      "user_id": "...",
      "role": "faculty",
      "leave_type": "od",
      "from_date": "2024-02-01",
      "to_date": "2024-02-03",
      "reason": "Conference",
      "status": "pending",
      "faculty": {
        "name": "Prof. Jane Doe",
        "employee_id": "FAC001"
      }
    }
  ]
}
```

### Step 3: Check Database Directly

**Run in Supabase SQL Editor:**
```sql
-- Check if leave requests exist
SELECT * FROM leave_requests WHERE role = 'faculty';

-- Check if faculty table has matching user_id
SELECT lr.*, f.name, f.employee_id 
FROM leave_requests lr
LEFT JOIN faculty f ON f.id = lr.user_id
WHERE lr.role = 'faculty';
```

---

## Common Issues & Solutions

### Issue 1: Empty Array Returned
**Symptoms:** `{"requests": []}`

**Check:**
```sql
-- Verify leave requests exist
SELECT COUNT(*) FROM leave_requests WHERE role = 'faculty';
```

**If count is 0:** Faculty hasn't submitted any requests yet
**If count > 0:** Check the backend code is running the updated version

### Issue 2: Faculty Name Shows as "Unknown"
**Symptoms:** Leave request shows but faculty name is "Unknown"

**Check:**
```sql
-- Verify user_id matches faculty table
SELECT lr.user_id, f.id, f.name 
FROM leave_requests lr
LEFT JOIN faculty f ON f.id = lr.user_id
WHERE lr.role = 'faculty';
```

**Solution:** Ensure faculty submitting leave has a record in `faculty` table

### Issue 3: 401 Unauthorized Error
**Symptoms:** API returns 401 error

**Check:**
- HOD is logged in correctly
- Token is valid: `console.log(localStorage.getItem('token'))`
- HOD role is set correctly in database

### Issue 4: CORS Error
**Symptoms:** Browser shows CORS policy error

**Solution:** Ensure backend CORS is configured:
```python
# In app.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Testing Checklist

- [ ] Backend server is running (`python -m uvicorn app.app:app --reload`)
- [ ] Frontend is running (`npm run dev`)
- [ ] `leave_requests` table exists in database
- [ ] Faculty has submitted at least one leave request
- [ ] HOD is logged in with correct credentials
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API call (200 status)

---

## Quick Test Script

**Run this in Supabase SQL Editor to create a test leave request:**
```sql
-- Get a faculty user_id
SELECT id, name FROM faculty LIMIT 1;

-- Insert test leave request (replace USER_ID with actual faculty id)
INSERT INTO leave_requests (user_id, role, leave_type, from_date, to_date, reason, status)
VALUES (
    'YOUR_FACULTY_USER_ID_HERE',
    'faculty',
    'od',
    '2024-02-01',
    '2024-02-03',
    'Test leave request',
    'pending'
);

-- Verify it was created
SELECT * FROM leave_requests WHERE role = 'faculty';
```

---

## Expected Behavior After Fix

1. **Faculty submits leave** → Saved in database ✅
2. **HOD opens Leave Approvals page** → API called automatically ✅
3. **Backend fetches requests** → Joins with faculty table ✅
4. **Frontend displays table** → Shows faculty name, dates, reason ✅
5. **HOD clicks Approve/Reject** → Status updates ✅
6. **Faculty refreshes page** → Sees updated status ✅

---

## If Still Not Working

1. **Restart Backend Server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Start again
   cd backend
   python -m uvicorn app.app:app --reload
   ```

2. **Clear Browser Cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached files
   - Refresh page

3. **Check Backend File Updated:**
   ```bash
   # Verify the change was saved
   grep -A 10 "get_faculty_leaves" backend/app/routes/hod.py
   ```

4. **Enable Debug Mode:**
   Add this to `hod.py` at the top:
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

---

## Contact Points for Further Debugging

If issue persists, check:
1. Backend terminal for error messages
2. Browser console (F12) for JavaScript errors
3. Network tab for failed API calls
4. Supabase logs for database errors
