# Abhijeet Raut
**Lead Backend & AI/ML Engineer | Solutions Architect**  
Pune, India • theabhijeetraut@gmail.com • [GitHub: github.com/theabhijeetraut](https://github.com/theabhijeetraut) • [Portfolio Monorepo](https://github.com/theabhijeetraut/All-Projects)

---

## Executive Summary

> 📌 **Portfolio Monorepo Synchronization**: Verified up to date with repository on `2026-09-26 15:20 UTC` • Presubmit Suite Clean

Accomplished **Lead Software Engineer and Solutions Architect** with **12 years of hands-on experience** architecting high-concurrency backend services, distributed systems, and modern AI/ML solutions. 
- **3 years at Persistent Systems** driving enterprise AI adoption, autonomous agent architectures (Google ADK, LangChain), and cloud-native microservice backends.
- **9 years at Cybage Software** designing scalable enterprise platforms, Django/Wagtail CMS ecosystems, and RESTful/event-driven API architectures.
- Expert in **Python, FastAPI, Django, Go, Machine Learning / Agentic AI orchestration, Retrieval-Augmented Generation (RAG), Docker containerization**, and database performance engineering. Proven track record of guiding cross-functional engineering teams from concept to production deployment.

---

## Technical Competencies

| Domain | Technologies & Frameworks |
| :--- | :--- |
| **AI / ML & Agentic Systems** | Autonomous Agents (Google ADK, LangGraph, CrewAI), LLM Orchestration (Gemini, Claude, GPT), RAG Architectures, Vector Databases (ChromaDB, Pinecone, pgvector), Tool Calling, Embeddings, Prompt Engineering |
| **Backend & Microservices** | Python (Expert), Go, Django & Django REST Framework (DRF), FastAPI, Flask, Wagtail CMS, GraphQL, Celery, Redis, RabbitMQ |
| **Cloud & DevOps** | Docker, Docker Compose, Kubernetes, CI/CD Pipelines (GitHub Actions, Jenkins), AWS (EC2, S3, RDS, Lambda), Linux Server Administration |
| **Databases & Data Modeling** | PostgreSQL, SQLite, MySQL, Redis, MongoDB, Schema Migrations, Query Optimization, Connection Pooling |
| **Frontend & Web Extensions** | Angular, JavaScript (ES6+), TypeScript, Tailwind CSS, HTML5, Chrome Extensions API (Manifest V3) |
| **Architecture & Leadership** | Distributed System Design, RESTful API Design, Microservices, Domain-Driven Design (DDD), Agile/Scrum Leadership, Technical Mentorship |

---

## Professional Experience

### **Persistent Systems** | Pune, India
**Lead Software Engineer / AI & Backend Architect**  
*2023 – Present (3 Years)*

* Architected and deployed enterprise-grade **Autonomous AI Agent workflows** and **RAG-powered conversational pipelines** leveraging the Google Agent Development Kit (ADK) and modern LLM APIs, reducing operational query resolution times by 45%.
* Designed scalable, fault-tolerant backend services in **Python (FastAPI, Django)** and **Go**, handling high-throughput asynchronous payloads with Redis caching and message queues.
* Spearheaded the containerization and CI/CD modernization initiative across development teams, standardizing **Docker Compose** multi-stage builds and automated testing workflows.
* Conducted system architecture reviews, data security governance for LLM integrations, and optimized vector index retrieval strategies to achieve sub-120ms retrieval latencies.
* Mentored a team of 10+ software engineers across backend design patterns, clean code principles, and production AI engineering best practices.

### **Cybage Software** | Pune, India
**Technical Lead & Senior Software Engineer**  
*2014 – 2023 (9 Years)*

* Led end-to-end architecture and implementation of large-scale enterprise web applications and content management platforms using **Python, Django, and Wagtail CMS**, serving millions of monthly active users.
* Engineered secure, scalable RESTful API backends integrated with modern frontend single-page applications (**Angular, React**) and third-party enterprise integrations.
* Designed and optimized relational database schemas (**PostgreSQL, MySQL**) with advanced indexing, caching layers, and database sharding techniques, cutting query execution bottlenecks by up to 60%.
* Championed DevOps adoption across multiple client accounts: established containerized staging/production environments with Docker, automated deployment pipelines, and environment configuration management.
* Promoted through sequential engineering tiers (Software Engineer → Senior Software Engineer → Technical Lead) based on consistent delivery of high-complexity client solutions, technical rigor, and client stakeholder satisfaction.

---

## Featured Engineering Projects

### **1. ARNAS: Enterprise Distributed Cloud NAS & Zero-Knowledge E2EE Mobile Sync** ⚡ *(Active Architecture / Recently Updated)*
*Repository*: [`apps/arnas/`](https://github.com/theabhijeetraut/All-Projects/tree/main/apps/arnas)  
*Tech Stack*: Fastify (Node.js/TypeScript), React Native / Expo, PostgreSQL, Prisma ORM, Docker Compose, AWS S3 / MinIO, AES-256-GCM, PBKDF2
* Architected a distributed, self-hosted enterprise cloud storage platform featuring multi-server storage clustering (local NVMe/NAS disks + S3-compatible object stores like MinIO, AWS S3, and Cloudflare R2).
* Engineered an instant ingest pipeline with asynchronous fan-out replication queue, SHA-256 checksum verification, and automatic read failover routing to secondary mirrors upon primary node degradation.
* Designed a client-side Zero-Knowledge End-to-End Encryption (E2EE) cryptographic suite utilizing AES-256-GCM, 100,000-iteration PBKDF2 key derivation, and a 12-word recovery mnemonic.
* Built an intelligent mobile Sentinel background sync engine adhering to adaptive battery thresholds and Wi-Fi policies, complete with an interactive onboarding walkthrough tutorial and compliance audit logging.

### **2. Autonomous AI Agent Orchestration Framework (MyAgents)** ⚡ *(Active Architecture / Recently Updated)*
*Repository*: [`agents/myagents/`](https://github.com/theabhijeetraut/All-Projects/tree/main/agents/myagents)  
*Tech Stack*: Python, FastAPI, Google ADK (Agent Development Kit), In-Memory Vector Store RAG, Docker, Google Cloud Run, Uvicorn, SSE
* Architected an enterprise-grade multi-agent swarm platform featuring autonomous task decomposition into a topological Directed Acyclic Graph (DAG), coordinating 5 specialized agents (Nexus Commander, Scout Intelligence, Vanguard Architect, Sentinel Auditor, Aegis Synthesizer).
* Engineered a dual-engine LLM adapter providing 100% zero-key offline reasoning simulation alongside native Google Gemini 1.5 Pro/Flash live API integration.
* Implemented an in-memory TF-IDF semantic vector store for RAG grounding, deterministic tool execution (capacity calculators, syntax checkers, Mermaid diagrams), and blackboard shared memory state retention.
* Designed a real-time Server-Sent Events (SSE) telemetry web UI with interactive DAG graph visualization and an automated **Executive Presentation Slide Deck Generator** with 1-click GCP Cloud Run deployment.

### **3. Link Inspector Pro & Broken Link Checker (Chrome Manifest V3)**
*Repository*: [`extensions/link-inspector-extension/`](https://github.com/theabhijeetraut/All-Projects/tree/main/extensions/link-inspector-extension)  
*Tech Stack*: JavaScript (ES6+), Chrome Extension APIs (Manifest V3), Service Workers, CSS3
* Engineered a real-time browser link auditor featuring async concurrent HTTP validation, redirect destination tracking (`301/302`), and live latency telemetry.
* Integrated intelligent utilities: automated marketing tracking stripper (`utm_*`, `fbclid`, `gclid`), 1-click **Wayback Machine** historical snapshot recovery for 404/500 errors, and dual **CSV/JSON** structured audit exports.
* Built with zero external dependencies and strict asynchronous message routing between Content Scripts and Service Workers.

### **4. Diagram & Image Lens Pro: Precision Visual Inspection (Chrome Manifest V3)**
*Repository*: [`extensions/diagram-image-lens/`](https://github.com/theabhijeetraut/All-Projects/tree/main/extensions/diagram-image-lens)  
*Tech Stack*: JavaScript (ES6+), Manifest V3, HTML5 Canvas, CSS3
* Engineered a high-magnification blueprint and architecture diagram lens featuring an interactive hover loupe (2x–16x zoom), fullscreen deep-zoom pan & scan lightbox, schematic dark mode inversion, and direct PNG clipboard export.
* Built an in-browser Retina area screen capture tool operating entirely offline without external libraries or tracking.

### **5. Anti-Gravity Web: 2D Physics Engine & Arcade Browser (Chrome Manifest V3)**
*Repository*: [`extensions/anti-gravity-browser/`](https://github.com/theabhijeetraut/All-Projects/tree/main/extensions/anti-gravity-browser)  
*Tech Stack*: JavaScript (ES6+), Chrome Manifest V3, Matter.js Physics Engine, HTML5 Canvas, CSS Transforms
* Engineered an interactive extension that extracts webpage DOM structures non-destructively into an isolated 60 FPS 2D rigid-body physics simulation.
* Implemented invertible directional gravity, tractor beam mouse manipulation, and integrated arcade mini-games (*Asteroids Web Blaster* and *Orbital Katamari Web Absorption*).

### **6. Flashapps Fullstack Platform & Containerized Architecture**
*Repository*: [`apps/flashapps/`](https://github.com/theabhijeetraut/All-Projects/tree/main/apps/flashapps) & [`devops/docker/`](https://github.com/theabhijeetraut/All-Projects/tree/main/devops/docker)  
*Tech Stack*: Django REST Framework, Angular, Docker Compose, SQLite, Gunicorn, Nginx
* Developed a microservice-ready web application pairing a decoupled Django REST API backend with a high-performance Angular single-page application.
* Engineered complete Docker Compose orchestration with hot-reloading dev environments, persistent volume mounting, and isolated multi-container networking.

### **7. Wagtailwind & Mytail: Enterprise Wagtail CMS Architectures**
*Repository*: [`apps/wagtailwind/`](https://github.com/theabhijeetraut/All-Projects/tree/main/apps/wagtailwind) & [`apps/mytail/`](https://github.com/theabhijeetraut/All-Projects/tree/main/apps/mytail)  
*Tech Stack*: Python, Django, Wagtail CMS, Tailwind CSS, SCSS, Docker
* Designed modern content platforms leveraging Wagtail CMS with Tailwind CSS design systems, supporting custom page trees, streamfields, dynamic image generation, and multi-app blog/account architectures.
* Implemented query caching and static asset pipelines to deliver sub-second page rendering.

---


### **8. Wagtail Demo: Modular Django Extension Framework**
*Repository*: [`apps/wagtaildemo/`](https://github.com/theabhijeetraut/All-Projects/tree/main/apps/wagtaildemo)  
*Tech Stack*: Python, Django, Wagtail CMS
* Specialized Django and Wagtail extension modules demonstrating custom model structures, streamfields, and decoupled service integrations.

---

## Education

* **Bachelor of Engineering (B.E.) in Computer Engineering**  
  *University of Pune, India*

---

## Key Achievements & Highlights

* **12 Years of Continuous Impact**: Delivered enterprise solutions for Fortune 500 clients spanning media, healthcare, and enterprise software.
* **AI Transformation**: Early adopter and practitioner of autonomous agentic workflows, LLM prompt chaining, and RAG pipelines in production enterprise contexts.
* **Engineering Mentorship**: Mentored and onboarded 30+ engineers throughout career; organized technical brownbags on Python concurrency, Django optimization, and AI tooling.
