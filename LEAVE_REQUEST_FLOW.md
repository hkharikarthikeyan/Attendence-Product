# Faculty Leave Request System - Complete Flow

## Overview
This document explains how the faculty leave request system works, from submission to HOD approval and status update.

---

## System Architecture

### Database Table: `leave_requests`
```sql
- id: UUID (Primary Key)
- user_id: UUID (References users table)
- role: TEXT ('faculty' or 'student')
- leave_type: TEXT ('od', 'medical', 'personal', 'permission')
- from_date: DATE
- to_date: DATE
- reason: TEXT
- status: TEXT ('pending', 'approved', 'rejected')
- rejection_reason: TEXT (optional)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

---

## Complete Workflow

### Step 1: Faculty Submits Leave Request

**Frontend:** `LeaveRequest.jsx` (Faculty Dashboard)
- Faculty fills out the leave form with:
  - Name (auto-filled from profile)
  - Leave Type (OD, Medical, Personal, Permission)
  - From Date
  - To Date
  - Reason

**API Call:**
```javascript
POST /api/faculty/my-leaves
Body: {
  leave_type: "od",
  from_date: "2024-02-01",
  to_date: "2024-02-03",
  reason: "Conference attendance"
}
```

**Backend:** `faculty.py` (Line 656-673)
```python
@router.post("/my-leaves")
async def request_leave(leave: LeaveRequestCreate, current_user: CurrentUser):
    data = {
        "user_id": current_user.id,
        "role": "faculty",
        "leave_type": leave.leave_type,
        "from_date": leave.from_date.isoformat(),
        "to_date": leave.to_date.isoformat(),
        "reason": leave.reason,
        "status": "pending"
    }
    result = supabase.table("leave_requests").insert(data).execute()
    return {"message": "Leave request submitted successfully"}
```

**Result:** Leave request is saved in database with status = "pending"

---

### Step 2: HOD Views Pending Requests

**Frontend:** `LeaveApproval.jsx` (HOD Dashboard)
- HOD navigates to "Leave Approvals" page
- System automatically loads all pending faculty leave requests
- Auto-refreshes every 5 seconds to show new requests

**API Call:**
```javascript
GET /api/hod/faculty-leaves
```

**Backend:** `hod.py` (Line 398-405)
```python
@router.get("/faculty-leaves")
async def get_faculty_leaves(current_user: CurrentUser):
    result = supabase.table("leave_requests").select(
        "*, faculty:user_id(name, employee_id)"
    ).eq("role", "faculty").order("created_at", desc=True).execute()
    return {"requests": result.data}
```

**Display:** HOD sees a table with:
- Faculty Name
- Leave Type
- From Date
- To Date
- Reason
- Status (pending/approved/rejected)
- Action buttons (Approve/Reject) for pending requests

---

### Step 3: HOD Approves or Rejects

**Frontend:** `LeaveApproval.jsx`
- HOD clicks "Approve" ✓ or "Reject" ✗ button
- Only visible for requests with status = "pending"

**API Call:**
```javascript
PUT /api/hod/faculty-leaves/{request_id}
Body: {
  status: "approved"  // or "rejected"
}
```

**Backend:** `hod.py` (Line 407-423)
```python
@router.put("/faculty-leaves/{request_id}")
async def update_faculty_leave(request_id: str, status_update: dict, current_user: CurrentUser):
    result = supabase.table("leave_requests").update({
        "status": status_update.get("status"),
        "updated_at": datetime.now().isoformat()
    }).eq("id", request_id).execute()
    return {"message": f"Leave request {status_update.get('status')}"}
```

**Result:** 
- Database record updated with new status
- `updated_at` timestamp updated
- Success message shown to HOD

---

### Step 4: Faculty Views Updated Status

**Frontend:** `LeaveRequest.jsx`
- Faculty can view their leave history
- Status badge shows color-coded status:
  - 🟡 Yellow = Pending
  - 🟢 Green = Approved
  - 🔴 Red = Rejected

**API Call:**
```javascript
GET /api/faculty/my-leaves
```

**Backend:** `faculty.py` (Line 676-682)
```python
@router.get("/my-leaves")
async def get_my_leaves(current_user: CurrentUser):
    result = supabase.table("leave_requests").select("*")
        .eq("user_id", current_user.id)
        .order("created_at", desc=True).execute()
    return {"requests": result.data}
```

---

## Setup Instructions

### 1. Create Database Table
Run the SQL migration file:
```bash
# Execute in Supabase SQL Editor
add_leave_requests_table.sql
```

Or if setting up fresh database:
```bash
# Execute the complete schema
database_schema.sql
```

### 2. Verify Backend Routes
Ensure these routes are registered in `app.py`:
```python
from app.routes import faculty, hod

app.include_router(faculty.router)
app.include_router(hod.router)
```

### 3. Test the Flow

**Test as Faculty:**
1. Login as faculty user
2. Navigate to "Leave Request" page
3. Click "Apply Leave" button
4. Fill form and submit
5. Verify request appears in table with "pending" status

**Test as HOD:**
1. Login as HOD user
2. Navigate to "Leave Approvals" page
3. Verify faculty request appears
4. Click "Approve" or "Reject"
5. Verify status updates

**Verify Faculty Update:**
1. Switch back to faculty account
2. Refresh "Leave Request" page
3. Verify status changed to "approved" or "rejected"

---

## API Endpoints Summary

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/faculty/my-leaves` | Faculty | Submit new leave request |
| GET | `/api/faculty/my-leaves` | Faculty | View own leave history |
| GET | `/api/hod/faculty-leaves` | HOD | View all faculty leave requests |
| PUT | `/api/hod/faculty-leaves/{id}` | HOD | Approve/reject leave request |

---

## Data Flow Diagram

```
┌─────────────┐
│   Faculty   │
│  Dashboard  │
└──────┬──────┘
       │ 1. Submit Leave Request
       │ POST /api/faculty/my-leaves
       ▼
┌─────────────────────┐
│  leave_requests     │
│  Table (Database)   │
│  status: "pending"  │
└──────┬──────────────┘
       │ 2. HOD Queries
       │ GET /api/hod/faculty-leaves
       ▼
┌─────────────┐
│     HOD     │
│  Dashboard  │
└──────┬──────┘
       │ 3. Approve/Reject
       │ PUT /api/hod/faculty-leaves/{id}
       ▼
┌─────────────────────┐
│  leave_requests     │
│  Table (Database)   │
│  status: "approved" │
└──────┬──────────────┘
       │ 4. Faculty Checks Status
       │ GET /api/faculty/my-leaves
       ▼
┌─────────────┐
│   Faculty   │
│  Dashboard  │
│ (Updated)   │
└─────────────┘
```

---

## Troubleshooting

### Issue: "Table 'leave_requests' does not exist"
**Solution:** Run `add_leave_requests_table.sql` in Supabase SQL Editor

### Issue: Leave requests not showing on HOD panel
**Solution:** 
1. Check if requests have `role = 'faculty'`
2. Verify HOD authentication token is valid
3. Check browser console for API errors

### Issue: Status not updating after approval
**Solution:**
1. Verify PUT request is successful (check Network tab)
2. Ensure faculty refreshes the page or auto-refresh is working
3. Check database directly to confirm status changed

---

## Future Enhancements

1. **Email Notifications:** Send email to faculty when status changes
2. **Rejection Reason:** Add field for HOD to provide rejection reason
3. **Leave Balance:** Track remaining leave days per faculty
4. **Calendar View:** Visual calendar showing approved leaves
5. **Bulk Actions:** Approve/reject multiple requests at once
6. **Leave History Report:** Generate PDF reports of leave history

---

## Files Modified/Created

1. ✅ `add_leave_requests_table.sql` - New migration file
2. ✅ `database_schema.sql` - Updated with leave_requests table
3. ✅ `backend/app/routes/faculty.py` - Already has leave endpoints
4. ✅ `backend/app/routes/hod.py` - Already has leave approval endpoints
5. ✅ `frontend/src/pages/faculty/LeaveRequest.jsx` - Already implemented
6. ✅ `frontend/src/pages/hod/LeaveApproval.jsx` - Already implemented
7. ✅ `frontend/src/services/api.js` - Already has API methods

---

## Conclusion

Your leave request system is **fully implemented in code** but was missing the database table. After running the SQL migration file (`add_leave_requests_table.sql`), the complete flow will work:

1. Faculty submits leave → Saved as "pending"
2. HOD views on approval panel → Sees all pending requests
3. HOD approves/rejects → Status updated in database
4. Faculty sees updated status → Reflects approval/rejection

**Next Step:** Execute `add_leave_requests_table.sql` in your Supabase SQL Editor to enable the feature.
