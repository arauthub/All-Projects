# ⚡ FlashApps Frontend — Angular 21 Single Page Application

> High-performance client-side Single Page Application (SPA) built with **Angular 21**, **TypeScript**, and **TailwindCSS**, acting as the decoupled presentation layer for the **FlashApps Django REST Framework** backend.

[![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-2.0+-FCC72B?style=for-the-badge&logo=vitest&logoColor=black)](https://vitest.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](../../../LICENSE)

---

## 🌟 Overview & Key Features

- **Decoupled Architecture**: Designed to interface directly with the FlashApps Django backend (`http://localhost:8000/api/`) via token-authenticated HTTP interceptors.
- **Modern Angular 21 Architecture**: Utilizes standalone components, Angular Signals for reactive state management, and optimized hydration pipelines.
- **Fast Testing**: Powered by Vitest for instantaneous unit test feedback.
- **Responsive Design**: Mobile-first design system styled with TailwindCSS utilities.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+
- Angular CLI (`npm install -g @angular/cli`)

### 2. Installation
```bash
# Navigate to frontend directory
cd apps/flashapps/frontend

# Install dependencies
npm install
```

### 3. Start Development Server
```bash
ng serve
```

Navigate to **`http://localhost:4200/`**. The app automatically reloads when you modify source files.

---

## 🏗️ Build & Production Deployment

To compile the application for production:

```bash
ng build
```

Compiled production artifacts are emitted to the `dist/` directory, optimized with minification, tree-shaking, and differential chunking.

---

## 🧪 Testing Suite

Execute unit tests with Vitest:

```bash
ng test
```

---

## 👤 Author

**Abhijeet Raut**
- GitHub: [@arauthub](https://github.com/arauthub)
- Email: theabhijeetraut@gmail.com
- Monorepo: [arauthub/All-Projects](https://github.com/arauthub/All-Projects)

---

## 📄 License

This project is licensed under the [MIT License](../../../LICENSE).
