# FluxPay Implementation Guide

## Project Overview

FluxPay is an AI data marketplace built with a TypeScript backend, React frontend, and Solidity smart contracts. It enables secure payment processing for data transactions using blockchain technology.

## Backend Architecture 
1. Database Setup (SQL): Initialize PostgreSQL tables `tasks`, `bounties`, and
`transactions`.
2. State Management (Redis): Set up a Redis message broker. When the API receives a
scraping request, it pushes micro-tasks to a Redis queue.
3. Agent Orchestration (FastAPI):
- Coordinator Agent: Listens to incoming requests, chunks them into targets, and
pushes to Redis.
- Worker Agents: Python background processes that pop tasks, scrape data, and
return structured JSON.
4. Agentic Payments: Once the Coordinator verifies the JSON payload, the Python
backend uses `web3.py` to call `executeMicroPayout` on the Morph smart contract.

## Frontend Architecture
1. Configure Next.js with `ethers.js` and the Morph SDK.
2. Build the `Deposit` component: Users connect their wallet and approve the transfer
of Testnet USDC to the Escrow contract.
3. Establish a WebSocket connection to the FastAPI backend to stream the real-time
status of Worker Agents.

### Technology Stack

**Backend:**
- Node.js with TypeScript
- Express.js (implied from package structure)
- Database: PostgreSQL (configured via DATABASE_URL)
- Smart Contract Integration: Web3.js/ethers.js

**Frontend:**
- React with TypeScript
- Vite or similar bundler
- Context API for state management

**Blockchain:**
- Solidity ^0.8.0
- Hardhat for development and testing
- ERC20 token standard

### Project Structure

```
FluxPay/
├── contracts/              # Smart contracts (Solidity)
├── frontend/              # React frontend
├── src/                   # Backend (Node.js/TypeScript)
├── tests/                 # Backend tests
└── scripts/               # Utility scripts
```

## Backend Implementation

### Core Application Setup

**File: `src/app.ts`**

Initializes the Express application with middleware and routes:

```typescript
import express from 'express';
import paymentRoutes from './routes/payment';
import { errorHandler } from './middleware';

export function createApp() {
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Routes
  app.use('/api/payments', paymentRoutes);
  
  // Error handling
  app.use(errorHandler);
  
  return app;
}
```

### Entry Point

**File: `src/index.ts`**

Starts the server:

```typescript
import { createApp } from './app';
import { connectDatabase } from './database/connection';

const PORT = process.env.PORT || 3000;
const app = createApp();

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
```

### Payment Service

**File: `src/services/paymentService.ts`**

Handles payment processing logic:

```typescript
import Payment from '../models/payment';
import { validatePayment } from '../utils/validators';

export async function processPayment(paymentData: {
  amount: number;
  userId: string;
  description: string;
  transactionHash?: string;
}) {
  // Validate input
  validatePayment(paymentData);
  
  // Create payment record
  const payment = new Payment({
    amount: paymentData.amount,
    userId: paymentData.userId,
    description: paymentData.description,
    status: 'pending',
    transactionHash: paymentData.transactionHash,
    createdAt: new Date(),
  });
  
  // Save to database
  return await payment.save();
}

export async function getPaymentHistory(userId: string) {
  return await Payment.find({ userId }).sort({ createdAt: -1 });
}

export async function updatePaymentStatus(
  paymentId: string,
  status: 'pending' | 'completed' | 'failed'
) {
  return await Payment.findByIdAndUpdate(
    paymentId,
    { status, updatedAt: new Date() },
    { new: true }
  );
}
```

### Routes

**File: `src/routes/payment.ts`**

API endpoints for payment operations:

```typescript
import express from 'express';
import * as paymentService from '../services/paymentService';
import { validatePaymentInput } from '../utils/validators';

const router = express.Router();

// Process a payment
router.post('/', validatePaymentInput, async (req, res) => {
  try {
    const payment = await paymentService.processPayment(req.body);
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get payment history
router.get('/history/:userId', async (req, res) => {
  try {
    const history = await paymentService.getPaymentHistory(req.params.userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment status
router.patch('/:id/status', async (req, res) => {
  try {
    const payment = await paymentService.updatePaymentStatus(
      req.params.id,
      req.body.status
    );
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
```

### Models

**File: `src/models/payment.ts`**

Payment data model:

```typescript
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  transactionHash: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Payment', paymentSchema);
```

### Database

**File: `src/database/connection.ts`**

Database connection management:

```typescript
import mongoose from 'mongoose';

export async function connectDatabase() {
  const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/fluxpay';
  
  try {
    await mongoose.connect(dbUrl);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Database disconnection failed:', error);
  }
}
```

### Utilities

**File: `src/utils/validators.ts`**

Input validation:

```typescript
export function validatePayment(data: any) {
  if (!data.amount || data.amount <= 0) {
    throw new Error('Invalid payment amount');
  }
  if (!data.userId) {
    throw new Error('User ID is required');
  }
  if (typeof data.amount !== 'number') {
    throw new Error('Amount must be a number');
  }
}

export function validatePaymentInput(req: any, res: any, next: any) {
  try {
    validatePayment(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
```

**File: `src/utils/helpers.ts`**

Helper utilities:

```typescript
export function formatCurrency(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`;
}

export function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
```

**File: `src/utils/errors.ts`**

Custom error handling:

```typescript
export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}
```

### Middleware

**File: `src/middleware/index.ts`**

Express middleware:

```typescript
import { PaymentError, ValidationError } from '../utils/errors';

export function errorHandler(err: Error, req: any, res: any, next: any) {
  console.error(err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err instanceof PaymentError) {
    return res.status(402).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
}
```

## Frontend Implementation

### App Component

**File: `frontend/src/App.tsx`**

Main application component:

```typescript
import React from 'react';
import { PaymentProvider } from './context/PaymentContext';
import Header from './components/Header';
import { Dashboard, PaymentHistory } from './pages';
import './styles.css';

export default function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');

  return (
    <PaymentProvider>
      <div className="app">
        <Header onNavigate={setCurrentPage} />
        <main>
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'history' && <PaymentHistory />}
        </main>
      </div>
    </PaymentProvider>
  );
}
```

### Context API

**File: `frontend/src/context/PaymentContext.tsx`**

Global state management:

```typescript
import React, { createContext, useState, useCallback } from 'react';

interface PaymentContextType {
  payments: any[];
  loading: boolean;
  error: string | null;
  processPayment: (amount: number, description: string) => Promise<void>;
  fetchPaymentHistory: (userId: string) => Promise<void>;
}

export const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (amount: number, description: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, userId: 'current-user' }),
      });
      if (!response.ok) throw new Error('Payment failed');
      const data = await response.json();
      setPayments(prev => [data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPaymentHistory = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payments/history/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PaymentContext.Provider value={{ payments, loading, error, processPayment, fetchPaymentHistory }}>
      {children}
    </PaymentContext.Provider>
  );
}
```

### Custom Hook

**File: `frontend/src/hooks/usePayment.ts`**

Payment logic hook:

```typescript
import { useContext } from 'react';
import { PaymentContext } from '../context/PaymentContext';

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
}
```

### Components

**File: `frontend/src/components/PaymentForm.tsx`**

Payment form component:

```typescript
import React, { useState } from 'react';
import { usePayment } from '../hooks/usePayment';
import Button from './Button';
import Input from './Input';

export default function PaymentForm() {
  const { processPayment, loading, error } = usePayment();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    await processPayment(parseFloat(amount), description);
    setAmount('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <Input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading}
      />
      <Input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={loading}
      />
      {error && <p className="error">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
}
```

## Smart Contracts

### FluxPayToken (ERC20)

**File: `contracts/FluxPayToken.sol`**

Token contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FluxPayToken {
    string public name = "FluxPay Token";
    string public symbol = "FPT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        owner = msg.sender;
        totalSupply = initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(from != address(0), "Invalid address");
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Allowance exceeded");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
```

### PaymentProcessor

**File: `contracts/PaymentProcessor.sol`**

Payment processor contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFluxPayToken {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract PaymentProcessor {
    address public owner;
    IFluxPayToken public token;

    event PaymentProcessed(address indexed payer, address indexed recipient, uint256 amount);
    event PaymentRefunded(address indexed payer, uint256 amount);

    constructor(address tokenAddress) {
        owner = msg.sender;
        token = IFluxPayToken(tokenAddress);
    }

    function processPayment(
        address recipient,
        uint256 amount
    ) public payable {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        
        // Transfer tokens from sender to recipient
        bool success = token.transferFrom(msg.sender, recipient, amount);
        require(success, "Token transfer failed");
        
        emit PaymentProcessed(msg.sender, recipient, amount);
    }

    function refundPayment(address payer, uint256 amount) public {
        require(msg.sender == owner, "Only owner can refund");
        require(amount > 0, "Amount must be positive");
        
        // Logic to handle refund
        emit PaymentRefunded(payer, amount);
    }
}
```

## Configuration

### Environment Variables

**File: `.env` (from `.env.example`)**

```env
# Backend
PORT=3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/fluxpay

# Blockchain
ETHEREUM_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
```

### TypeScript Configuration

**File: `tsconfig.json`**

Ensures proper TypeScript compilation for backend and shared types.

## Testing

### Backend Tests

**File: `tests/payment.test.ts`**

```typescript
import { processPayment, getPaymentHistory } from '../src/services/paymentService';

describe('Payment Service', () => {
  it('should process a valid payment', async () => {
    const payment = await processPayment({
      amount: 100,
      userId: 'user1',
      description: 'Test payment',
    });
    expect(payment).toBeDefined();
    expect(payment.status).toBe('pending');
  });

  it('should retrieve payment history', async () => {
    const history = await getPaymentHistory('user1');
    expect(Array.isArray(history)).toBe(true);
  });
});
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Process a payment |
| GET | `/api/payments/history/:userId` | Get payment history |
| PATCH | `/api/payments/:id/status` | Update payment status |

## Deployment

1. **Backend**: Deploy to Node.js hosting (Heroku, AWS, etc.)
2. **Frontend**: Deploy to static hosting (Vercel, Netlify, etc.)
3. **Contracts**: Deploy to Ethereum testnet/mainnet using Hardhat
4. **Database**: Set up MongoDB Atlas or self-hosted MongoDB

## Security Considerations

- Validate all user inputs on backend
- Use HTTPS for all communications
- Implement rate limiting on API endpoints
- Secure private keys and sensitive environment variables
- Use Web3 signing for blockchain transactions
- Implement proper authentication and authorization
- Test smart contracts thoroughly before mainnet deployment

## Future Enhancements

- Implement WebSocket for real-time payment updates
- Add multi-signature wallet support
- Implement payment escrow functionality
- Add advanced analytics and reporting
- Support multiple blockchain networks
- Implement zero-knowledge proofs for privacy
