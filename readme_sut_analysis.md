# SUT Analysis Feature Documentation

## Overview

The SUT (System Under Test) Analysis feature provides automated web application analysis using Playwright for crawling and OpenAI for intelligent insights. This feature allows users to automatically discover application structure, features, and generate comprehensive testing recommendations.

## Core Capabilities

### 🔍 Automated Web Crawling
- **Playwright Integration**: Uses Playwright MCP for reliable, headless browser automation
- **Consent Popup Handling**: Automatically detects and handles cookie consent dialogs
- **Authentication Support**: Optional login functionality with encrypted credential storage
- **Smart Navigation**: Recursive crawling with configurable depth and page limits
- **Screenshot Capture**: Full-page screenshots for visual documentation

### 🧠 AI-Powered Analysis
- **OpenAI GPT-4 Integration**: Generates comprehensive SUT analysis reports
- **Structured Recommendations**: Testing strategies, risk assessments, and priority matrices
- **Feature Detection**: Automatically identifies application capabilities (login, search, cart, etc.)
- **Technical Insights**: Technology stack detection and architecture analysis

### 📊 Comprehensive Reporting
- **Interactive Dashboard**: Status tracking with real-time updates
- **Detailed Analytics**: Page inventory, form analysis, and link mapping
- **Export Functionality**: Download reports in Markdown format
- **Visual Documentation**: Screenshot gallery with page associations

## Architecture

### Database Schema
```sql
-- Core table: winners_sut_analysis
- id: UUID (Primary Key)
- name: Analysis name
- target_url: Main application URL
- login_url: Optional login page URL
- username/password_encrypted: Authentication credentials
- crawl_settings: Configuration parameters (JSON)
- crawl_data: Raw crawl results (JSON)
- ai_analysis: Generated insights (JSON)
- screenshots: Screenshot metadata (JSON)
- status: pending|crawling|analyzing|completed|failed
```

### API Endpoints

#### Core CRUD Operations
- `GET /api/sut-analysis` - List all analyses with filtering
- `POST /api/sut-analysis` - Create new analysis and trigger crawling
- `GET /api/sut-analysis/[id]` - Retrieve specific analysis
- `PUT /api/sut-analysis/[id]` - Update analysis details
- `DELETE /api/sut-analysis/[id]` - Remove analysis and associated files

#### AI Analysis
- `POST /api/sut-analysis/ai-analysis` - Generate AI insights
- `GET /api/sut-analysis/ai-analysis?id=[id]` - Retrieve existing analysis

### Component Structure
```
components/sut/
├── sut-analysis-interface.tsx    # Main dashboard
├── sut-analysis-form.tsx         # Creation/edit form
└── sut-analysis-detail.tsx       # Results viewer
```

### Service Layer
```
lib/
└── playwright-mcp-service.ts     # Playwright automation service
```

## Configuration Options

### Crawl Settings
- **Max Pages**: Limit number of pages to crawl (1-50)
- **Max Depth**: Control link following depth (1-5)
- **Screenshot Quality**: Image compression level (50-100%)
- **Timeout**: Page load timeout in milliseconds
- **Network Idle**: Wait for network activity to complete

### Authentication
- **Username/Password**: Standard form authentication
- **Custom Selectors**: Override default element selectors
- **Login URL**: Separate login page if different from target

### Security Features
- **Encrypted Passwords**: AES-256 encryption for stored credentials
- **Environment Variables**: Secure key management
- **RLS Policies**: Row-level security for data access
- **Input Validation**: XSS and injection prevention

## Usage Workflow

### 1. Analysis Creation
1. Navigate to `/sut-analysis`
2. Click "New Analysis"
3. Configure target URL and optional authentication
4. Set crawl parameters if needed
5. Submit to start automated process

### 2. Automated Execution
1. **Crawling Phase**: Playwright navigates and extracts data
2. **Data Processing**: Structure analysis and screenshot storage
3. **AI Analysis**: Generate insights and recommendations
4. **Completion**: Status updates to "completed"

### 3. Results Review
1. View overview dashboard with key metrics
2. Explore detailed crawl data and page structure
3. Read AI-generated analysis and recommendations
4. Download comprehensive reports

## Data Collection

### Page-Level Analysis
- **URL and Title**: Basic page identification
- **Content Extraction**: Full text content for analysis
- **Form Discovery**: Input fields, validation rules, and purposes
- **Link Mapping**: Internal/external navigation structure
- **Media Inventory**: Images, videos, and accessibility data
- **Interactive Elements**: Buttons, modals, and dynamic components

### Feature Detection
- **Authentication Systems**: Login/logout flows
- **Search Functionality**: Search forms and filters
- **E-commerce Features**: Shopping carts and checkout
- **User Management**: Profiles and account systems
- **Content Systems**: Comments, ratings, and reviews
- **Third-party Integrations**: Social media, analytics, payments

### Technical Analysis
- **Technology Stack**: Framework and library detection
- **Performance Indicators**: Load times and optimization opportunities
- **Security Assessment**: HTTPS usage and header analysis
- **Accessibility**: ARIA labels and semantic structure

## AI Analysis Structure

### 1. Application Overview
- Purpose and business functions
- User roles and personas
- Technology stack assessment
- Critical business workflows

### 2. Site Architecture
- Navigation patterns and hierarchy
- Page inventory and categorization
- URL structure analysis
- Information architecture review

### 3. Feature Risk Assessment
- Business criticality ratings (High/Medium/Low)
- User impact analysis
- UI complexity evaluation
- Dependency mapping
- Testing challenge identification

### 4. Testing Strategy
- Critical test area identification
- Testing type recommendations
- Automation opportunity assessment
- Risk-based testing approach
- Implementation timeline estimates

## Integration Points

### Navigation Integration
- **Navbar**: Accessible from main navigation with Target icon
- **Main Page**: Quick action card for easy access
- **Test Planning**: Seamless workflow with manual test planning

### File Storage
- **Supabase Storage**: Screenshots stored in `winners-test-assets` bucket
- **Organized Structure**: Files organized by analysis ID and timestamp
- **Cleanup Handling**: Automatic file removal on analysis deletion

### Real-time Updates
- **Status Polling**: 5-second intervals for progress tracking
- **Progress Indicators**: Visual feedback during long-running operations
- **Error Handling**: Comprehensive error reporting and recovery

## Security Considerations

### Data Protection
- **Credential Encryption**: AES-256 encryption for stored passwords
- **Environment Variables**: Secure configuration management
- **Input Sanitization**: XSS and injection prevention
- **Access Control**: Service role authentication for API access

### Privacy
- **Local Processing**: Screenshots and analysis data stored locally
- **Configurable Retention**: Manual deletion control
- **No External Sharing**: All data remains within your Supabase instance

## Performance Optimization

### Crawling Efficiency
- **Concurrent Processing**: Parallel page analysis where possible
- **Resource Limits**: Configurable bounds to prevent system overload
- **Timeout Management**: Reasonable defaults with override options
- **Memory Management**: Efficient screenshot and data handling

### Storage Optimization
- **Image Compression**: Configurable quality settings
- **JSON Compression**: Efficient data structure storage
- **Cleanup Procedures**: Automatic removal of orphaned files

## Troubleshooting

### Common Issues

#### 1. RLS Policy Errors
```sql
-- Fix restrictive policies
ALTER TABLE winners_sut_analysis DISABLE ROW LEVEL SECURITY;
```

#### 2. Crawling Failures
- Check target URL accessibility
- Verify authentication credentials
- Adjust timeout settings for slow sites
- Review error messages in analysis details

#### 3. AI Analysis Issues
- Ensure OpenAI API key is configured
- Check API usage limits
- Verify crawl data completeness

### Error Handling
- **Network Failures**: Retry logic and graceful degradation
- **Authentication Errors**: Clear error messages and troubleshooting steps
- **Storage Issues**: Fallback mechanisms and user notification
- **API Limits**: Rate limiting and usage monitoring

## Future Enhancements

### Planned Features
- **Scheduled Analysis**: Recurring crawls for change detection
- **Comparison Mode**: Before/after analysis capabilities
- **Advanced Selectors**: Custom element targeting
- **Mobile Testing**: Device simulation and responsive analysis
- **API Testing**: Endpoint discovery and validation

### Integration Opportunities
- **CI/CD Integration**: Automated analysis in deployment pipelines
- **Test Case Generation**: Direct test creation from analysis results
- **Bug Tracking**: Integration with existing bug reporting workflow
- **Performance Monitoring**: Integration with monitoring tools

## Dependencies

### Required Packages
- `playwright`: Browser automation
- `@supabase/supabase-js`: Database and storage
- `openai`: AI analysis generation
- `crypto`: Password encryption
- `react`: UI components
- `next.js`: Framework and API routes

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
ENCRYPTION_KEY=your_32_char_encryption_key
```

## Support and Maintenance

### Monitoring
- **Error Tracking**: Comprehensive logging and error capture
- **Performance Metrics**: Crawl duration and success rates
- **Usage Analytics**: Feature adoption and user patterns

### Updates
- **Playwright Versions**: Regular updates for browser compatibility
- **OpenAI Models**: Migration to newer models as available
- **Security Patches**: Prompt application of security updates

This feature represents a significant advancement in automated testing analysis, providing comprehensive insights while maintaining security and performance standards.