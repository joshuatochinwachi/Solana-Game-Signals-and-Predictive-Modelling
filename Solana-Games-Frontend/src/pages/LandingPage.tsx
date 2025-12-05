import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Brain, Trophy, Zap, Crosshair, Wifi, Battery } from 'lucide-react';

// 3D Tilt Card Component
const TiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXFromCenter = e.clientX - rect.left - width / 2;
        const mouseYFromCenter = e.clientY - rect.top - height / 2;
        x.set(mouseXFromCenter / width);
        y.set(mouseYFromCenter / height);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative transition-all duration-200 ease-linear ${className}`}
        >
            {children}
        </motion.div>
    );
};

// ML Terminal Component
const MLTerminal = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const maxLogs = 6;

    useEffect(() => {
        const possibleLogs = [
            "Analyzing wallet 8x...3f",
            "Calculating churn probability...",
            "Ensemble: Aggregating votes",
            "Inference time: 12ms",
            "Risk Score: LOW (0.12)",
            "LTV Prediction: +145% vs avg",
            "Pattern detected: Whale behavior",
            "Updating retention cohort...",
            "Model confidence: 98.4%",
            "Processing transaction graph..."
        ];

        const interval = setInterval(() => {
            const newLog = `[${new Date().toLocaleTimeString()}] ${possibleLogs[Math.floor(Math.random() * possibleLogs.length)]}`;
            setLogs(prev => [...prev.slice(-(maxLogs - 1)), newLog]);
        }, 800);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="hidden lg:block absolute bottom-8 right-8 w-80 font-mono text-xs z-30 pointer-events-none">
            <div className="bg-black/80 border border-solana-green/30 p-4 rounded-lg backdrop-blur-md shadow-[0_0_20px_rgba(0,230,118,0.1)]">
                <div className="flex items-center justify-between mb-2 border-b border-solana-green/20 pb-2">
                    <span className="text-solana-green font-bold flex items-center gap-2">
                        <div className="w-2 h-2 bg-solana-green animate-pulse rounded-full" />
                        LIVE INFERENCE
                    </span>
                    <span className="text-solana-green/50">v2.4.0</span>
                </div>
                <div className="space-y-1 h-32 overflow-hidden flex flex-col justify-end">
                    {logs.map((log, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-solana-green/80 truncate"
                        >
                            <span className="text-solana-purple mr-2">{'>'}</span>
                            {log}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [textIndex, setTextIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const fullText = "SYSTEM INITIALIZED: PLAYER BEHAVIOR MODELING ACTIVE";

    // Typing effect
    useEffect(() => {
        if (textIndex < fullText.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + fullText[textIndex]);
                setTextIndex(prev => prev + 1);
            }, 20);
            return () => clearTimeout(timeout);
        }
    }, [textIndex]);

    const handleEnter = () => {
        navigate('/analytics');
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative font-mono selection:bg-solana-green selection:text-black">

            {/* CRT Scanline Overlay */}
            <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
                <div className="absolute inset-0 bg-black/10 animate-scanline pointer-events-none" />
            </div>

            {/* HUD Corners */}
            <div className="fixed inset-0 z-40 pointer-events-none p-8">
                <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-solana-green/50 rounded-tl-lg" />
                <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-solana-green/50 rounded-tr-lg" />
                <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-solana-green/50 rounded-bl-lg" />
                <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-solana-green/50 rounded-br-lg" />

                {/* System Status Indicators */}
                <div className="absolute top-8 left-32 flex items-center gap-4 text-xs text-solana-green/70 font-bold tracking-widest">
                    <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 animate-pulse" /> NET: ONLINE
                    </div>
                    <div className="flex items-center gap-2">
                        <Battery className="w-4 h-4" /> PWR: 100%
                    </div>
                    <div className="flex items-center gap-2">
                        <Crosshair className="w-4 h-4 animate-spin-slow" /> TARGET: LOCKED
                    </div>
                </div>

                <div className="absolute top-8 right-32 text-xs text-solana-purple/70 font-bold tracking-widest animate-pulse">
                    ENCRYPTION: SOLANA-256
                </div>
            </div>

            {/* Live ML Terminal */}
            <MLTerminal />

            {/* Animated Background Grid */}
            <div className="absolute inset-0 z-0 opacity-30">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#14F1951a_1px,transparent_1px),linear-gradient(to_bottom,#14F1951a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <motion.div
                    animate={{
                        backgroundPosition: ['0% 0%', '0% 100%'],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#9945FF1a,transparent)]"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 container mx-auto px-6 h-screen flex flex-col justify-center items-center">

                {/* Main Title with Glitch Effect */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16 relative"
                >
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent to-solana-green/50" />

                    {/* Powered By Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-solana-purple/10 border border-solana-purple/50 text-solana-purple text-xs font-bold tracking-widest mb-6 backdrop-blur-sm"
                    >
                        <Brain className="w-3 h-3" /> POWERED BY PREDICTIVE AI/ML
                    </motion.div>

                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-[0_0_15px_rgba(20,241,149,0.5)] relative group cursor-default">
                        <span className="absolute inset-0 text-solana-green/30 blur-sm translate-x-[2px] group-hover:translate-x-[-4px] transition-transform duration-75">SOLANA</span>
                        <span className="absolute inset-0 text-solana-purple/30 blur-sm -translate-x-[2px] group-hover:translate-x-[4px] transition-transform duration-75">SOLANA</span>
                        SOLANA
                    </h1>

                    <h2 className="text-4xl md:text-6xl font-black tracking-widest text-solana-green mb-8 uppercase drop-shadow-[0_0_10px_rgba(20,241,149,0.8)]">
                        ANALYTICS
                    </h2>

                    <div className="h-8 mb-12 flex justify-center items-center gap-2">
                        <div className="w-2 h-2 bg-solana-green animate-ping" />
                        <p className="text-sm md:text-base font-mono text-solana-green/80 tracking-widest uppercase">
                            {displayedText}
                            <span className="animate-pulse">_</span>
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, letterSpacing: "0.2em" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleEnter}
                        className="group relative px-16 py-5 bg-black overflow-hidden clip-path-polygon border border-solana-green text-solana-green font-bold text-xl tracking-widest uppercase transition-all duration-300 hover:bg-solana-green hover:text-black hover:shadow-[0_0_50px_rgba(20,241,149,0.6)]"
                        style={{ clipPath: "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)" }}
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            Initialize System <Zap className="w-5 h-5 group-hover:fill-black transition-colors" />
                        </span>
                    </motion.button>
                </motion.div>

                {/* 3D Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl mt-8 perspective-1000">
                    {[
                        {
                            icon: <Brain className="w-10 h-10" />,
                            title: "AI PREDICTION",
                            desc: "ML-driven churn forecasting & LTV modeling",
                            color: "text-solana-purple",
                            border: "border-solana-purple/50",
                            pulse: true
                        },
                        {
                            icon: <Zap className="w-10 h-10" />,
                            title: "LIVE TELEMETRY",
                            desc: "Real-time ecosystem health & transaction tracking",
                            color: "text-solana-green",
                            border: "border-solana-green/50"
                        },
                        {
                            icon: <Trophy className="w-10 h-10" />,
                            title: "ELITE TRACKING",
                            desc: "Deep dive analysis of whale & power user behavior",
                            color: "text-solana-cyan",
                            border: "border-solana-cyan/50"
                        }
                    ].map((feature, index) => (
                        <TiltCard key={index} className="h-full">
                            <div className={`
                                h-full p-8 bg-black/80 backdrop-blur-md border ${feature.border} 
                                hover:bg-white/5 transition-colors group relative overflow-hidden
                                shadow-[0_0_20px_rgba(0,0,0,0.5)]
                                ${feature.pulse ? 'animate-pulse-slow-border' : ''}
                            `}>
                                {/* Holographic Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/30" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/30" />

                                <div className={`mb-6 p-4 bg-white/5 w-fit rounded-lg ${feature.color} group-hover:scale-110 group-hover:shadow-[0_0_20px_currentColor] transition-all duration-300 relative`}>
                                    {feature.icon}
                                    {feature.pulse && (
                                        <div className="absolute inset-0 bg-solana-purple/30 blur-md animate-pulse rounded-lg" />
                                    )}
                                </div>
                                <h3 className="text-2xl font-black mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 text-sm font-mono leading-relaxed border-l-2 border-white/10 pl-4">
                                    {feature.desc}
                                </p>
                            </div>
                        </TiltCard>
                    ))}
                </div>
            </div>

            {/* Footer Status */}
            <div className="fixed bottom-8 left-0 w-full text-center pointer-events-none z-40">
                <p className="text-[10px] text-white/20 font-mono tracking-[0.5em]">OPERATIONAL // V.2.0.4 // SECURE CONNECTION</p>
            </div>
        </div>
    );
};
