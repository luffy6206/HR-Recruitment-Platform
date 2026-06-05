# HR Assignment Feature - UI Testing Guide

## Quick Start

### Prerequisites
- Backend running: `npm run dev` (port 5000) ✅
- Database connected: MongoDB ✅
- Seed users available: admin@company.com / Admin@123 ✅

### Start Frontend Dev Server

```bash
cd e:\customsoft_new02\HR-Recruitment-Platform\frontend
npm run dev
```

This will start at: `http://localhost:5173` (or next available port)

---

## Manual Test Scenarios

### Test 1: Basic Upload Flow

**Objective**: Verify upload dialog has category and HR fields

**Steps**:
1. Open http://localhost:5173 in browser
2. Login with: admin@company.com / Admin@123
3. Navigate to **Candidates** page
4. Click **"Upload Resumes"** button
5. **Verify**: 
   - ✅ Category dropdown visible with 9 options:
     - MERN Developer
     - Full Stack
     - Frontend Developer
     - Backend Developer
     - Java Developer
     - Python Developer
     - DevOps Engineer
     - Data Engineer
     - QA Engineer
   - ✅ HR dropdown visible and populated with HR users
   - ✅ Both fields marked as required

---

### Test 2: Field Validation - Missing Category

**Objective**: Verify upload rejects when category not selected

**Steps**:
1. Open upload dialog
2. Select a file (any PDF or document)
3. **Do NOT select** Category
4. Select an HR user from dropdown
5. Click **"Upload"** button
6. **Verify**:
   - ✅ Error message displayed: "Category is required" or similar
   - ✅ Upload prevented
   - ✅ Dialog remains open for correction

---

### Test 3: Field Validation - Missing HR

**Objective**: Verify upload rejects when HR not selected

**Steps**:
1. Open upload dialog
2. Select a file
3. Select a Category
4. **Do NOT select** any HR user
5. Click **"Upload"** button
6. **Verify**:
   - ✅ Error message displayed: "Assigned HR is required" or similar
   - ✅ Upload prevented
   - ✅ Dialog remains open for correction

---

### Test 4: Successful Upload with HR Assignment

**Objective**: Verify candidate created with HR assignment

**Steps**:
1. Prepare a test resume file (PDF or DOC)
2. Open upload dialog
3. Select file
4. Select **Category**: "MERN Developer"
5. Select **HR**: "HR Manager" (or first HR in list)
6. Click **"Upload"** button
7. Wait for success message
8. **Verify**:
   - ✅ New candidate appears in list
   - ✅ "Assigned HR" column shows: "HR Manager"
   - ✅ Candidate status is "NEW"
   - ✅ Category shows "MERN Developer"

---

### Test 5: Duplicate Detection Still Works

**Objective**: Verify duplicates with HR assignment are still detected

**Steps**:
1. From Test 4, note the uploaded candidate's email
2. Prepare the same resume file again
3. Open upload dialog
4. Select file + Category + **Different HR** user
5. Click **"Upload"** button
6. **Verify**:
   - ✅ Duplicate detected message appears
   - ✅ New candidate NOT created
   - ✅ Existing candidate NOT modified with new HR

---

### Test 6: HR User Visibility - Admin View

**Objective**: Verify admin sees all candidates

**Steps**:
1. Logged in as admin@company.com
2. View **Candidates** page
3. **Verify**:
   - ✅ Can see all candidates in list
   - ✅ "Assigned HR" column shows HR names where assigned
   - ✅ Some candidates may show "Unassigned"
   - ✅ Can see 10+ candidates

---

### Test 7: HR User Visibility - HR Role View

**Objective**: Verify HR user sees only assigned candidates

**Steps**:
1. Logout from admin account
2. Login with: hr@company.com / Hr@123
3. Navigate to **Candidates** page
4. **Verify**:
   - ✅ Significantly fewer candidates visible (only assigned to this HR)
   - ✅ Each visible candidate has this HR's name in "Assigned HR" column
   - ✅ Unassigned candidates not visible
   - ✅ Candidates assigned to other HRs not visible

---

### Test 8: Table Display Verification

**Objective**: Verify "Assigned HR" column displays correctly

**Steps**:
1. On Candidates page
2. Look at table columns from left to right
3. **Verify column order**:
   - ✅ Name
   - ✅ Email
   - ✅ Phone
   - ✅ Category
   - ✅ **Assigned HR** (NEW COLUMN)
   - ✅ Status
   - ✅ Actions (View/Edit/Delete)

---

### Test 9: Multiple HR Users

**Objective**: Verify HR dropdown shows multiple users

**Steps**:
1. Open upload dialog
2. Click on HR dropdown
3. **Verify**:
   - ✅ Shows at least 2 HR users
   - ✅ Each HR shows name and email
   - ✅ Can select any HR
   - ✅ Selection persists in field

---

### Test 10: Concurrent Uploads

**Objective**: Verify multiple files can be uploaded together

**Steps**:
1. Open upload dialog
2. Select **multiple files** at once (2-3 resumes)
3. Select Category
4. Select HR
5. Click **"Upload"** button
6. **Verify**:
   - ✅ All files processed
   - ✅ Multiple candidates created (or duplicates detected)
   - ✅ All assigned to same HR
   - ✅ All have same category
   - ✅ Progress indicator shows for each file

---

## Common Issues & Solutions

### Issue: HR dropdown empty
**Solution**: 
- Verify HR users exist: `GET /api/users/role/hr` returns data
- Check database has users with role: "HR"
- Backend may need restart

### Issue: Upload button disabled
**Solution**:
- Ensure file selected
- Ensure both Category and HR selected
- Check browser console for JavaScript errors

### Issue: "Assigned HR" column not showing
**Solution**:
- Refresh page
- Clear browser cache
- Rebuild frontend: `npm run build`

### Issue: HR login shows all candidates
**Solution**:
- HR user may have admin privileges
- Check user role in database
- Verify token has correct role

---

## Validation Checklist

After testing all scenarios, confirm:

```
Test Scenarios:
[ ] Test 1: Dialog fields visible and populated
[ ] Test 2: Category validation working
[ ] Test 3: HR assignment validation working
[ ] Test 4: Successful upload with assignment
[ ] Test 5: Duplicate detection preserved
[ ] Test 6: Admin sees all candidates
[ ] Test 7: HR sees only assigned candidates
[ ] Test 8: Table column displays correctly
[ ] Test 9: Multiple HRs in dropdown
[ ] Test 10: Multiple file upload works

Field Validation:
[ ] Category dropdown has 9 options
[ ] HR dropdown populated from API
[ ] Both fields required
[ ] Error messages clear
[ ] Form validation prevents invalid submissions

Data Display:
[ ] "Assigned HR" column appears
[ ] HR names display correctly
[ ] "Unassigned" shows when null
[ ] Data aligns with role
[ ] Page responsive on mobile

Integration:
[ ] No console errors
[ ] API calls succeed
[ ] Database updated correctly
[ ] Timeline events created
[ ] Backward compatibility maintained
```

---

## Performance Notes

- HR users endpoint: ~50-100ms (cached query with index)
- Candidate list: ~200-500ms (depends on count, uses index)
- Upload processing: ~2-5s per file (resume parsing + AI analysis)
- Frontend render: <100ms for new candidate row

---

## Post-Deployment Verification

1. ✅ Run backend tests: `node test-final-validation.mjs`
2. ✅ Test frontend manual scenarios above
3. ✅ Run production database backup
4. ✅ Monitor API logs for errors
5. ✅ Verify all users can access features
6. ✅ Check duplicate detection still working
7. ✅ Confirm timeline events in database

---

## Success Criteria

Feature is **COMPLETE** when:
- ✅ All 10 test scenarios pass
- ✅ Upload creates candidate with HR assignment
- ✅ Role-based visibility working
- ✅ Category field mandatory
- ✅ HR field mandatory
- ✅ Duplicate detection preserved
- ✅ No console errors
- ✅ All validations working
- ✅ Table displays correctly
- ✅ Production deployment tested
