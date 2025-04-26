"use client";
import ScrollHeader from "@/components/scroll-header";
import PageLoader from "./pageLoader";
import Image from "next/image";
// import img1 from "@/public/max-bender-1zFK0pkHo9w-unsplash.jpg";
import img2 from "@/public/melyna-cote-rLWHLNQFQL8-unsplash.jpg";
import { Noto_Sans } from "next/font/google";
import { useEffect, useRef, useState } from "react";
// import styles from "./page.module.css";
// import ScrollPathAnimated from "@/components/scroll-path-animated";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";

const noto = Noto_Sans({ subsets: ["latin"] });

const formSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long").max(30, "Name must be at most 30 characters long"),
    email: z.string().email("Invalid email address").optional(),
    message: z.string().min(1, "Message cannot be empty").max(500, "Message must be at most 500 characters long"),
});

// Define a type for form errors
interface FormErrors {
    name?: string;
    email?: string;
    message?: string;
}

export default function Home() {
    const workSectionRef = useRef<any>(null);
    const aboutSectionRef = useRef<any>(null);
    const contactSectionRef = useRef<any>(null);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const LocomotiveScroll = (await import("locomotive-scroll")).default;
            const locomotiveScroll = new LocomotiveScroll();
        })();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsLoading(true);

        const form = e.target as HTMLFormElement; // Cast e.target to HTMLFormElement
        const formElements = form.elements as HTMLFormControlsCollection;
        const formData = {
            name: (formElements.namedItem("name") as HTMLInputElement).value,
            email: (formElements.namedItem("email") as HTMLInputElement)?.value || undefined, // Handle optional email
            message: (formElements.namedItem("message") as HTMLTextAreaElement).value,
        };

        const validation = formSchema.safeParse(formData);

        if (!validation.success) {
            const errors = validation.error.errors.reduce((acc: FormErrors, error) => {
                acc[error.path[0] as keyof FormErrors] = error.message;
                return acc;
            }, {});
            setFormErrors(errors);
            setIsLoading(false);
            return;
        }

        setFormErrors({});

        try {
            const response = await fetch("/api", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setFormSubmitted(true);
            } else {
                const errorData = await response.json();
                console.error("Error submitting form:", errorData.message);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full h-full overflow-x-hidden">
            <PageLoader />
            <div className="w-screen h-screen -z-10 fixed top-0 left-0 flex">
                <section className="h-full border-l border-dim_gray ml-[2vw]" />
                <section className="h-full border-l border-dim_gray ml-[2vw]" />
                <section className="h-full border-l border-dim_gray ml-[2vw]" />
                <section className="h-full border-l border-dim_gray ml-[2vw]" />
                <section className="h-full border-l border-dim_gray ml-[2vw]" />
                <section className="h-full border-l border-dim_gray ml-[2vw]" />
                <section className="h-full border-l border-dim_gray ml-[2vw]" />
                <section className="h-full border-l border-dim_gray ml-auto mr-[2vw]" />
            </div>
            {/* <ScrollPathAnimated /> */}
            <div className="h-screen w-[94%] mx-auto flex flex-col">
                <ScrollHeader workRef={workSectionRef} aboutRef={aboutSectionRef} contactRef={contactSectionRef} />
                <section
                    id="website-greetings-section"
                    className="relative top-[50px] opacity-0 flex flex-col md:flex-row gap-[2rem] md:gap-0 pt-5 md:pt-12 pl-[16vw] md:pl-[30px]"
                >
                    <div
                        className={`${noto.className} flex flex-col md:text-6xl lg:text-7xl text-2xl uppercase md:pl-[30px] font-bold text-foreground whitespace-pre-line`}
                    >
                        <p>PERSONAL</p>
                        <p>PORTFOLIO</p>
                    </div>
                    <div
                        className={`${noto.className} uppercase whitespace-pre-line w-[90%] !italic md:pl-[90px] text-sm md:text-xl lg:text-2xl font-light`}
                    >
                        <p className="py-2 md:py-2 text-xs md:text-sm not-italic uppercase font-semibold">CURRENTLY:</p>
                        <p className="mb-[1rem] md:mb-[2rem]">
                            {'Hacking software solutions to make real impact while witnessing the "A.I. revolution".'}
                        </p>
                        <p>Building for a better future.</p>
                    </div>
                </section>
            </div>
            <div className="m-2" />

            <div ref={workSectionRef} id="work-section" className="flex items-center justify-center py-4 mt-10 relative w-[94%] mx-auto">
                <div className="bg-[hsl(0,0%,20%)] shadow-lg rounded-lg p-8 max-w-4xl w-full">
                    <h2 className="text-3xl font-bold text-center text-[hsl(199,18%,82%)] mb-6">_Selected_Work</h2>
                    <div className="work-details">
                        <h3 className="text-2xl font-semibold text-[hsl(199,18%,82%)] mb-4 border-t pt-2 border-dim_gray">Professional Experience</h3>
                        <div className="experience-item mb-6">
                            <h4 className="text-xl font-semibold text-[hsl(199,18%,82%)]">Junior Full Stack Engineer</h4>
                            <p className="text-sm text-[hsl(199,18%,82%)]">CAST Software | Sep 2023 - Present</p>
                            <ul className="list-disc list-inside text-sm text-[hsl(199,18%,82%)] mt-2">
                                <li>Developed a microservices-based unified platform to integrate CAST products under one UI.</li>
                                <li>Created dashboards, admin views, and secure auth flows using React, Spring Boot, and OAuth2.</li>
                                <li>
                                    Collaborated with backend teams to implement caching and compression,{" "}
                                    <span className="text-violet-500">reducing UI load times by 75%</span>.
                                </li>
                                <li>Supported enterprise delivery for high-profile clients including Google Cloud, US Army, and US Air Force.</li>
                            </ul>
                        </div>
                        <div className="experience-item mb-6">
                            <h4 className="text-xl font-semibold text-[hsl(199,18%,82%)]">Software Engineering Intern</h4>
                            <p className="text-sm text-[hsl(199,18%,82%)]">CAST Software | Jan 2023 - Aug 2023</p>
                            <ul className="list-disc list-inside text-sm text-[hsl(199,18%,82%)] mt-2">
                                <li>
                                    Built a multithreaded log parser, <span className="text-violet-500">improving system throughput by 3x</span> and{" "}
                                    <span className="text-violet-500">reducing latency by 60%</span>.
                                </li>
                                <li>
                                    Developed a VS Code extension to automate CI workflows, reducing developer task time by{" "}
                                    <span className="text-violet-500">90%</span>.
                                </li>
                            </ul>
                        </div>
                        <h3 className="text-2xl font-semibold text-[hsl(199,18%,82%)] mb-4 border-t pt-2 border-dim_gray">Projects</h3>
                        <div className="project-item mb-6">
                            <h4 className="text-xl font-semibold text-[hsl(199,18%,82%)]">Placement App (Fullstack)</h4>
                            <p className="text-sm text-[hsl(199,18%,82%)]">React, Golang, Zustand, REST API, Auth</p>
                            <ul className="list-disc list-inside text-sm text-[hsl(199,18%,82%)] mt-2">
                                <li>
                                    Engineered a full-stack placement portal used by <span className="text-violet-500">500+</span> students,
                                    streamlining end-to-end job application flow.
                                </li>
                                <li>
                                    Delivered both frontend dashboards and backend services, <span className="text-violet-500">achieving 95%</span>{" "}
                                    user satisfaction.
                                </li>
                            </ul>
                            <p className="text-sm text-[hsl(199,18%,82%)] mt-2">
                                <a
                                    href="https://github.com/sufyaankhateeb/placement-app-ui"
                                    className="text-violet-400 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Frontend Repository
                                </a>
                                <span className="mx-2">|</span>
                                <a
                                    href="https://github.com/sufyaankhateeb/placement-app-api"
                                    className="text-violet-400 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Backend Repository
                                </a>
                            </p>
                        </div>
                        <div className="project-item mb-6">
                            <h4 className="text-xl font-semibold text-[hsl(199,18%,82%)]">Real-Time Chat App (Fullstack)</h4>
                            <p className="text-sm text-[hsl(199,18%,82%)]">Node.js, WebSocket, Express, React</p>
                            <ul className="list-disc list-inside text-sm text-[hsl(199,18%,82%)] mt-2">
                                <li>Developed a secure real-time chat app with custom authentication and socket-based communication.</li>
                            </ul>
                            <p className="text-sm text-[hsl(199,18%,82%)] mt-2">
                                <a
                                    href="https://chat-app.sufyaankhateeb.site/"
                                    className="text-violet-400 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Live Link
                                </a>
                                <span className="mx-2">|</span>
                                <a
                                    href="https://github.com/SufyaanKhateeb/chat-app"
                                    className="text-violet-400 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub Repository
                                </a>
                            </p>
                        </div>
                        <div className="text-sm">
                            <a
                                href="https://sufyaankhateeb.github.io/Learning-Web-Dev/"
                                className="text-violet-400 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View other projects
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div ref={aboutSectionRef} id="about-section" className="border-t border-dim_gray">
                <div className="bg-transparent flex items-center justify-center h-full p-8">
                    <div className="bg-[hsl(0,0%,20%)] shadow-lg rounded-lg p-8 max-w-4xl w-full relative">
                        <div className="absolute inset-0 -z-10 rounded-lg scale-105"></div>
                        <div className="relative">
                            <div className="relative w-32 h-32 mb-6">
                                <Image
                                    alt="Profile Picture"
                                    className="object-cover rounded-full border-4 border-[hsl(var(--primary))] shadow-md"
                                    fill
                                    src={img2}
                                />
                            </div>
                            <h2 className="text-4xl font-extrabold text-[hsl(var(--foreground))] mb-4">About Me</h2>
                            <p className="text-base text-[hsl(var(--foreground))] leading-relaxed">
                                Versatile Full Stack Developer with hands-on experience in developing secure, scalable, and high-performance web
                                applications using <span className="text-[hsl(var(--primary))] font-semibold">Java</span>,{" "}
                                <span className="text-[hsl(var(--primary))] font-semibold">Spring Boot</span>,{" "}
                                <span className="text-[hsl(var(--primary))] font-semibold">React.js</span>, PostgreSQL, and microservices
                                architecture. Strong expertise in both backend system design and frontend UI development. Contributed to key product
                                integrations at CAST Software, including secure authentication flows, distributed job schedulers, and performance
                                optimization through close collaboration with backend teams. Adept at CI/CD, cloud deployment, and working in
                                collaborative Agile environments.
                            </p>
                            <div className="mt-10">
                                <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Resume</h3>
                                <iframe
                                    src="/resume-fs-1.pdf"
                                    className="w-full h-96 border border-[hsl(var(--primary))] rounded-lg"
                                    title="Resume Preview"
                                ></iframe>
                                <div className="flex justify-center space-x-4 mt-4">
                                    <a
                                        href="/resume-fs-1.pdf"
                                        download
                                        className="px-4 py-2 bg-violet-500 text-[hsl(var(--background))] font-semibold rounded-lg hover:bg-violet-600 focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none"
                                    >
                                        Download Resume
                                    </a>
                                    <a
                                        href="/resume-fs-1.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-violet-500 text-[hsl(var(--background))] font-semibold rounded-lg hover:bg-violet-600 focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none"
                                    >
                                        View Full Resume
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div ref={contactSectionRef} id="contact-section" className="border-t border-dim_gray">
                <div className="flex items-center justify-center h-full p-8">
                    <div className="bg-[hsl(0,0%,20%)] shadow-lg rounded-lg p-8 max-w-4xl w-full">
                        <h2 className="text-4xl font-extrabold text-[hsl(var(--foreground))] mb-6">Contact Me</h2>
                        <p className="text-base text-[hsl(var(--foreground))] mb-4">
                            Feel free to reach out to me via email or connect with me on LinkedIn. I look forward to hearing from you!
                        </p>
                        <p className="text-base text-[hsl(var(--foreground))] mb-6 flex flex-col items-start space-y-2">
                            <a href="mailto:sufyaankhateeb@gmail.com" className="flex items-center text-violet-500 underline text-sm md:text-base">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-5 h-5 mr-2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21.75 4.5v15a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5v-15A2.25 2.25 0 014.5 2.25h15A2.25 2.25 0 0121.75 4.5zM3.75 6.75l8.25 5.25 8.25-5.25"
                                    />
                                </svg>
                                sufyaankhateeb@gmail.com
                            </a>
                            <a
                                href="https://www.linkedin.com/in/sufyaan-khateeb-0aba27208"
                                className="flex items-center text-violet-500 underline text-sm md:text-base"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    className="w-5 h-5 mr-2"
                                >
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.027-3.063-1.867-3.063-1.868 0-2.155 1.459-2.155 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.756 1.379-1.554 2.841-1.554 3.038 0 3.6 2.001 3.6 4.604v5.583z" />
                                </svg>
                                LinkedIn
                            </a>
                        </p>
                        <div className="flex items-center my-6">
                            <div className="flex-grow border-t border-[hsl(var(--primary))]"></div>
                            <span className="mx-4 text-sm text-[hsl(var(--foreground))]">OR</span>
                            <div className="flex-grow border-t border-[hsl(var(--primary))]"></div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className="mt-1 block w-full p-3 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] rounded-lg border border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none"
                                />
                                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="mt-1 block w-full p-3 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] rounded-lg border border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none"
                                />
                                {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    required
                                    className="mt-1 block w-full p-3 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] rounded-lg border border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none"
                                ></textarea>
                                {formErrors.message && <p className="text-red-500 text-sm mt-1">{formErrors.message}</p>}
                            </div>
                            <div className="flex items-center mt-4">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-violet-500 text-[hsl(var(--background))] font-semibold rounded-lg hover:bg-violet-600 focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    ) : (
                                        "Send Message"
                                    )}
                                </button>
                                <p className="text-sm text-[hsl(var(--foreground))] ml-4">I usually respond within 24 hours.</p>
                            </div>
                        </form>
                        {formSubmitted && (
                            <div className="mt-6">
                                <Alert>
                                    <AlertTitle>Thank You!</AlertTitle>
                                    <AlertDescription>I’ll get back to you shortly — excited to connect!</AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* <div className="bg-background p-8 rounded-lg shadow-lg text-center">
                <h1 className="text-4xl font-bold text-violet-500 mb-4">Site Under Construction</h1>
                <div className="flex justify-center">
                    <svg className="animate-spin h-10 w-10 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                </div>
                <p className="text-foreground mt-6">
                    In the meantime, you can reach me at{" "}
                    <a href="mailto:sufyaankhateeb@gmail.com" className="text-violet-400 underline">
                        sufaankhateeb@gmail.com
                    </a>
                </p>
            </div> */}
            {/* Footer Section */}
            <footer className="text-[hsl(var(--foreground))] py-6 mt-10 border-t border-dim_gray">
                <div className="container mx-auto text-center space-y-4">
                    <p className="text-sm">Made with ❤️ using Next.js</p>
                    <div className="flex justify-center space-x-6">
                        <a
                            href="https://github.com/sufyaankhateeb"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-500 hover:underline"
                        >
                            GitHub
                        </a>
                        <a
                            href="https://www.linkedin.com/in/sufyaan-khateeb-0aba27208"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-500 hover:underline"
                        >
                            LinkedIn
                        </a>
                        <a href="mailto:sufyaankhateeb@gmail.com" className="text-violet-500 hover:underline">
                            Email
                        </a>
                    </div>
                    <p className="text-xs text-gray-500">© {new Date().getFullYear()} Sufyaan Khateeb. All rights reserved.</p>
                </div>
            </footer>
            <div className="mb-12"></div>
        </div>
    );
}
