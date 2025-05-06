# Modern Portfolio Website

A cutting-edge, interactive portfolio website built with Next.js, React, Framer Motion, and various modern web technologies to showcase projects, skills, and experiences in an engaging manner.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## 🔍 Overview

This portfolio website showcases professional projects, skills, and experience in an engaging and interactive manner. It features smooth animations, interactive components, and a modern design optimized for performance and user experience.

## ✨ Features

- **Responsive Design**: Fully responsive layout with Tailwind CSS
- **Smooth Animations**: Engaging animations powered by Framer Motion
- **Interactive Components**: Physics simulations, dad jokes generator, and other interactive elements
- **Project Showcase**: Detailed project pages with images, descriptions, and tech stack information
- **Modern UI**: Clean, minimalist design with thoughtful micro-interactions
- **Performance Optimized**: Fast load times and smooth experience even with complex animations
- **SEO Friendly**: Built with Next.js for optimal search engine optimization

## 🛠️ Tech Stack

```mermaid
graph TD
    A[Portfolio Website] --> B[Frontend]
    A --> C[Styling]
    A --> D[Animation]
    A --> E[Build Tools]
    
    B --> B1[Next.js]
    B --> B2[React]
    B --> B3[TypeScript]
    
    C --> C1[Tailwind CSS]
    C --> C2[SASS]
    
    D --> D1[Framer Motion]
    D --> D2[Matter.js]
    D --> D3[Custom Animations]
    
    E --> E1[npm/pnpm]
    E --> E2[ESLint]
    E --> E3[Prettier]
```

## 🏗️ Architecture

### High-Level Application Structure

```mermaid
graph TD
    A[App Root] --> B[Layout]
    B --> C[Home Page]
    B --> D[Project Detail Pages]
    C --> E[Components]
    D --> E
    E --> F[UI Components]
    E --> G[Interactive Components]
    E --> H[Section Components]
    
    subgraph "Data Flow"
        I[Constants] -.-> C
        I -.-> D
    end
```

### Component Structure

```mermaid
graph TD
    A[Home Page] --> B[Hero]
    A --> C[MakeAndBreak]
    A --> D[Intro]
    A --> E[Experience]
    A --> F[Projects]
    A --> G[Skills]
    A --> H[Hobbies]
    A --> I[Contact]
    A --> J[Footer]
    A --> K[Navbar]
    A --> L[Interactive Elements]
    
    L --> L1[DadJokes]
    L --> L2[PhysicsSimulation]
    L --> L3[String]
    
    F --> F1[Project Cards]
    F1 --> F2[Project Detail Pages]
    
    K --> K1[Navigation Links]
    K --> K2[Menu Toggle]
```

### Data and State Flow

```mermaid
flowchart TD
    A[Constants Module] -->|Project Data| B[Projects Component]
    A -->|Experience Data| C[Experience Component]
    A -->|Skills Data| D[Skills Component]
    A -->|Project Data| E[Project Detail Page]
    
    F[User Interaction] -->|Events| G[Interactive Components]
    G -->|State Updates| H[UI Updates]
    
    I[Animation Hooks] -->|Motion Effects| J[UI Components]
    K[Custom Hooks] -->|Functionality| J
```

## 📁 Project Structure

```mermaid
graph TD
    A[Root Directory] --> B[app/]
    A --> C[components/]
    A --> D[constants/]
    A --> E[public/]
    A --> F[Animation/]
    A --> G[hooks/]
    A --> H[lib/]
    
    B --> B1[layout.tsx]
    B --> B2[page.tsx]
    B --> B3[projects/]
    
    B3 --> B3a[[project_name]/]
    B3a --> B3a1[page.tsx]
    B3a --> B3a2[layout.tsx]
    
    C --> C1[UI Components]
    C --> C2[Section Components]
    C --> C3[Interactive Components]
    
    C1 --> C1a[Buttons.tsx]
    C1 --> C1b[Socials.tsx]
    C1 --> C1c[SlidingText.tsx]
    C1 --> C1d[Others...]
    
    C2 --> C2a[Hero.tsx]
    C2 --> C2b[Projects.tsx]
    C2 --> C2c[Experience.tsx]
    C2 --> C2d[Others...]
    
    C3 --> C3a[DadJokes.tsx]
    C3 --> C3b[PhysicsSimulation.tsx]
    C3 --> C3c[String.tsx]
    
    D --> D1[projects.ts]
    D --> D2[experiences.ts]
    D --> D3[skills.ts]
    D --> D4[hobbies.ts]
    
    F --> F1[Boop.js]
    F --> F2[Sparkel.js]
    F --> F3[framerAnimation/]
```

## 📊 Project Workflow

```mermaid
sequenceDiagram
    participant User
    participant Homepage
    participant ProjectsPage
    participant API
    
    User->>Homepage: Visit Site
    Homepage->>User: Display Home Content
    
    User->>Homepage: Scroll Through Sections
    Homepage->>User: Show Animations & Content
    
    User->>ProjectsPage: Click Project
    ProjectsPage->>API: Fetch Project Data
    API->>ProjectsPage: Return Project Details
    ProjectsPage->>User: Display Project Details
    
    User->>ProjectsPage: Interact With Components
    ProjectsPage->>User: Respond with Animations
```

## 🚀 Installation & Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/portfolio.git
cd portfolio
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Run the development server
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 💡 Usage

### Customizing Content

1. Edit project data in `constants/projects.ts`
2. Update experience information in `constants/experiences.ts`
3. Modify skills in `constants/skills.ts`
4. Change personal information as needed throughout the components

### Adding New Projects

Add new project entries to the projects array in `constants/projects.ts`:

```typescript
{
  id: 'project-id',
  title: 'Project Title',
  metadata: ['Category'],
  cover_image: projectImage,
  screenshots: [screenshot1, screenshot2],
  description: 'Project description',
  url: '/projects/project-id',
  features: [
    'Feature 1',
    'Feature 2',
  ],
  skills: {
    Frontend: ['Technology 1', 'Technology 2'],
    Backend: ['Technology 3', 'Technology 4'],
  },
  liveLink: 'https://project-link.com',
  codeLink: 'https://github.com/username/project',
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
