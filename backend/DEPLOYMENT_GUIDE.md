# Team Leader Module - DEPLOYMENT GUIDE

## 📋 Pre-Deployment Verification

✅ **Code Quality**
- All 15 service/utility/route files verified - NO TypeScript errors
- All imports resolved
- All routes registered in `src/routes/index.ts`
- Schema updated in `prisma/schema.prisma`

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Generate Prisma Client
This creates TypeScript types from the Prisma schema.

```bash
cd backend
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (v5.15.0) to ./node_modules/@prisma/client in 150ms
```

---

### Step 2: Run Database Migration
This creates all new tables and columns in your database.

```bash
npx prisma migrate dev --name add_team_leader_module
```

**Expected Output:**
```
✔ Your database is now in sync with your schema.

✔ Generated Prisma Client (v5.15.0) to ./node_modules/@prisma/client in 120ms

Created migration folder prisma/migrations/[timestamp]_add_team_leader_module
```

**What This Does:**
- Creates 9 new tables: GPSTracking, Leaderboard, Performance, Efficiency, ScopeAction, UpcomingDeadline, PasswordReset, TeamStrength, DailyTracking
- Adds new fields to existing tables (Employee, Task, TaskWorkUpdate, TeamLead)
- Creates indexes for performance
- All changes are reversible with `prisma migrate resolve`

---

### Step 3: Build TypeScript
Compiles all TypeScript files to JavaScript in the `dist/` folder.

```bash
npm run build
```

**Expected Output:**
```
✔ Generated Prisma Client (v5.15.0)
```
(No TypeScript errors should appear)

---

### Step 4: Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
[18:30:45] Starting ts-node-dev...
[18:30:48] Listening on port 5000
```

---

## 🧪 API TESTING

### Test Health Check
Verify the server is running:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "development"
}
```

---

### Test 1: Employee Check-in with GPS

```bash
curl -X POST http://localhost:5000/api/teamlead/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "accuracy": 25,
    "address": "Office Building A"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "id": 1,
    "employeeId": 5,
    "checkInTime": "2026-07-03T18:30:45.000Z",
    "checkInLatitude": 28.6139,
    "checkInLongitude": 77.2090,
    "status": "PRESENT",
    "mapsUrl": "https://maps.google.com/?q=28.6139,77.2090"
  }
}
```

---

### Test 2: Check-out (with 200m radius validation)

```bash
curl -X POST http://localhost:5000/api/teamlead/attendance/check-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "latitude": 28.6140,
    "longitude": 77.2091,
    "accuracy": 20
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Check-out successful",
  "data": {
    "id": 1,
    "checkOutTime": "2026-07-03T18:45:30.000Z",
    "checkOutLatitude": 28.6140,
    "checkOutLongitude": 77.2091,
    "workingHours": 0.25,
    "distanceTravelledMeters": 12.5,
    "mapsUrl": "https://maps.google.com/?q=28.6140,77.2091"
  }
}
```

**Error if beyond 200m:**
```json
{
  "success": false,
  "message": "Check-out location is 250.5 meters from check-in location. Maximum allowed radius is 200 meters."
}
```

---

### Test 3: Assign Task

```bash
curl -X POST http://localhost:5000/api/teamlead/tasks/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "taskId": 1,
    "employeeId": 5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Task assigned successfully",
  "data": {
    "id": 1,
    "title": "Complete Document Review",
    "assignedEmployeeId": 5,
    "status": "PENDING",
    "dueDate": "2026-07-10T00:00:00.000Z"
  }
}
```

---

### Test 4: Get Employee Workload

```bash
curl http://localhost:5000/api/teamlead/tasks/workload?employeeId=5 \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "employeeId": 5,
    "total": 8,
    "pending": 3,
    "inProgress": 2,
    "completed": 2,
    "onHold": 1,
    "overdue": 0
  }
}
```

---

### Test 5: Get Leaderboard

```bash
curl "http://localhost:5000/api/teamlead/metrics/leaderboard?month=2026-07&limit=10" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "employeeId": 3,
      "employeeName": "Rahul Kumar",
      "score": 95.5,
      "tasksCompleted": 8,
      "workHours": 45.5,
      "completionRate": 87.5
    },
    {
      "rank": 2,
      "employeeId": 5,
      "employeeName": "Priya Singh",
      "score": 88.2,
      "tasksCompleted": 6,
      "workHours": 42.0,
      "completionRate": 85.0
    }
  ]
}
```

---

### Test 6: Get GPS Location History

```bash
curl "http://localhost:5000/api/teamlead/gps/history?page=1&limit=20" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "locations": [
      {
        "id": 1,
        "employeeId": 5,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "accuracy": 25,
        "address": "Office Building A",
        "eventType": "CHECK_IN",
        "createdAt": "2026-07-03T18:30:45.000Z",
        "mapsUrl": "https://maps.google.com/?q=28.6139,77.2090"
      }
    ]
  }
}
```

---

### Test 7: Get Attendance Summary

```bash
curl "http://localhost:5000/api/teamlead/attendance/summary?period=MONTH" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "month": "July 2026",
    "totalDays": 22,
    "presentDays": 20,
    "absentDays": 2,
    "lateDays": 1,
    "halfDays": 0,
    "totalWorkHours": 165.5
  }
}
```

---

### Test 8: Create Employee (Onboarding)

```bash
curl -X POST http://localhost:5000/api/onboarding/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>" \
  -d '{
    "firstName": "Amit",
    "lastName": "Patel",
    "email": "amit.patel@company.com",
    "phone": "+919876543210",
    "department": "Operations",
    "designation": "Associate",
    "joiningDate": "2026-07-01",
    "dateOfBirth": "1995-03-15",
    "employeeCode": "EMP-2026-001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Employee onboarded successfully",
  "data": {
    "employee": {
      "id": 15,
      "firstName": "Amit",
      "lastName": "Patel",
      "email": "amit.patel@company.com",
      "dateOfBirth": "1995-03-15",
      "onboardingStatus": "PENDING_LOGIN"
    },
    "user": {
      "email": "amit.patel@company.com"
    },
    "credentials": {
      "tempPassword": "150395@Temp",
      "passwordExpiresDays": 30,
      "mustChangeOnLogin": true,
      "warning": "Password generated from DOB. Employee must change password on first login."
    }
  }
}
```

---

### Test 9: Change Password

```bash
curl -X POST http://localhost:5000/api/password/change \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "oldPassword": "150395@Temp",
    "newPassword": "SecureNew@2026"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Test 10: Get Upcoming Deadlines

```bash
curl "http://localhost:5000/api/teamlead/deadlines/upcoming?daysRange=7" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "taskId": 5,
      "taskTitle": "Complete Report",
      "clientName": "ABC Corp",
      "dueDate": "2026-07-05T17:00:00.000Z",
      "daysRemaining": 2,
      "urgency": "HIGH",
      "assignedTo": "Priya Singh"
    },
    {
      "id": 2,
      "taskId": 8,
      "taskTitle": "Send Invoice",
      "clientName": "XYZ Ltd",
      "dueDate": "2026-07-10T17:00:00.000Z",
      "daysRemaining": 7,
      "urgency": "MEDIUM",
      "assignedTo": "Rahul Kumar"
    }
  ]
}
```

---

## 🔐 Getting JWT Token for Testing

To test authenticated endpoints, you need a JWT token. Use the login endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response will include:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "TEAM_LEAD"
    }
  }
}
```

Use this `token` in the `Authorization: Bearer <token>` header for subsequent requests.

---

## ⚙️ Environment Configuration

Update your `.env` file with (if deploying to production):

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/compliance_db

# JWT
JWT_SECRET=your-very-secret-key-here

# Optional: Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Node Environment
NODE_ENV=production
```

---

## 🔄 Cron Job Setup (Deadline Notifications)

The system includes a cron endpoint to send deadline notifications. Set this to run periodically (recommended every 6 hours or daily):

```bash
curl -X POST http://localhost:5000/api/teamlead/deadlines/send-notifications
```

**Setup Options:**

### Option 1: Node-Cron Package
```bash
npm install node-cron
```

Add to `src/server.ts`:
```typescript
import cron from 'node-cron';

// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running deadline notification scheduler...');
  try {
    await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/teamlead/deadlines/send-notifications`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Cron job failed:', error);
  }
});
```

### Option 2: External Scheduler (e.g., GitHub Actions, AWS Lambda, Heroku Scheduler)
Create a scheduled task that calls:
```
POST http://your-app.com/api/teamlead/deadlines/send-notifications
```

### Option 3: System Cron (Linux/Mac)
```bash
0 9 * * * curl -X POST http://localhost:5000/api/teamlead/deadlines/send-notifications
```

---

## 📊 Database Verification

After migration, verify new tables were created:

```bash
npx prisma studio
```

This opens a visual database browser at `http://localhost:5555` where you can view:
- ✅ GPSTracking table
- ✅ Leaderboard table
- ✅ Performance table
- ✅ Efficiency table
- ✅ ScopeAction table
- ✅ UpcomingDeadline table
- ✅ PasswordReset table
- ✅ TeamStrength table
- ✅ DailyTracking table

---

## 🐛 Troubleshooting

### Issue: "The column 'X' does not exist"
**Solution**: Ensure Prisma migration was run:
```bash
npx prisma migrate dev
```

### Issue: "Cannot find module '@prisma/client'"
**Solution**: Generate Prisma client:
```bash
npx prisma generate
```

### Issue: TypeScript compilation errors
**Solution**: Verify all files are saved and rebuild:
```bash
npm run build
```

### Issue: 200m radius validation not working
**Check**: Ensure GPS coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)

### Issue: Password generation not working
**Check**: Ensure `dateOfBirth` is provided in ISO format (YYYY-MM-DD)

---

## 📈 Performance Tips

### For Large GPS Datasets
Clean up old GPS records periodically:
```typescript
// Call weekly
await gpsService.cleanupOldGPSRecords(90); // Keep last 90 days
```

### For Leaderboard Calculation
Schedule off-peak hours:
```bash
# Run at 2 AM daily
0 2 * * * curl -X POST http://localhost:5000/api/teamlead/metrics/leaderboard/calculate
```

### Database Indexes
Verify indexes exist:
```sql
-- Check GPS index
SELECT * FROM pg_indexes WHERE tablename = 'gps_tracking';

-- Check Employee index
SELECT * FROM pg_indexes WHERE tablename = 'employee';
```

---

## 📝 Verification Checklist

- [ ] Prisma migration completed successfully
- [ ] All 9 new tables created in database
- [ ] TypeScript builds without errors
- [ ] Development server starts on port 5000
- [ ] Health check endpoint responds
- [ ] Authentication endpoint works
- [ ] At least 3 endpoints tested successfully
- [ ] Cron job configured for deadline notifications
- [ ] Environment variables configured
- [ ] Database backups configured

---

## 🎯 Next Steps After Deployment

1. **Run integration tests** - Test all 31 endpoints
2. **Load testing** - Simulate multiple users
3. **Security audit** - Review authentication and authorization
4. **Performance profiling** - Check query performance
5. **Backup strategy** - Setup database backups
6. **Monitoring** - Setup error tracking and logging
7. **Documentation** - Share API docs with frontend team
8. **Training** - Train team on new features

---

## 📞 Support Resources

- **API Documentation**: See `TEAM_LEADER_MODULE_IMPLEMENTATION.md`
- **Quick Reference**: See `TEAMLEAD_QUICK_START.md`
- **Database Schema**: `prisma/schema.prisma`
- **Service Code**: `src/modules/*/`
- **Routes Code**: `src/routes/teamlead.routes.ts` and `src/routes/onboarding.routes.ts`

---

## ✅ DEPLOYMENT COMPLETE

Once all steps above are completed, your Team Leader Module is live and ready for:
- Employee onboarding
- GPS tracking and attendance
- Task assignment and management
- Performance metrics and leaderboards
- Deadline tracking and notifications
- Scope-based permissions
- Password management

**Happy Deploying! 🚀**
