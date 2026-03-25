# Payment Integration Demo

A complete payment product demo website showcasing three different payment integration methods: LinkPay, Drop-in, and Direct API.

## Project Structure

```
payment-demo/
├── frontend/          # React + TypeScript frontend
├── backend/           # Go + Gin backend
└── README.md
```

## Features

- 🌍 Multi-region support (Global, Hong Kong, Korea, Japan, Malaysia, Indonesia, Thailand, Singapore)
- 🗣️ Multi-language support (English, Chinese, Japanese, Korean)
- 💰 Multi-currency support (USD, HKD, KRW, JPY, MYR, IDR, THB, SGD)
- 🔄 Three payment integration methods:
  - **LinkPay**: Redirect-based payment link
  - **Drop-in**: Embedded payment component
  - **Direct API**: Direct API calls with 3DS authentication
- 🎯 Multi-environment support (UAT test environment, Production environment)

## Quick Start

### 1. Start Backend Service

```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

Backend service will start at http://localhost:8080

### 2. Start Frontend Service

```bash
cd frontend
npm install
npm run dev
```

Frontend service will start at http://localhost:5173

### 3. Access Application

Open browser and visit http://localhost:5173

## Configure Real Payment API

### Get API Keys

1. Visit [Evonet Developer Center](https://developer.evonetonline.com/)
2. Register account and get KeyID and SignKey
3. Copy `.env.example` to `.env` in backend directory
4. Fill in your API configuration:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` file:

```env
EVONET_KEY_ID=your_actual_key_id
EVONET_SIGN_KEY=your_actual_sign_key
```

### API Documentation

- [Drop-in Integration Guide](https://developer.evonetonline.com/v2.0/docs/drop-in-integration-step-en)
- [LinkPay Integration Guide](https://developer.evonetonline.com/v2.0/docs/linkpay-integration-step)
- [Direct API Integration Guide](https://developer.evonetonline.com/v2.0/docs/direct-api-integration)

## Demo Mode

If real API keys are not configured, the system will run in demo mode and return simulated payment responses for development and testing.

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Ant Design (UI components)
- React Router (routing)
- React i18next (internationalization)
- Axios (HTTP client)

### Backend
- Go 1.21+
- Gin (web framework)
- Standard library (net/http, crypto, etc.)

## Development Guide

### Directory Structure

**Frontend (frontend/)**
```
src/
├── components/        # Reusable components
├── pages/            # Page components
├── hooks/            # Custom hooks
├── services/         # API services
├── locales/          # Internationalization files
├── types/            # TypeScript type definitions
├── context/          # React Context
└── utils/            # Utility functions
```

**Backend (backend/)**
```
cmd/server/           # Application entry point
config/              # Configuration management
internal/
├── api/             # HTTP routes and handlers
├── service/         # Business logic
├── models/          # Data models
└── utils/           # Utility functions
```

## Payment Methods

### LinkPay
- Redirect-based payment flow
- Best for mobile-first experiences
- Supports multiple currencies

### Drop-in
- Embedded payment component
- Multiple payment methods in one UI
- Real-time validation

### Direct API
- Full control over payment flow
- Custom UI implementation
- Advanced 3DS authentication support

## Test Card

- Card Number: 4895330111111119
- Expiry: 12/31
- CVV: 390

## Important Notes

- UAT environment is for testing, production environment is for real transactions
- Ensure webhook URL is correctly configured in production
- After successful payment, webhook notification will be triggered, return "SUCCESS" to confirm

## Support

For questions, please refer to:
- [Evonet API Documentation](https://developer.evonetonline.com/v2.0/)
- [Technical Support](https://developer.evonetonline.com/contact)

## License

MIT License