# SkyQuery:- Distributed Flight Intelligence System

A distributed AI-powered flight management system leveraging microservices architecture for real-time flight data processing and multi-source integration.

## Features

- **Distributed Architecture**
  - API Gateway for request routing & load balancing
  - Decoupled microservices for flight data & weather processing
  - Horizontal scaling capabilities with container orchestration

- **AI Integration Layer**
  - Multi-provider AI interface (Google Gemini, OpenAI, Anthropic)
  - Dynamic model routing with fallback mechanisms
  - Distributed chat session management

- **Real-time Data Processing**
  - Amadeus API integration for flight pricing/status
  - Weather pattern analysis subsystem
  - Redis-based caching layer for high-frequency queries

- **Security & Auth**
  - JWT-based authentication service
  - Distributed session management
  - Role-based access control (RBAC) 

## Technologies
- **Core**: Node.js, Next.js (App Router), React Server Components
- **AI**: Google Gemini 1.5 Pro, AI SDK
- **Data**: PostgreSQL (Neon), Redis, Amadeus Flight API
- **Infra**: Docker, Kubernetes, NGINX
- **UI**: Tailwind CSS, Radix UI Primitives

## Getting Started

### Prerequisites
- Docker 24.0+
- Node.js 18.x
- PostgreSQL 15
- Redis 7.2

# Installation

- **Clone repository**
- **Install dependencies**
  - Run:
    ```bash
    pnpm install
    ```
- **Copy environment template**
  - Run:
    ```bash
    cp .env.example .env
    ```

# Running the System

- **Start core services**
  - Run:
    ```bash
    docker-compose up -d postgres redis
    ```
- **Run database migrations**
  - Run:
    ```bash
    pnpm db:migrate
    ```
- **Start development servers**
  - Run:
    ```bash
    pnpm dev:gateway & pnpm dev:flight-service & pnpm dev:weather-service
    ```

# Environment Configuration

## API Services

- `FLIGHT_API_ENDPOINT="http://flight-service:3001"`
- `WEATHER_API_ENDPOINT="http://weather-service:3002"`

## AI Providers

- `GOOGLE_API_KEY="your_gemini_key"`
- `OPENAI_API_KEY="optional_alt_key"`

## Database

- `POSTGRES_URL="postgres://user:pass@localhost:5432/flightdb"`
- `REDIS_URL="redis://localhost:6379"`
