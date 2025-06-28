# Testing Chat Interface

A modern AI-powered testing assistant built with React, Next.js, and TypeScript. This application provides an intuitive chat interface to help with testing strategy, planning, and execution.

## Features

- **Central Chat Interface**: Large, prominent chat area for AI-powered testing assistance
- **Test Plan Cards**: Interactive cards for Test Plan, Test Design, and Test Execution
- **Testing Type Selection**: Checkboxes for Functional, Automated, Security, and Manual Testing
- **Tools & Frameworks Input**: Manual text area for specifying testing tools and frameworks
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Real-time Chat**: Simulated AI responses with loading states

## Project Structure

```
practice-2/
├── app/
│   ├── globals.css          # Global styles with Tailwind CSS
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main page component
├── components/
│   └── ui/
│       └── testing-chat-interface.tsx  # Main chat interface component
├── lib/
│   └── utils.ts             # Utility functions
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── postcss.config.js       # PostCSS configuration
└── next.config.js          # Next.js configuration
```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Install Additional Dependencies** (if needed):
   ```bash
   npm install tailwindcss-animate
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Browser**:
   Navigate to `http://localhost:3000`

## Component Features

### Testing Chat Interface
- **Left Sidebar**: Test plan cards (Test Plan, Test Design, Test Execution)
- **Central Area**: Chat messages with AI assistant
- **Right Sidebar**: Testing configuration options

### Interactive Elements
- Clickable test plan cards with active states
- Checkbox selection for testing types
- Text area for manual tool/framework input
- Message input with Enter key support
- Auto-scrolling chat messages

### Responsive Design
- Fixed height layout (600px)
- Flexible center column
- Fixed-width sidebars (264px each)
- Proper overflow handling

## Customization

### Colors and Theming
The project uses CSS custom properties for theming. Modify the values in `app/globals.css` to customize colors:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --background: 0 0% 100%;
  /* ... other variables */
}
```

### Testing Types
Add or modify testing types in the `TestingChatInterface` component:

```typescript
const [testingTypes, setTestingTypes] = useState({
  functional: false,
  automated: false,
  security: false,
  manual: false,
  // Add new types here
});
```

### Test Plan Cards
Customize test plan cards in the `testPlans` array:

```typescript
const testPlans = [
  {
    id: "test-plan",
    title: "Test Plan",
    description: "Create comprehensive test planning documents",
    icon: <FileText className="h-4 w-4" />,
  },
  // Add more cards here
];
```

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety and better development experience
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **React Hooks**: State management and effects

## Development Notes

- Components are kept under 500 lines for better maintainability
- Uses custom utility function for className merging
- Implements auto-scrolling chat behavior
- Includes loading states and animations
- Follows modern React patterns with hooks and TypeScript 