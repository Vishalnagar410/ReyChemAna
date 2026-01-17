# LIMS User Guide for Analysts

Simple guide for processing analysis requests and uploading results.

## Logging In

1. Open web browser
2. Go to: `http://[SERVER_IP]:8000` (ask IT for SERVER_IP)
3. Enter your username and password
4. Click **Sign In**

You'll see the **Analyst Dashboard** with all lab requests.

---

## Viewing Available Requests

### Dashboard Overview

Your dashboard shows ALL requests in the lab, not just yours.

### Filter Buttons

- **All Requests**: Everything
- **Pending**: Requests waiting to be picked up
- **In Progress**: Requests currently being worked on

> Start by clicking **Pending** to see what needs attention.

### Request Table Columns

- **Request #**: Unique ID (e.g., REQ-0042)
- **Chemist**: Who submitted it
- **Compound**: What to analyze
- **Analysis Types**: Which tests to run (HPLC, NMR, etc.)
- **Priority**: How urgent (Low/Medium/High/Urgent)
- **Due Date**: When results are needed
- **Status**: Where it is in the workflow
- **Analyst**: Who's working on it (shows your name when assigned)

---

## Picking Up a Request

### Step 1: Select a Request

1. Click **Pending** filter
2. Review available requests
3. Consider:
   - Priority (Urgent first!)
   - Due date (earliest first)
   - Analysis type (match your expertise/instrument availability)
4. Click on a request row to open details

### Step 2: Assign to Yourself

1. In the request details page, you'll see update options
2. Find **Assign Analyst** dropdown
3. Select your name
4. Click **Update Request**

> Now other analysts know you're working on it!

### Step 3: Update Status to "In Progress"

1. Find **Status** dropdown
2. Change from "Pending" to "In Progress"
3. Click **Update Request**

---

## Working on the Request

### Read Request Details Carefully

- Compound name/ID
- Required analysis types
- Chemist's description and comments
- Priority and due date

### Run Your Analyses

This part is up to you! Follow standard lab protocols.

### Add Analyst Comments (Optional but Recommended)

1. Scroll to **Analyst Comments** text box
2. Add notes like:
   - Instrument used
   - Run conditions
   - Observations (purity %, issues, rerun needed)
   - Anything the chemist should know

Example:
```
HPLC run on Instrument A. Purity: 98.5%. 
Peak at 3.2 min confirmed as product.
```

---

## Uploading Results

### Step 1: Prepare Your Files

Acceptable file types:
- PDF reports
- Excel data files (.xlsx, .xls)
- CSV files
- Image files (.png, .jpg)
- Instrument raw data files

> Keep file names descriptive: `REQ-0042_HPLC_Results.pdf`

### Step 2: Upload Files

1. In the request details page, find **Upload Results** section
2. Click **Choose Files** or **Select Files**
3. Select one or more files from your computer
   - Can upload multiple files at once
   - Max 50MB per file
4. Click **Upload**
5. Wait for confirmation

> Files are automatically organized by request number. You can't lose them!

### Step 3: Verify Upload

After uploading:
- You'll see the file names listed
- Chemist can now download these files

---

## Completing a Request

### When All Work is Done

1. Make sure all result files are uploaded
2. Add any final analyst comments
3. Change **Status** to "Completed"
4. Click **Update Request**

> This notifies the chemist that results are ready!

### The system automatically records:
- Completion timestamp
- Who completed it (you)
- All file uploads

---

## If You Need to Cancel a Request

Sometimes a request can't be completed (sample degraded, instrument down, etc.)

1. Add comment explaining why
2. Change status to "Cancelled"
3. Click **Update Request**
4. Inform the chemist directly

---

## Managing Your Workload

### View Your Active Requests

1. Click **In Progress** filter
2. Look at **Analyst** column for your name
3. Sort by **Due Date** to prioritize

### Best Practices

✅ Pick up **Urgent** requests first  
✅ Update status promptly (don't leave in Pending if you're working on it)  
✅ Upload results as soon as available  
✅ Add comments for clarity  
✅ Complete requests same day when possible  

---

## Common Questions

**Q: Can I see only my requests?**  
A: Not automatically, but you can filter by "In Progress" and look for your name.

**Q: What if I uploaded the wrong file?**  
A: Contact admin to delete it. Then upload the correct file.

**Q: Can I edit a request created by a chemist?**  
A: You can update status, assign yourself, add comments, and upload files. You cannot change the compound name or analysis types.

**Q: I started a request but need to hand it off.**  
A: Change the assigned analyst to the other person's name.

**Q: File upload failed.**  
A: Check file size (must be < 50MB). If still failing, contact IT.

**Q: I accidentally marked a request as Completed.**  
A: Contact admin to reopen it.

**Q: How do I know if a request is urgent?**  
A: Look at the Priority column. Red = Urgent, Orange = High, Blue = Medium, Gray = Low.

---

## Workflow Summary

```
┌────────────────────────────────────────┐
│   ANALYST WORKFLOW                     │
├────────────────────────────────────────┤
│ 1. View Pending requests               │
│ 2. Pick one (priority/due date)        │
│ 3. Assign to yourself                  │
│ 4. Update status: In Progress          │
│ 5. Run analyses                        │
│ 6. Upload result files                 │
│ 7. Add analyst comments                │
│ 8. Update status: Completed            │
└────────────────────────────────────────┘
```

---

## File Upload Checklist

Before marking Completed, verify:

- [ ] All requested analyses done
- [ ] All result files uploaded
- [ ] File names are descriptive
- [ ] Analyst comments added
- [ ] Chemist can understand results

---

## Getting Help

**System issues** (can't upload, error messages):  
Contact: IT Admin

**Scientific questions** (unexpected results):  
Consult: Lab Manager or Senior Analyst

**Request assignment questions**:  
Ask: Your supervisor

---

**Quick Reference Card**

```
┌─────────────────────────────────────┐
│   LIMS - Analyst Quick Guide        │
├─────────────────────────────────────┤
│ Click request → Assign yourself     │
│ Status: In Progress                 │
│ Run analyses                        │
│ Upload files: Choose Files button   │
│ Add comments                        │
│ Status: Completed                   │
└─────────────────────────────────────┘
```
