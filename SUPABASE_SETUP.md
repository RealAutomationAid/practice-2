# Supabase Infrastructure Setup - Test Execution & Bug Reporting Module

## Overview
This document outlines the Supabase infrastructure setup for the Test Execution and Bug Reporting module in the QA application.

## Database Schema

### Core Tables

#### 1. `winners_bug_reports`
Stores detailed bug reports with comprehensive tracking information.

**Key Fields:**
- `id` (UUID): Primary key
- `title` (TEXT): Bug title
- `description` (TEXT): Detailed description
- `severity` (ENUM): low | medium | high | critical
- `priority` (ENUM): low | medium | high | urgent
- `status` (ENUM): open | in_progress | resolved | closed | duplicate
- `reporter_name`, `reporter_email`: Reporter information
- `environment`, `browser`, `device`, `os`: Environment details
- `steps_to_reproduce` (TEXT[]): Array of reproduction steps
- `expected_result`, `actual_result`: Expected vs actual behavior
- `tags` (TEXT[]): Categorization tags
- `attachments` (JSONB): File attachment references
- Timestamps: `created_at`, `updated_at`, `resolved_at`

#### 2. `winners_test_sessions`
Manages test execution sessions.

**Key Fields:**
- `id` (UUID): Primary key
- `name` (TEXT): Session name
- `description` (TEXT): Session description
- `test_type` (TEXT): Type of testing (functional, performance, etc.)
- `environment` (TEXT): Testing environment
- `started_by` (TEXT): Tester name
- `status` (ENUM): active | completed | paused
- Timestamps: `created_at`, `completed_at`

#### 3. `winners_session_bugs`
Junction table linking test sessions to bug reports.

**Key Fields:**
- `id` (UUID): Primary key
- `session_id` (UUID): Foreign key to test sessions
- `bug_id` (UUID): Foreign key to bug reports
- `created_at` (TIMESTAMP): When bug was added to session

#### 4. `winners_attachments`
Stores metadata for file attachments linked to bug reports.

**Key Fields:**
- `id` (UUID): Primary key
- `bug_id` (UUID): Foreign key to bug reports
- `file_name`, `file_type`, `file_size`: File metadata
- `storage_path` (TEXT): Path in Supabase Storage
- `mime_type` (TEXT): File MIME type
- `uploaded_at` (TIMESTAMP): Upload timestamp

### Storage Bucket

#### `winners-test-assets`
- **Purpose**: Store test-related files (screenshots, videos, logs)
- **Public Access**: Enabled for easy sharing
- **File Size Limit**: 50MB per file
- **Allowed MIME Types**: 
  - Images: jpeg, png, gif, webp
  - Videos: mp4, webm, mov

## Security Configuration

### Row Level Security (RLS)
- **Status**: Enabled on all tables
- **Policies**: Currently set to allow all operations (suitable for internal testing)
- **Storage Policies**: Public read/write access for the test assets bucket

## API Integration

### Supabase Client Configuration
Located in `/lib/supabase.ts`:
- TypeScript-enabled client
- Helper functions for CRUD operations
- File upload/download utilities

### Available API Functions

#### Bug Reports
- `bugReportApi.getAll(filters?)`: Fetch bug reports with optional filtering
- `bugReportApi.getById(id)`: Get single bug report
- `bugReportApi.create(data)`: Create new bug report
- `bugReportApi.update(id, data)`: Update existing bug report
- `bugReportApi.delete(id)`: Delete bug report

#### Test Sessions
- `testSessionApi.getAll(filters?)`: Fetch test sessions
- `testSessionApi.getById(id)`: Get single test session
- `testSessionApi.create(data)`: Create new test session
- `testSessionApi.update(id, data)`: Update test session
- `testSessionApi.getBugs(sessionId)`: Get bugs for a session
- `testSessionApi.addBug(sessionId, bugId)`: Link bug to session

#### Attachments
- `attachmentApi.getByBugId(bugId)`: Get attachments for a bug
- `attachmentApi.create(data)`: Create attachment record
- `uploadFile(bucket, path, file)`: Upload file to storage

## Sample Data

The database includes sample data to demonstrate functionality:

### Test Sessions
1. **QA App Test Session #1** - Functional testing in staging
2. **Performance Testing Session** - Load testing in staging  
3. **Bug Verification Session** - Regression testing in production

### Bug Reports
1. **Login button not responsive on mobile** (High severity, High priority)
2. **Test plan export generates empty file** (Medium severity, Medium priority)
3. **Search functionality returns incorrect results** (Critical severity, Urgent priority)

## TypeScript Types

Comprehensive TypeScript definitions are available in `/lib/supabase-types.ts`:
- Database schema types
- Form data interfaces
- API response types
- Constants for dropdowns and validation

## Testing the Setup

Test the database connection using the API endpoint:
```
GET /api/test-db
```

This endpoint will return:
- Connection status
- Sample bug reports
- Sample test sessions

## Environment Configuration

The Supabase configuration uses:
- **Project URL**: `https://dagnscrjrktrrspyamwu.supabase.co`
- **Anon Key**: Configured in `/lib/supabase.ts`

## Next Steps

1. **Frontend Components**: Create React components for bug reporting and test session management
2. **File Upload UI**: Implement drag-and-drop file upload functionality
3. **Filtering & Search**: Add advanced filtering and search capabilities
4. **Real-time Updates**: Implement real-time notifications for bug status changes
5. **Analytics Dashboard**: Create charts and metrics for test execution tracking

## Security Considerations for Production

When deploying to production:
1. Review and tighten RLS policies
2. Implement user authentication
3. Add role-based access control
4. Configure proper backup strategies
5. Set up monitoring and alerting 