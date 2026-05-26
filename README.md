# FluxPay

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![Solidity Version](https://img.shields.io/badge/solidity-%5E0.8.0-blue)](https://soliditylang.org/)

A decentralized AI data marketplace platform enabling secure, blockchain-based payment processing for data transactions.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Smart Contracts](#smart-contracts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

FluxPay is a full-stack application that combines a modern web frontend with a robust backend and blockchain smart contracts to facilitate secure, transparent payment processing in an AI data marketplace. Users can browse data offerings, make payments securely using cryptocurrency, and track their transaction history.

## Features

- ✅ **Secure Payments** - Blockchain-based payment processing with cryptographic verification
- ✅ **Token Support** - Native ERC20 token (FluxPay Token) for transactions
- ✅ **User Dashboard** - Intuitive interface for managing payments and viewing analytics
- ✅ **Transaction History** - Complete audit trail of all payment transactions
- ✅ **Real-time Updates** - Live payment status updates
- ✅ **Data Marketplace** - Browse and purchase AI datasets
- ✅ **Smart Contract Automation** - Automated payment escrow and release
- ✅ **Multi-User Support** - Support for multiple concurrent users and transactions

## Technology Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **Validation**: Custom validators
- **Error Handling**: Custom error classes

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Context API
- **Styling**: CSS
- **HTTP Client**: Fetch API
- **Build Tool**: Vite (recommended)

### Blockchain
- **Language**: Solidity ^0.8.0
- **Network**: Ethereum (testnet/mainnet)
- **Development**: Hardhat
- **Standards**: ERC20 Token Standard
- **Testing**: Hardhat Test Suite

## Project Structure

```
FluxPay/
├── contracts/                    # Smart Contracts (Solidity)
│   ├── FluxPayToken.sol         # ERC20 Token Contract
│   ├── PaymentProcessor.sol      # Payment Processing Contract
│   ├── hardhat.config.js        # Hardhat Configuration
│   ├── package.json             # Contract Dependencies
│   ├── scripts/
│   │   └── deploy.js            # Deployment Script
│   └── test/
│       └── FluxPayToken.test.js # Contract Tests
│
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── App.tsx              # Main App Component
│   │   ├── index.tsx            # Entry Point
│   │   ├── styles.css           # Global Styles
│   │   ├── components/          # Reusable Components
│   │   │   ├── Button.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Input.tsx
│   │   │   └── PaymentForm.tsx
│   │   ├── pages/               # Page Components
│   │   │   ├── Dashboard.tsx
│   │   │   └── PaymentHistory.tsx
│   │   ├── context/             # Context API
│   │   │   └── PaymentContext.tsx
│   │   ├── hooks/               # Custom Hooks
│   │   │   └── usePayment.ts
│   │   ├── services/            # API Services
│   │   │   └── api.ts
│   │   ├── types/               # TypeScript Definitions
│   │   │   └── index.ts
│   │   ├── utils/               # Utilities
│   │   │   └── helpers.ts
│   │   └── config/              # Configuration
│   │       └── index.ts
│   ├── index.html               # HTML Template
│   ├── package.json             # Dependencies
│   └── tsconfig.json            # TypeScript Config
│
├── src/                          # Backend (Node.js)
│   ├── app.ts                   # Express App Setup
│   ├── index.ts                 # Entry Point
│   ├── config/
│   │   └── index.ts             # Configuration
│   ├── database/
│   │   └── connection.ts        # MongoDB Connection
│   ├── middleware/
│   │   └── index.ts             # Express Middleware
│   ├── models/
│   │   └── payment.ts           # Payment Schema
│   ├── routes/
│   │   └── payment.ts           # Payment Routes
│   ├── services/
│   │   └── paymentService.ts    # Business Logic
│   └── utils/
│       ├── errors.ts            # Custom Errors
│       ├── helpers.ts           # Helper Functions
│       └── validators.ts        # Input Validators
│
├── tests/                        # Backend Tests
│   ├── payment.test.ts
│   ├── services.test.ts
│   └── helpers.ts
│
├── IMPLEMENTATION.md            # Implementation Guide
├── LICENSE                      # MIT License
├── README.md                    # This File
├── package.json                 # Root Dependencies
└── tsconfig.json               # Root TypeScript Config
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v14.0.0 or higher ([Download](https://nodejs.org/))
- **npm** v6.0.0 or higher (comes with Node.js)
- **MongoDB** (local or MongoDB Atlas account)
- **Git** for version control
- **Hardhat** for smart contract development

### Optional
- **MetaMask** browser extension for blockchain interaction
- **Etherscan** account for contract verification

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/FluxPay.git
cd FluxPay
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd src
npm install
```

### 4. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 5. Install Smart Contract Dependencies

```bash
cd ../contracts
npm install
```

## Configuration

### Backend Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/fluxpay

# Blockchain
ETHEREUM_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Smart Contract Configuration

Update `contracts/hardhat.config.js`:

```javascript
module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

## Running the Project

### Development Mode

#### Start MongoDB (if running locally)

```bash
mongod
```

#### Terminal 1: Backend Server

```bash
npm run start
```

The backend will be available at `http://localhost:3000`

#### Terminal 2: Smart Contracts (Hardhat Node)

```bash
cd contracts
npx hardhat node
```

#### Terminal 3: Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend (if using TypeScript compilation)
npm run build
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### Process Payment

```http
POST /payments
Content-Type: application/json

{
  "amount": 1000,
  "userId": "user123",
  "description": "Data purchase",
  "transactionHash": "0x..."
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "amount": 1000,
  "userId": "user123",
  "description": "Data purchase",
  "status": "pending",
  "transactionHash": "0x...",
  "createdAt": "2026-05-26T10:30:00Z",
  "updatedAt": "2026-05-26T10:30:00Z"
}
```

#### Get Payment History

```http
GET /payments/history/:userId
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "amount": 1000,
    "userId": "user123",
    "description": "Data purchase",
    "status": "completed",
    "transactionHash": "0x...",
    "createdAt": "2026-05-26T10:30:00Z"
  }
]
```

#### Update Payment Status

```http
PATCH /payments/:id/status
Content-Type: application/json

{
  "status": "completed"
}
```

**Status Values:** `pending`, `completed`, `failed`

## Smart Contracts

### FluxPayToken (ERC20)

A standard ERC20 token implementation for the FluxPay ecosystem.

**Key Functions:**
- `transfer(address to, uint256 value)` - Transfer tokens
- `approve(address spender, uint256 value)` - Approve spending
- `transferFrom(address from, address to, uint256 value)` - Transfer on behalf

**Deployment:**

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

### PaymentProcessor

Handles payment processing and token transfers.

**Key Functions:**
- `processPayment(address recipient, uint256 amount)` - Process a payment
- `refundPayment(address payer, uint256 amount)` - Refund a payment (owner only)

**Contract Address:** (Set in `.env` after deployment)

## Testing

### Backend Tests

```bash
npm test
```

### Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

### Test Coverage

```bash
cd contracts
npx hardhat coverage
```

## Deployment

### Frontend Deployment (Vercel)

```bash
cd frontend
npm install -g vercel
vercel
```

### Backend Deployment (Heroku)

```bash
heroku login
heroku create fluxpay-backend
git push heroku main
heroku config:set DATABASE_URL=your_database_url
```

### Smart Contracts (Ethereum Testnet)

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

### Database (MongoDB Atlas)

1. Create a MongoDB Atlas account
2. Create a cluster
3. Get the connection string
4. Set `DATABASE_URL` in `.env`

## Security Considerations

- ⚠️ **Never commit `.env` files** - Always use `.env.example` as template
- ⚠️ **Secure Private Keys** - Use environment variables, never hardcode
- ⚠️ **Validate Inputs** - All user inputs are validated on backend
- ⚠️ **HTTPS Only** - Use HTTPS in production
- ⚠️ **Rate Limiting** - Consider implementing rate limiting on production
- ⚠️ **Smart Contract Audit** - Have contracts audited before mainnet deployment

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules (if configured)
- Write meaningful commit messages
- Add tests for new features

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
# Windows: Services tab or "mongod" command
# macOS: brew services list
# Linux: sudo systemctl status mongod
```

### Port Already in Use

```bash
# Find and kill process using port
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## Related Documentation

- [Implementation Guide](./IMPLEMENTATION.md) - Detailed implementation details
- [API Documentation](#api-documentation) - Complete API reference
- [Solidity Docs](https://docs.soliditylang.org/)
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@fluxpay.com or open an issue on the GitHub repository.

### Resources

- 📖 [Documentation](./IMPLEMENTATION.md)
- 🐛 [Report a Bug](https://github.com/yourusername/FluxPay/issues)
- 💡 [Request a Feature](https://github.com/yourusername/FluxPay/issues)
- 📧 [Contact Us](mailto:support@fluxpay.com)

---

**Made with ❤️ by the FluxPay Team**
