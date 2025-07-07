# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server at http://localhost:3000
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code linting

## Project Architecture

This is a Next.js 14 testing assistant application with two main modules:

### 1. Testing Chat Interface (`/`)
- **Main Component**: `components/ui/testing-chat-interface.tsx`
- **Purpose**: AI-powered testing assistant for test planning and strategy
- **Structure**: Three-panel layout with test plan sidebar, central chat area, and testing types panel
- **Key Features**: Interactive test plan cards, testing type selection, form submission to OpenAI API

### 2. Test Execution Module (`/test-execution`)
- **Main Component**: `components/test-execution/test-execution-module.tsx`
- **Purpose**: Comprehensive bug reporting and tracking system
- **Backend**: Supabase (PostgreSQL) with file storage
- **Key Features**: Quick bug creation, screenshot paste (Ctrl+V), Excel-like data grid, CSV export, real-time updates

## Database Schema (Supabase)

### Core Tables
- `winners_bug_reports` - Main bug tracking table with severity, priority, status, attachments
- `winners_test_sessions` - Test execution sessions
- `winners_session_bugs` - Junction table linking sessions to bugs
- `winners_attachments` - File attachment metadata

### Storage Bucket
- `winners-test-assets` - Stores screenshots, videos, and other test files (50MB limit)

## Key Technical Details

### State Management
- React hooks with TypeScript for type safety
- Form validation using react-hook-form
- Real-time updates via Supabase subscriptions

### File Upload System
- Automatic clipboard paste detection for screenshots
- Drag & drop support via react-dropzone
- File type validation (images, videos, documents)

### Data Grid
- TanStack Table for Excel-like interface
- Batch operations for multiple bug updates
- Column management and filtering
- CSV export functionality

## Environment Configuration

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - For AI chat functionality

## API Routes

### Test Execution APIs
- `/api/test-execution/bugs` - CRUD operations for bug reports
- `/api/test-execution/bugs/batch` - Batch update operations
- `/api/test-projects` - Test project management
- `/api/test-db` - Database connection testing

### Form Submission
- `/api/submit-test-plan` - Handles test plan form submissions to OpenAI

## Navigation Structure

The app uses a Navbar component with routing between:
- `/` - Main testing chat interface
- `/test-execution` - Bug reporting and tracking module

## Component Architecture

### Testing Module Components
- `test-plan-sidebar.tsx` - Left sidebar with test plan cards
- `main-input-area.tsx` - Central chat interface
- `testing-types-panel.tsx` - Right panel for testing type selection
- `testing-type-checkbox.tsx` - Individual checkbox components

### Test Execution Components
- `test-execution-module.tsx` - Main container component
- `quick-bug-form.tsx` - Bug creation form with file upload
- `bug-data-grid.tsx` - Excel-like data grid interface
- `enhanced-bug-detail-modal.tsx` - Detailed bug view and editing

## Keyboard Shortcuts

### Test Execution Module
- `Ctrl+N` - Create new bug
- `Ctrl+V` - Paste screenshot (in forms)
- `Ctrl+E` - Export to CSV
- `Ctrl+R` - Refresh data
- `Delete` - Delete selected bugs
- `Escape` - Close dialogs/clear selection

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **UI Components**: Custom components with class-variance-authority
- **Icons**: Lucide React
- **Data Grid**: TanStack Table
- **File Upload**: react-dropzone
- **Forms**: react-hook-form
- **AI Integration**: OpenAI API


After you are done with the changes create an readme_<feature> file

Use available MCP tools