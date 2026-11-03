export type ProjectMedia = { src: string; alt: string };
export type Project = {
  slug: string;
  title: string;
  year?: string;
  role: string;
  stack: string[];
  summary: string;
  contributions: string[];
  color: string;
  ink: string;
  illustration: "orb" | "terrain" | "type";
  status: "placeholder" | "draft" | "ready";
  previewCopy: { firstLine: string; emphasis: string };
  url?: string;
  repositoryUrl?: string;
  repositories?: { label: string; url: string }[];
  thumbnail?: ProjectMedia;
  desktop?: ProjectMedia;
  mobile?: ProjectMedia;
  tablet?: ProjectMedia;
  comparison?: ProjectMedia;
  sections: { title: string; body: string; media?: ProjectMedia }[];
};

// Projects/links come from content-test@9471953. Profile and employment are
// updated from the two latest résumés supplied by Sufyaan in this chat.
export const portfolio = {
  name: "Sufyaan Khateeb",
  shortName: "Sufyaan",
  title: "Software engineer",
  headline: { firstLine: "I build software", secondLine: "for a", emphasis: "better future." },
  biography: "I’m a software engineer building reliable backend systems and data pipelines with Python, Java and Go. From event-driven orchestration to thoughtful interfaces, I connect the pieces that make software work.",
  availability: "Let’s talk about what we can build together.",
  email: "sufyaankhateeb@gmail.com",
  socials: [
    { label: "GitHub", url: "https://github.com/SufyaanKhateeb" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/sufyaan-khateeb-0aba27208" },
  ],
  resume: {
    url: "/resume/Sufyaan_resume_fullstack.pdf", label: "Résumé", date: "September 2026",
    variants: {
      fullstack: {
        label: "Software engineering", route: "/resume", url: "/resume/Sufyaan_resume_fullstack.pdf",
        filename: "Sufyaan_resume_fullstack.pdf",
        pages: [
          { src: "/resume/fullstack-1.jpg", alt: "Software engineering résumé page 1: backend summary and Wells Fargo and CAST Software experience" },
          { src: "/resume/fullstack-2.jpg", alt: "Software engineering résumé page 2: technical skills and education" },
        ],
      },
      data: {
        label: "Data engineering", route: "/resume/data", url: "/resume/Sufyaan_resume_data.pdf",
        filename: "Sufyaan_resume_data.pdf",
        pages: [{ src: "/resume/data-1.jpg", alt: "Data engineering résumé: summary, Wells Fargo and CAST Software experience, technical skills and education" }],
      },
    },
  },
  experience: [
    {
      role: "Software Engineer", company: "Wells Fargo", period: "June 2025 – Present",
      summary: "Building reliable backend orchestration and event-driven data pipelines, with AI-assisted tooling to automate complex migrations.",
      contributions: [
        "Designed an orchestration platform with AI-driven assistants, reducing manual developer effort for new data ingestions by 95%.",
        "Built Kafka-backed pipelines and optimized BigQuery partitioning and clustering, cutting query spend by 99%.",
        "Added source/destination configuration, SQL templating and validation to onboard data sources 4× faster.",
        "Implemented monitoring, alerting and automated remediation, bringing critical incident resolution from days to hours.",
      ],
    },
    {
      role: "Junior Full Stack Software Engineer", company: "CAST Software", period: "September 2023 – June 2025",
      summary: "Worked across enterprise authentication, API gateways, distributed scheduling and product interfaces.",
      contributions: [
        "Led SSO/OAuth2 integration across microservices and engineered gateway work that reduced end-to-end API latency by 40%.",
        "Contributed retry and circuit-breaker patterns to a distributed job scheduler, raising successful completion rates by 30–40%.",
        "Unified product frontends and documented secure Docker/Kubernetes deployment patterns.",
      ],
    },
    {
      role: "Software Engineering Intern", company: "CAST Software", period: "January 2023 – August 2023",
      summary: "Built tools to support backend performance and everyday developer workflows.",
      contributions: [
        "Built a multithreaded log parser.",
        "Developed a VS Code extension to automate CI workflows.",
      ],
    },
  ],
  skills: [
    { label: "Backend", items: ["Python", "Java", "Go", "Spring Boot", "Node.js", "REST APIs"] },
    { label: "Data & systems", items: ["SQL", "Kafka", "Airflow", "BigQuery", "PostgreSQL", "Distributed systems"] },
    { label: "Cloud & delivery", items: ["AWS", "GCP", "Docker", "Kubernetes", "Jenkins", "GitHub Actions"] },
    { label: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  ],
  education: { degree: "B.E. in Information Science", institution: "M.S. Ramaiah Institute of Technology", period: "2019–2023" },
  dialogue: {
    welcome: "Hi, I’m Sufyaan. Scroll down and I’ll show you around.",
    returning: "Hey, you’re back! Ready for another look?",
    intro: "Interfaces, services, and the connections between them.",
    work: "A few things I’ve been building.",
    contact: "Have something in mind? Let’s talk.",
    error: "Something’s missing. My accessories, too!",
  },
};

export const projects: Project[] = [
  {
    slug: "placement-app", title: "Placement App", role: "Full-stack development",
    stack: ["React", "Golang", "Zustand", "REST APIs", "Authentication"],
    color: "#173344", ink: "#f8f9f2", illustration: "orb", status: "draft",
    previewCopy: { firstLine: "Your next", emphasis: "opportunity." },
    summary: "A full-stack placement portal bringing student dashboards and backend services together around the job application flow.",
    contributions: [
      "Built frontend dashboards and backend services for the placement portal.",
      "Connected the application through REST APIs and authentication.",
    ],
    repositories: [
      { label: "Frontend", url: "https://github.com/sufyaankhateeb/placement-app-ui" },
      { label: "Backend", url: "https://github.com/sufyaankhateeb/placement-app-api" },
    ],
    sections: [
      { title: "Bringing the process together", body: "The placement portal supports students through the job application flow, bringing the frontend experience and backend services into one application." },
      { title: "Across the stack", body: "I worked on both frontend dashboards and backend services. The interface uses React and Zustand, with Golang services, REST APIs and authentication forming the backend foundation." },
    ],
  },
  {
    slug: "real-time-chat", title: "Real-Time Chat App", role: "Full-stack development",
    stack: ["React", "Node.js", "Express", "WebSocket"],
    color: "#bca8eb", ink: "#121212", illustration: "terrain", status: "draft",
    previewCopy: { firstLine: "A little", emphasis: "connection." },
    url: "https://chat-app.sufyaankhateeb.site/",
    repositoryUrl: "https://github.com/SufyaanKhateeb/chat-app",
    summary: "A real-time chat application combining a React interface with custom authentication and socket-based communication.",
    contributions: [
      "Developed the frontend and backend for a real-time chat application.",
      "Implemented custom authentication and socket-based communication.",
    ],
    sections: [
      { title: "Built around conversation", body: "This project brings together a React interface and real-time communication, with a Node.js and Express backend." },
      { title: "Under the surface", body: "Custom authentication and WebSocket communication underpin the application. The public repository contains the implementation, and the live link points to the original deployment." },
    ],
  },
  {
    slug: "portfolio", title: "Personal Portfolio", role: "Design & development",
    stack: ["Next.js", "React", "TypeScript", "GSAP", "Three.js"],
    color: "#fae767", ink: "#121212", illustration: "type", status: "ready",
    previewCopy: { firstLine: "Ideas,", emphasis: "in motion." },
    repositoryUrl: "https://github.com/SufyaanKhateeb/case-up",
    thumbnail: { src: "/projects/portfolio/desktop.jpg", alt: "The latest portfolio homepage with blue grid, oversized headline and custom 3D character" },
    desktop: { src: "/projects/portfolio/desktop.jpg", alt: "Desktop view of Sufyaan’s portfolio homepage" },
    mobile: { src: "/projects/portfolio/mobile.jpg", alt: "Mobile view of Sufyaan’s portfolio homepage" },
    summary: "My personal space on the web: an evolving portfolio built around expressive typography, scroll-driven storytelling and a playful interactive character.",
    contributions: [
      "Built a responsive portfolio with Next.js, React and TypeScript.",
      "Added scroll-driven animation, project case studies and local interactive previews.",
      "Integrated a custom textured 3D character with articulated arms, a shooting-star sweatshirt and interactive accessories.",
    ],
    sections: [
      { title: "A place for my work", body: "This portfolio brings my projects, experience and contact details into one place. The latest version takes its visual and interaction direction from sebg.ch, adapted with my writing and shooting-star identity." },
      { title: "Personality through interaction", body: "Native document scrolling and GSAP coordinate the project chapters. A custom textured Three.js character moves through the page with articulated arms, HTML narration, optional sound, playful tricks and a matching fallback portrait." },
      { title: "Built to adapt", body: "Project records and narration live in typed local content modules. Responsive layouts, keyboard alternatives and reduced-motion support keep the work accessible across different screens and preferences." },
    ],
  },
];

// Stable scene IDs preserve choreography while project URLs reflect the real work.
export const scenes = projects.slice(0, 3).map((project, index) => ({
  id: `project-${["one", "two", "three"][index]}`,
  projectSlug: project.slug,
  side: index === 1 ? "right" : "left",
  demo: (["compare", "scratch", "variants"] as const)[index],
  dialogue: [
    ["First up: a placement portal built across the stack.", "React on the frontend. Golang behind the scenes.", "These are illustrative views. The code is one click away."],
    ["Next, a real-time chat application.", "Custom authentication meets socket-based communication.", "Scratch to reveal the preview, then explore the project."],
    ["And this is my own little corner of the web.", "Typography, motion, and a character with a few tricks.", "Switch the views to explore the responsive layout."],
  ][index],
}));

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getNextProject(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  return index < 0 ? undefined : projects[(index + 1) % projects.length];
}
