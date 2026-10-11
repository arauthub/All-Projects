/**
 * Nexus Prime - Developer Profile & Career Dataset
 * Curated from PROFILE.md and CV_Abhijeet_Raut.md (Abhijeet Raut)
 */

export const PROFILE_DATA = {
  name: "Abhijeet Raut",
  headline: "Lead Backend & AI/ML Engineer | Solutions Architect",
  location: "Pune, India",
  email: "theabhijeetraut@gmail.com",
  github: "https://github.com/arauthub",
  githubUsername: "arauthub",
  portfolioRepo: "https://github.com/arauthub/portfolio",
  profilePhoto: "assets/profile-photo.png",
  ogImage: "assets/og-image.png",
  yearsOfExperience: 12,
  summary: "Accomplished Lead Software Engineer and Solutions Architect with 12 years of hands-on experience architecting high-concurrency backend services, distributed systems, and modern AI/ML solutions (Persistent Systems & Cybage Software). Proven track record of guiding cross-functional engineering teams from concept to production deployment.",
  
  careerStats: [
    { label: "Industry Experience", value: "12 Years", sub: "Enterprise & Scale" },
    { label: "Active Monorepo Systems", value: "11+", sub: "Decoupled Architectures" },
    { label: "Engineers Mentored", value: "30+", sub: "Leadership & Coaching" },
    { label: "Presubmit Cleanliness", value: "100%", sub: "Automated Security" }
  ],

  workExperience: [
    {
      company: "Persistent Systems",
      role: "Lead Software Engineer / AI & Backend Architect",
      period: "2023 – Present (3 Years)",
      location: "Pune, India",
      badge: "Current Role",
      highlights: [
        "Architected and deployed enterprise-grade Autonomous AI Agent workflows and RAG-powered conversational pipelines leveraging Google Agent Development Kit (ADK) and modern LLM APIs, reducing operational query resolution times by 45%.",
        "Designed scalable, fault-tolerant backend services in Python (FastAPI, Django) and Go, handling high-throughput asynchronous payloads with Redis caching and message queues.",
        "Spearheaded containerization and CI/CD modernization across development teams, standardizing Docker Compose multi-stage builds and automated testing workflows.",
        "Conducted system architecture reviews, data security governance for LLM integrations, and optimized vector index retrieval strategies to achieve sub-120ms retrieval latencies.",
        "Mentored a team of 10+ software engineers across backend design patterns, clean code principles, and production AI engineering best practices."
      ]
    },
    {
      company: "Cybage Software",
      role: "Technical Lead & Senior Software Engineer",
      period: "2014 – 2023 (9 Years)",
      location: "Pune, India",
      badge: "9 Years",
      highlights: [
        "Led end-to-end architecture and implementation of large-scale enterprise web applications and content management platforms using Python, Django, and Wagtail CMS, serving millions of monthly active users.",
        "Engineered secure, scalable RESTful API backends integrated with modern frontend single-page applications (Angular, React) and third-party enterprise integrations.",
        "Designed and optimized relational database schemas (PostgreSQL, MySQL) with advanced indexing, caching layers, and database sharding techniques, cutting query execution bottlenecks by up to 60%.",
        "Championed DevOps adoption across multiple client accounts: established containerized staging/production environments with Docker, automated deployment pipelines, and environment configuration management.",
        "Promoted through sequential engineering tiers (Software Engineer → Senior Software Engineer → Technical Lead) based on consistent delivery of high-complexity client solutions."
      ]
    }
  ],

  education: {
    degree: "Bachelor of Engineering (B.E.) in Computer Engineering",
    institution: "University of Pune, India",
    period: "2010 – 2014"
  },

  skillsArsenal: [
    {
      category: "AI / ML & Agentic Systems",
      icon: "🤖",
      skills: [
        { name: "Autonomous Multi-Agent Swarms (Google ADK, LangGraph)", level: 95 },
        { name: "Retrieval-Augmented Generation (RAG) & Vector DBs", level: 92 },
        { name: "LLM Orchestration (Gemini, Claude, GPT)", level: 95 },
        { name: "Vector Databases (ChromaDB, Pinecone, pgvector)", level: 88 },
        { name: "Semantic Search, Tool Calling & Prompt Engineering", level: 94 }
      ]
    },
    {
      category: "Backend & Distributed Systems",
      icon: "⚡",
      skills: [
        { name: "Python (FastAPI, Django, Flask, Asyncio)", level: 98 },
        { name: "Go (Golang Microservices & Concurrency)", level: 86 },
        { name: "Django REST Framework (DRF) & GraphQL", level: 96 },
        { name: "Wagtail CMS Enterprise Architectures", level: 95 },
        { name: "Asynchronous Queues (Celery, Redis, RabbitMQ)", level: 90 }
      ]
    },
    {
      category: "Cloud, DevOps & Security",
      icon: "🛡️",
      skills: [
        { name: "Docker & Multi-Container Compose Topologies", level: 92 },
        { name: "CI/CD Automation (GitHub Actions, Jenkins)", level: 90 },
        { name: "Kubernetes & Google Cloud Run", level: 85 },
        { name: "Zero-Knowledge Encryption (AES-256-GCM, PBKDF2)", level: 92 },
        { name: "Presubmit Automated Secret Scanning", level: 96 }
      ]
    },
    {
      category: "Databases & Data Modeling",
      icon: "💾",
      skills: [
        { name: "PostgreSQL Schema Tuning & Query Profiling", level: 94 },
        { name: "Redis In-Memory Caching & Pub/Sub", level: 92 },
        { name: "Prisma ORM & SQLite", level: 90 },
        { name: "Database Sharding & Connection Pooling", level: 88 }
      ]
    },
    {
      category: "Frontend, DevTools & Web Extensions",
      icon: "🌐",
      skills: [
        { name: "Chrome Manifest V3 Extension APIs", level: 95 },
        { name: "Matter.js 2D Rigid-Body Physics Engine", level: 90 },
        { name: "Modern ES6+ / TypeScript & Web Audio API", level: 92 },
        { name: "HTML5 Canvas & Glassmorphic CSS Systems", level: 94 },
        { name: "Angular Single Page Applications", level: 88 }
      ]
    }
  ]
};
