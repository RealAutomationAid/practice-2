# AI Bug Reporter Documentation

## Overview

The AI Bug Reporter is a comprehensive system integrated into the Test Execution Module that allows users to create structured bug reports through natural language conversation with AI. It automatically extracts bug information from user descriptions and creates formal bug reports in the database.

## Key Features

### 🤖 Natural Language Processing
- Converts casual descriptions like "login broken" into structured bug reports
- Extracts technical details (severity, priority, browser, device, OS)
- Generates detailed steps to reproduce and expected vs actual results

### 📋 Project Context Integration
- Uses test project data to provide better context for bug reports
- Automatically links bug reports to selected test projects
- Incorporates SUT analysis, test plans, and requirements into bug generation

### 📎 File Upload Support
- Drag & drop file upload for images and videos
- Clipboard paste support (Ctrl+V) for screenshots
- Automatic file type validation and size limits
- Preview functionality for attachments

### 🔄 Intelligent Fallback System
- OpenAI-powered extraction with keyword-based fallback
- Ensures bug reports are created even when AI is unavailable
- Robust error handling with user feedback

## System Architecture

### Components

#### 1. API Route: `/app/api/test-execution/ai-bug-chat/route.ts`
- **Purpose**: Handles AI chat interactions and bug report creation
- **Key Functions**:
  - `extractBugDataWithAI()`: Uses OpenAI GPT-4o to extract structured data
  - `extractBugDataFallback()`: Keyword-based extraction when AI fails
  - `createBugReport()`: Inserts bug data into Supabase database

#### 2. Frontend Component: `/components/test-execution/ai-bug-chat.tsx`
- **Purpose**: Chat interface for user interactions
- **Key Features**:
  - Real-time messaging with AI
  - File upload and paste support
  - Project selection and context display
  - Template suggestions for common bugs

#### 3. Database Integration
- **Tables Used**:
  - `winners_bug_reports`: Main bug storage
  - `winners_attachments`: File attachment metadata
  - `winners_test_projects`: Project context data
- **Storage**: `winners-test-assets` bucket for file uploads

## Technical Implementation

### OpenAI Integration

```typescript
// Model Configuration
model: 'gpt-4o'
temperature: 0.3
max_tokens: 1000

// System Prompt Structure
const SYSTEM_PROMPT = `You are an AI assistant that helps create bug reports...`
```

### Data Flow

1. **User Input**: User types bug description or uploads files
2. **AI Processing**: OpenAI extracts structured data from description
3. **Fallback Logic**: If AI fails, keyword-based extraction takes over
4. **Database Creation**: Bug report inserted into Supabase with attachments
5. **User Feedback**: Confirmation message and bug ID returned

### Error Handling

- **3-tier fallback system**:
  1. Primary: OpenAI GPT-4o extraction
  2. Secondary: Keyword-based extraction
  3. Tertiary: Direct database insertion with minimal structure

- **Retry Logic**: Exponential backoff for rate limits and server errors
- **User Feedback**: Clear error messages with alternative actions

## Usage Examples

### Minimal Input Examples
- **Input**: "login broken"
- **Output**: Structured bug report with title "Login functionality issue", severity assessment, and detailed description

### Detailed Input Examples
- **Input**: "When I click the save button in Chrome on Windows, the page crashes"
- **Output**: Comprehensive bug report with browser, OS, steps to reproduce, and severity classification

### With Project Context
- **Input**: "Form validation not working" (with test project selected)
- **Output**: Bug report enhanced with project requirements, test plan context, and relevant tags

## Configuration

### Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### File Upload Limits
- **Images**: 5MB maximum
- **Videos**: 50MB maximum
- **Supported formats**: image/*, video/*

## Database Schema

### Bug Reports Table (`winners_bug_reports`)
```sql
CREATE TABLE winners_bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'duplicate')),
  reporter_name TEXT,
  reporter_email TEXT,
  assigned_to TEXT,
  environment TEXT,
  browser TEXT,
  device TEXT,
  os TEXT,
  url TEXT,
  steps_to_reproduce TEXT[],
  expected_result TEXT,
  actual_result TEXT,
  tags TEXT[],
  test_project_id UUID REFERENCES winners_test_projects(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Attachments Table (`winners_attachments`)
```sql
CREATE TABLE winners_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID REFERENCES winners_bug_reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### POST `/api/test-execution/ai-bug-chat`

**Request Body:**
```json
{
  "message": "Bug description text",
  "conversationHistory": [
    {
      "id": "msg_1",
      "type": "user",
      "content": "Previous message",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "attachments": [
    {
      "name": "screenshot.png",
      "type": "image/png",
      "size": 1024000,
      "data": "data:image/png;base64,..."
    }
  ],
  "test_project_id": "uuid-of-test-project"
}
```

**Response:**
```json
{
  "response": "AI-generated response message",
  "bugCreated": true,
  "bugId": "uuid-of-created-bug"
}
```

## Quality of Life Features

### Quick Templates
- Pre-built templates for common bug scenarios
- One-click insertion of typical bug descriptions
- Shown on first interaction to guide users

### Smart Fallback
- Graceful degradation when AI is unavailable
- Automatic keyword extraction and intelligent categorization
- Ensures no user input is lost

### Real-time Feedback
- Loading indicators during AI processing
- Success/error toast notifications
- Visual confirmation of bug creation

## Troubleshooting

### Common Issues

1. **OpenAI API Key Issues**
   - Check `.env.local` file for correct API key
   - Verify API key has sufficient credits
   - Ensure proper file permissions

2. **Database Connection Problems**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Confirm table schema matches expectations

3. **File Upload Failures**
   - Check file size limits (5MB images, 50MB videos)
   - Verify Supabase storage bucket permissions
   - Confirm file type support

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## Performance Considerations

- **Conversation History**: Limited to last 5 messages to control token usage
- **Message Length**: Truncated to 2000 characters for AI processing
- **Retry Logic**: Exponential backoff prevents API rate limiting
- **File Processing**: Asynchronous upload with progress feedback

## Security

- **Input Validation**: All user inputs are sanitized and validated
- **File Type Checking**: Strict file type validation for uploads
- **API Key Protection**: Server-side API key management
- **SQL Injection Prevention**: Parameterized queries via Supabase client

## Future Enhancements

1. **Batch Bug Creation**: Process multiple bug descriptions at once
2. **Bug Classification**: Automatic categorization based on project type
3. **Integration Testing**: Automated testing of bug report generation
4. **Analytics**: Usage metrics and AI performance tracking
5. **Template Customization**: User-defined bug report templates

## Conclusion

The AI Bug Reporter transforms the traditional bug reporting process by enabling users to create comprehensive, structured bug reports through natural language descriptions. With robust fallback mechanisms, intelligent context integration, and seamless file upload support, it ensures that every bug report is captured accurately and efficiently.

The system's flexibility allows it to work with minimal input while providing comprehensive output, making it an invaluable tool for quality assurance teams and developers alike.