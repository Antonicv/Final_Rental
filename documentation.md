# Car Rental Application Documentation

## System Overview
This document provides an overview of the car rental application, a modern full-stack web solution built with Vaadin Hilla, Spring Boot, and React. The system enables users to search, book, and manage car rentals through a responsive web interface, while offering administrative capabilities for managing vehicles, locations, and reservations.

## Technology Stack
- **Backend:** Spring Boot (Java 21)
- **Frontend:** React (TypeScript)
- **Integration:** Vaadin Hilla (type-safe RPC)
- **Build Tools:** Maven (backend), NPM/Vite (frontend)
- **Cloud:** AWS (DynamoDB for data, S3 for object storage)

## Architecture
The application follows a modern full-stack architecture, using Vaadin Hilla as the integration bridge between the Spring Boot backend and the React frontend. The build system is dual: Maven for Java backend, NPM/Vite for frontend assets. The final deployment artifact is a single executable JAR containing both backend services and frontend assets.

## Features

### For Users:
- Search and book vehicles
- Manage bookings
- Location services
- Multiple themes support

### For Administrators:
- Fleet management
- Reservation and location administration
- User management
- Reporting

### Technical Features:
- Progressive Web App (PWA)
- Type-safe RPC
- Cloud-native data
- Responsive design
- External API integration

## Frontend Architecture

### Core Framework Stack:
- React (18.3.1)
- TypeScript (5.7.3)
- Vite (6.2.6)
- Vaadin Hilla (24.7.2)

### Application Structure:
- The entry point is a minimal HTML file (`src/main/frontend/index.html`) serving as the React mount point.
- The `MainLayout` component (`@layout.tsx`) provides the application shell using Vaadin's AppLayout for navigation and theming controls.
- Navigation is managed via a static menu configuration, differentiating user and admin routes.

### Routing:
- Hilla's file-based routing automatically discovers and routes view components based on their file paths in `src/main/frontend/views/`.

### State Management:
- Uses React's `useState` for local UI state.
- Integrates with Hilla-generated endpoint clients for backend communication.

### Document Title Management:
- Implements a signal-based system to update the browser tab title dynamically based on the current view.

## Backend Architecture

### Core Technologies:
- Spring Boot 3.4.4 with Java 21
- Configured as a single executable JAR
- AWS SDK v2 for integration with:
  - DynamoDB (NoSQL data persistence)
  - S3 (object storage)

### Dependency Management:
- Managed via Maven with strict versioning for critical components.

### Configuration:
- Environment variables are prioritized, allowing flexible deployment across development, staging, and production.
- Supports build profiles for development and production with distinct dependency sets and optimizations.

### Hilla Integration:
- Backend is designed for seamless integration with Hilla's code generation, producing type-safe TypeScript clients for the frontend.

## Database Configuration
- **DynamoDB Integration:** Connection and configuration are centralized in the `DynamoDBConfig` class, providing Spring beans for both standard and enhanced DynamoDB clients.
- **AWS SDK v2:** Utilizes version 2.25.13.
- **Credentials:** Uses `DefaultCredentialsProvider` following AWS's standard credential chain.
- **Region:** Default is `eu-central-1`, configurable via properties.

## User Views & Navigation

| View | Source File | Main Functionality |
|------|-------------|-------------------|
| Home | `@index.tsx` | Car search and selection |
| Car Catalog | `book-a-car.tsx` | Vehicle listing and booking |
| My Bookings | `my-bookings.tsx` | User booking management |
| Locations | `locations.tsx` | Delegation map and management |
| Booking Details | `listCars/bookingCar/_idHashBookingCar.tsx` | Booking confirmation and details |

All views are React components with `ViewConfig` exports for routing and menu configuration.

Navigation is handled by a static menu structure, with routes for both user and admin sections.

## Build & Deployment
- **Frontend:** Built with Vite, with Hilla generating TypeScript clients from backend endpoints.
- **Backend:** Maven compiles and packages everything into a single deployable JAR.
- **Deployment:** Cloud-ready, supporting environment-based configuration and profiles for different stages.

## Conclusion
This architecture delivers a robust, scalable, and modern foundation for a car rental application, integrating best-in-class Java and JavaScript frameworks, a seamless user experience, and advanced administrative capabilities.
