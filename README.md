# DropPoint Web Application

RFID Point Redemption System - Web Interface

## Features

- User authentication
- RFID card scanning
- Points display and management
- School supply store with redemption system
- Firebase Realtime Database integration
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Firebase Configuration

Firebase is already configured in `src/firebase/config.js`. Make sure your Firebase Realtime Database rules allow read/write access.

## Project Structure

```
DropPoint_Web/
├── src/
│   ├── components/       # Reusable components
│   ├── pages/           # Page components
│   ├── firebase/        # Firebase configuration
│   └── App.jsx         # Main app component
└── package.json
```

## Pages

- **Hero Page** (`/`) - Landing page
- **Login Page** (`/login`) - User authentication
- **Selection Page** (`/selection`) - Option selection
- **Verification Page** (`/verification`) - User verification
- **Processing Page** (`/processing`) - Processing status
- **Point Store** (`/store`) - Main store interface with RFID scanner

