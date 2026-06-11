"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
    mousePos,
    parallaxStrength = 20,
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
    mousePos?: { x: number; y: number };
    parallaxStrength?: number;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={mousePos ? {
                    x: mousePos.x * parallaxStrength,
                    y: mousePos.y * parallaxStrength,
                } : {}}
                transition={{
                    type: "spring",
                    stiffness: 75,
                    damping: 15,
                    mass: 0.5,
                }}
            >
                <motion.div
                    animate={{
                        y: [0, 15, 0],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                    style={{
                        width,
                        height,
                    }}
                    className="relative"
                >
                    <div
                        className={cn(
                            "absolute inset-0 rounded-full",
                            "bg-gradient-to-r to-transparent",
                            gradient,
                            "backdrop-blur-[2px] border-2 border-white/[0.15]",
                            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                            "after:absolute after:inset-0 after:rounded-full",
                            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
                        )}
                    />
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

function InteractiveCursorBlob() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // center the blob (which is w-80 h-80, so 320px / 2 = 160px)
            mouseX.set(e.clientX - 160);
            mouseY.set(e.clientY - 160);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <motion.div
                className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-brand-600/10 to-accent-500/8 blur-[100px]"
                style={{
                    x: cursorX,
                    y: cursorY,
                }}
            />
        </motion.div>
    );
}

function HeroGeometric({
    badge = "Design Collective",
    title1 = "Elevate Your Digital Vision",
    title2 = "Crafting Exceptional Websites",
    description = "Crafting exceptional digital experiences through innovative design and cutting-edge technology.",
    children,
}: {
    badge?: string;
    title1?: string;
    title2?: string;
    description?: string;
    children?: React.ReactNode;
}) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX / innerWidth) - 0.5;
            const y = (e.clientY / innerHeight) - 0.5;
            setMousePos({ x, y });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1] as const,
            },
        }),
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
            {/* Interactive Cursor Blob */}
            <InteractiveCursorBlob />

            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
                <ElegantShape
                    delay={0.3}
                    width={600}
                    height={140}
                    rotate={12}
                    gradient="from-indigo-500/[0.15]"
                    className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                    mousePos={mousePos}
                    parallaxStrength={35}
                />

                <ElegantShape
                    delay={0.5}
                    width={500}
                    height={120}
                    rotate={-15}
                    gradient="from-rose-500/[0.15]"
                    className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                    mousePos={mousePos}
                    parallaxStrength={-45}
                />

                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="from-violet-500/[0.15]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                    mousePos={mousePos}
                    parallaxStrength={25}
                />

                <ElegantShape
                    delay={0.6}
                    width={200}
                    height={60}
                    rotate={20}
                    gradient="from-amber-500/[0.15]"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                    mousePos={mousePos}
                    parallaxStrength={-20}
                />

                <ElegantShape
                    delay={0.7}
                    width={150}
                    height={40}
                    rotate={-25}
                    gradient="from-cyan-500/[0.15]"
                    className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                    mousePos={mousePos}
                    parallaxStrength={15}
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12"
                    >
                        <Circle className="h-2 w-2 fill-rose-500/80 animate-pulse" />
                        <span className="text-sm text-white/60 tracking-wide">
                            {badge}
                        </span>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-8 tracking-tight leading-tight">
                            <motion.span 
                                className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/70 whitespace-nowrap"
                                animate={{
                                    textShadow: [
                                        "0 0 0px rgba(255,255,255,0)",
                                        "0 0 20px rgba(255,255,255,0.1)",
                                        "0 0 0px rgba(255,255,255,0)"
                                    ]
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut"
                                }}
                            >
                                {title1}
                            </motion.span>
                            <br />
                            <motion.span
                                className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-violet-400 to-rose-300 bg-[length:200%_auto] pb-1 whitespace-nowrap"
                                animate={{
                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                    textShadow: [
                                        "0 0 0px rgba(167,139,250,0)",
                                        "0 0 25px rgba(167,139,250,0.25)",
                                        "0 0 0px rgba(167,139,250,0)"
                                    ]
                                }}
                                transition={{
                                    backgroundPosition: {
                                        duration: 8,
                                        repeat: Number.POSITIVE_INFINITY,
                                        ease: "linear",
                                    },
                                    textShadow: {
                                        duration: 5,
                                        repeat: Number.POSITIVE_INFINITY,
                                        ease: "easeInOut",
                                        delay: 1.5
                                    }
                                }}
                            >
                                {title2}
                            </motion.span>
                        </h1>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-2xl mx-auto px-4 text-center text-balance">
                            {description}
                        </p>
                    </motion.div>

                    {children && (
                        <motion.div
                            custom={3}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {children}
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/80 pointer-events-none" />
        </div>
    );
}

export { HeroGeometric }
