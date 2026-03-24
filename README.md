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

### Core Payment Features
- 🌍 Multi-country/region support (Global, Hong Kong, Korea, Japan, Malaysia, Indonesia, Thailand, Singapore)
- 💰 Multi-currency support (USD, HKD, KRW, JPY, MYR, IDR, THB, SGD)
- 🔄 Three payment methods:
  - **LinkPay**: Redirect payment link
  - **Drop-in**: Embedded payment component
  - **Direct API**: Direct API calls (including 3DS authentication)
- 🎯 Multi-environment support (UAT test environment, Production environment)

### Additional Features (Phase 2)
- 📋 **Subscription Plans**: Set up recurring payments with flexible subscription plans
  - Multiple plan tiers (Basic, Pro, Enterprise)
  - Recurring billing management
  - Easy subscription activation via Drop-in
- 💸 **Refund Management**: Process refunds quickly and efficiently
  - Support for partial and full refunds
  - Real-time status tracking
  - Detailed transaction history

### Developer Tools (Phase 3)
- 🔧 **Developer Tools Panel**: Comprehensive debugging suite
  - Request/Response viewer
  - Error scenario simulator
  - Integration code generator (React, Vue, Node.js, PHP)
- 📱 **Mobile Preview**: Preview your payment flow on different devices
  - iPhone, iPad, and Desktop presets
  - Portrait/Landscape orientation toggle
  - Full-screen preview mode
- 🌐 **Region Selector**: Quick region switching with currency and payment method info
- 🎥 **Demo Recorder**: Record and share demo sessions
  - Step-by-step recording
  - Shareable links for demos
- 📊 **Flow Indicator**: Visualize the payment flow with role labels (Merchant/Evonet)

## Getting Started

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

### 3. Access the Application

Open browser and visit http://localhost:5173

## Configuring Real Payment API

### Get API Keys

1. Visit [Evonet Developer Center](https://developer.evonetonline.com/)
2. Register account and get KeyID and SignKey
3. Copy `.env.example` to `.env` in the backend directory
4. Fill in your API configuration:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` file:

```env
EVONET_KEY_ID=your_actual_key_id
EVONET_SIGN_KEY=your_actual_sign_key
```

### API Documentation Reference

- [Drop-in Integration](https://developer.evonetonline.com/v2.0/docs/drop-in-integration-step-en)
- [LinkPay Integration](https://developer.evonetonline.com/v2.0/docs/linkpay-integration-step)
- [Direct API Integration](https://developer.evonetonline.com/v2.0/docs/direct-api-integration)

## Demo Mode

If real API keys are not configured, the system will run in demo mode, returning simulated payment responses for development and testing.

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- Ant Design (UI component library)
- React Router (Routing)
- Axios (HTTP client)

### Backend
- Go 1.21+
- Gin (Web framework)
- SQLite (Demo recordings storage)
- Standard library (net/http, crypto, etc.)

## Development Guide

### Directory Structure

**Frontend (frontend/)**
```
src/
├── components/        # Reusable components
│   ├── DemoRecorder.tsx     # Demo recording component
│   ├── MobilePreview.tsx    # Mobile preview component
│   ├── RegionSelector.tsx   # Region selector component
│   ├── DeveloperTools.tsx   # Developer tools panel
│   ├── DevPanel.tsx         # Request/Response viewer
│   ├── ErrorSimulator.tsx   # Error scenario simulator
│   ├── CodeGenerator.tsx    # Integration code generator
│   ├── FlowIndicator.tsx    # Payment flow indicator
│   └── RoleLabel.tsx        # Role labels (Merchant/Evonet)
├── pages/              # Page components
│   ├── HomePage.tsx         # Landing page with scenarios
│   ├── PaymentPage.tsx      # Payment flow page
│   ├── PaymentResultPage.tsx# Payment result page
│   ├── SubscriptionPage.tsx # Subscription plans page
│   └── RefundPage.tsx       # Refund management page
├── hooks/              # Custom Hooks
├── services/           # API services
├── types/              # TypeScript type definitions
├── context/            # React Context
└── utils/              # Utility functions
```

**Backend (backend/)**
```
cmd/server/           # Application entry point
config/              # Configuration management
internal/
├── api/             # HTTP routes and handlers
├── service/         # Business logic
├── models/          # Data models
├── database/        # SQLite database for demo recordings
└── utils/           # Utility functions
```

### Adding New Payment Methods

1. Add new payment method structure in `backend/internal/models/models.go`
2. Implement payment logic in `backend/internal/service/payment.go`
3. Add frontend support in `frontend/src/pages/PaymentPage.tsx`
4. Update scenario configuration

## Deployment

### Frontend Deployment (Vercel)
1. Connect your repository to Vercel
2. Set root directory to `frontend`
3. Configure environment variables:
   - `VITE_API_BASE_URL`: Your backend API URL

### Backend Deployment (Render)
1. Connect your repository to Render
2. Set root directory to `backend`
3. Configure environment variables:
   - `EVONET_KEY_ID`: Your Evonet API Key ID
   - `EVONET_SIGN_KEY`: Your Evonet Sign Key
   - `EVONET_UAT_KEY_ID`: UAT environment Key ID (optional)
   - `EVONET_UAT_SIGN_KEY`: UAT environment Sign Key (optional)

## Testing

### Run Frontend Tests
```bash
cd frontend
npm test
```

### Run Frontend Build
```bash
cd frontend
npm run build
```

### Run Backend
```bash
cd backend
go run cmd/server/main.go
```

## Important Notes

- Test card number: 4895330111111119 (Expiry: 12/31, CVV: 390)
- UAT environment for testing, Production environment for real transactions
- Ensure webhook URL is correctly configured in production
- After successful payment, webhook notification will be triggered, return "SUCCESS" to confirm

## API Endpoints

### Payment APIs
- `POST /api/v1/payment/interaction` - Create payment interaction (LinkPay/Drop-in)
- `POST /api/v1/payment/direct` - Create direct payment
- `GET /api/v1/payment/:merchantTransId` - Get payment status
- `GET /api/v1/interaction/:merchantOrderId` - Get interaction status

### Subscription APIs
- `GET /api/v1/subscription/plans` - Get subscription plans
- `POST /api/v1/subscription` - Create subscription
- `GET /api/v1/subscription/:id` - Get subscription details
- `POST /api/v1/subscription/:id/cancel` - Cancel subscription

### Refund APIs
- `POST /api/v1/refund` - Create refund
- `GET /api/v1/refund/:id` - Get refund details

### Demo Recording APIs
- `GET /api/v1/recordings` - List demo recordings
- `POST /api/v1/recordings` - Save demo recording
- `GET /api/v1/recordings/:id` - Get recording details
- `DELETE /api/v1/recordings/:id` - Delete recording

## Support

For questions, please refer to:
- [Evonet API Documentation](https://developer.evonetonline.com/v2.0/)
- [Technical Support](https://developer.evonetonline.com/contact)