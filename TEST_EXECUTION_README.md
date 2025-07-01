# Test Execution Module

A comprehensive bug reporting and tracking system built with Next.js 14, TypeScript, and Supabase.

## 🚀 Features

### Core Features
- **Quick Bug Creation**: Streamlined form with essential fields
- **Ctrl+V Screenshot Support**: Automatic clipboard paste detection and upload
- **File Upload System**: Drag & drop support for images, videos, and documents
- **Sheet-like Interface**: Excel/Google Sheets-style data grid for easy navigation
- **CSV Export**: One-click export functionality for all bug reports
- **Real-time Updates**: Live synchronization across multiple users
- **Keyboard Shortcuts**: Efficient navigation and actions
- **Batch Operations**: Update multiple bug reports simultaneously

### Technical Stack
- **Frontend**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for file attachments
- **UI Components**: TanStack Table, React Hook Form, react-dropzone
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📁 Project Structure

```
components/test-execution/
├── types.ts                    # TypeScript interfaces and types
├── quick-bug-form.tsx          # Bug creation form component
├── bug-data-grid.tsx           # Data grid with sheet-like interface
└── test-execution-module.tsx   # Main module component

lib/
└── test-execution-utils.ts     # Utility functions

app/api/test-execution/
├── bugs/
│   ├── route.ts               # CRUD operations for bugs
│   └── batch/
│       └── route.ts           # Batch operations endpoint
└── test-execution/
    └── page.tsx               # Demo page
```

## 🎯 Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase project with proper database schema
- Environment variables configured

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create `.env.local` with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Database Schema**
   The module expects these Supabase tables:
   - `winners_bug_reports` - Main bug reports table
   - `winners_attachments` - File attachments table
   - `winners-test-assets` - Storage bucket for files

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Module**
   Navigate to `/test-execution` to see the module in action.

## 🔧 Usage

### Basic Implementation

```tsx
import { TestExecutionModule } from '@/components/test-execution/test-execution-module'

export default function MyPage() {
  return <TestExecutionModule />
}
```

### With Initial Data

```tsx
import { TestExecutionModule } from '@/components/test-execution/test-execution-module'

export default function MyPage() {
  const initialBugs = [
    // Your initial bug data
  ]
  
  return <TestExecutionModule initialData={initialBugs} />
}
```

## 🎮 Features Guide

### 1. Quick Bug Creation

**Access**: Click "New Bug" button or press `Ctrl+N`

**Features**:
- Auto-detection of browser and OS
- Required fields validation
- Tag management with comma/enter separation
- Real-time form validation
- File upload with drag & drop

**Form Fields**:
- Title* (required)
- Description* (required)
- Severity (Low, Medium, High, Critical)
- Priority (Low, Medium, High, Urgent)
- Reporter Information* (Name, Email)
- Environment Details (Environment, Browser, Device, OS)
- URL
- Steps to Reproduce
- Expected vs Actual Results
- Tags
- File Attachments

### 2. Screenshot Paste Support

**How to Use**:
1. Take a screenshot (`Print Screen` or `Cmd+Shift+4`)
2. Open the bug creation form
3. Press `Ctrl+V` anywhere in the form
4. Screenshot is automatically attached

**Supported Formats**:
- PNG, JPEG, GIF, WebP
- Automatic filename generation with timestamp

### 3. Data Grid Interface

**Features**:
- **Sorting**: Click column headers to sort
- **Filtering**: Global search and column-specific filters
- **Selection**: Single/multiple row selection with checkboxes
- **Pagination**: Navigate through large datasets
- **Column Management**: Show/hide columns
- **Responsive Design**: Works on all screen sizes

**Available Columns**:
- ID, Title, Severity, Priority, Status
- Reporter, Environment, Created Date, Updated Date
- Attachment Count, Actions

### 4. Batch Operations

**How to Use**:
1. Select multiple bugs using checkboxes
2. Choose operation from dropdown:
   - Change Status (Open, In Progress, Resolved, Closed)
   - Change Severity (Low, Medium, High, Critical)
   - Change Priority (Low, Medium, High, Urgent)
   - Delete Selected

**Keyboard Shortcuts**:
- `Ctrl+A`: Select all visible bugs
- `Delete`: Delete selected bugs
- `Escape`: Clear selection

### 5. CSV Export

**Access**: Click "Export" button or press `Ctrl+E`

**Export Includes**:
- All bug report fields
- Attachment counts
- Formatted dates
- Escaped special characters for Excel compatibility

**File Naming**: `bug-reports-YYYY-MM-DD.csv`

### 6. Real-time Updates

**Features**:
- Live updates when bugs are created/updated/deleted by other users
- Toast notifications for changes
- Automatic refresh of data grid
- No manual refresh needed

### 7. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Create new bug |
| `Ctrl+E` | Export to CSV |
| `Ctrl+R` | Refresh data |
| `Ctrl+V` | Paste screenshot (in form) |
| `Delete` | Delete selected bugs |
| `Escape` | Close dialogs/clear selection |

## 🔌 API Endpoints

### GET `/api/test-execution/bugs`
Fetch bug reports with optional filtering.

**Query Parameters**:
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status
- `severity`: Filter by severity
- `priority`: Filter by priority

**Response**:
```json
{
  "bugs": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### POST `/api/test-execution/bugs`
Create new bug report with file uploads.

**Body**: FormData with:
- `bugData`: JSON string of bug information
- `file_0`, `file_1`, etc.: File attachments

**Response**:
```json
{
  "bug": {...},
  "attachments": [...]
}
```

### DELETE `/api/test-execution/bugs`
Delete multiple bug reports.

**Body**:
```json
{
  "ids": ["bug-id-1", "bug-id-2"]
}
```

### PATCH `/api/test-execution/bugs/batch`
Batch update operations.

**Body**:
```json
{
  "type": "update_status",
  "value": "resolved",
  "selectedIds": ["id1", "id2"]
}
```

## 🎨 Customization

### Styling
The module uses Tailwind CSS. You can customize:
- Colors in badge components
- Layout spacing
- Form styling
- Grid appearance

### Validation
Modify form validation in `quick-bug-form.tsx`:
```tsx
const validation = {
  title: { required: 'Title is required' },
  description: { required: 'Description is required' },
  // Add custom validation rules
}
```

### File Upload Limits
Configure in `test-execution-utils.ts`:
```tsx
export const MAX_FILE_SIZE = 52428800 // 50MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', // Add more types
]
```

## 🛠️ Troubleshooting

### Common Issues

1. **Files not uploading**
   - Check Supabase storage bucket permissions
   - Verify file size limits
   - Ensure CORS is configured

2. **Real-time updates not working**
   - Check Supabase real-time permissions
   - Verify API keys are correct
   - Check browser console for errors

3. **CSV export issues**
   - Ensure data contains proper fields
   - Check for special characters in data
   - Verify browser allows downloads

### Debug Mode
Enable debug logging:
```tsx
// In test-execution-utils.ts
const DEBUG = true
if (DEBUG) console.log('Debug info:', data)
```

## 📈 Performance Optimization

### Large Datasets
- Pagination is implemented by default
- Use server-side filtering for better performance
- Consider virtual scrolling for very large lists

### File Uploads
- Compress images before upload
- Use progressive upload for large files
- Implement upload progress indicators

### Real-time Updates
- Debounce rapid updates
- Batch multiple changes
- Use selective subscriptions

## 🔒 Security Considerations

### File Uploads
- File type validation on both client and server
- Size limits enforced
- Virus scanning recommended for production

### Access Control
- Implement row-level security (RLS) in Supabase
- Validate user permissions for all operations
- Sanitize user inputs

### API Security
- Rate limiting for API endpoints
- Input validation and sanitization
- Secure file storage paths

## 🚀 Production Deployment

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### Performance Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor API response times
- Track file upload success rates

### Backup Strategy
- Regular database backups
- File storage backups
- Version control for schema changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue in the repository
4. Contact the development team

---

**Happy Bug Tracking! 🐛✨** 