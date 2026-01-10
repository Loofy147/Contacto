# Contacto: The All-in-One Digital Ecosystem for Algerian Businesses

**Contacto is a comprehensive platform designed to empower Algerian businesses and professionals with a suite of digital tools, including a professional directory, an API-first POS system, and a complete financial services layer.**

This repository contains the source code for the Contacto platform, which is currently undergoing a significant architectural migration to a state-of-the-art, event-driven microservices architecture. This strategic shift will ensure the platform is scalable, resilient, and secure, in full compliance with Algerian data sovereignty laws (Law 18-07) and international standards such as PCI-DSS.

## New Architecture Overview

The platform is being re-architected into a distributed system of microservices, orchestrated via an API Gateway and communicating through an event bus (Kafka). This new architecture is designed for:

- **High Scalability:** Each service can be scaled independently to meet demand.
- **Improved Resilience:** Failure in one service will not cascade to the entire system.
- **Enhanced Security:** A defense-in-depth security model is being implemented at every layer.
- **Technology Flexibility:** Each microservice can be developed and deployed with the best technology for the job.

For a detailed explanation of the new architecture, please see the [Technical Architecture Document](docs/architecture/technical_architecture.md).

## Repository Structure

This repository is a monorepo, organized as follows:

- **`backend/`**: Contains the source code for all back-end microservices and the API Gateway.
  - **`backend/api-gateway/`**: The entry point for all API requests.
  - **`backend/services/`**: Individual microservices, such as `identity`, `payments`, `professionals`, etc.
- **`frontend/`**: The Next.js web application.
- **`mobile/`**: The React Native mobile application for iOS and Android.
- **`docs/`**: Contains all project documentation, including:
  - **`docs/analysis/`**: Critical analysis of the project, including market research and risk assessment.
  - **`docs/architecture/`**: Detailed technical architecture of the platform.
  - **`docs/roadmap/`**: The product and technical roadmap.

## Project Roadmap

The project is being developed in four distinct phases over a 36-month timeline:

1.  **Phase 1: Directory Platform (Months 1-6)**
2.  **Phase 2: API POS Infrastructure (Months 7-12)**
3.  **Phase 3: Financial Layer (Months 13-24)**
4.  **Phase 4: Government Integration (Months 25-36)**

For a detailed month-by-month breakdown of the roadmap, please see the [Project Roadmap Document](docs/roadmap/roadmap.md).

## Getting Started

*Coming soon: Instructions for setting up the development environment.*

---
*This project is being developed with a commitment to technical excellence, security, and compliance. For any questions, please refer to the detailed documentation in the `docs` directory.*
