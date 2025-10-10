import { motion, useScroll, useTransform } from "framer-motion";
import { PropsWithChildren, useRef } from "react";

export default function ParallaxSection({ children, bg }: PropsWithChildren<{ bg?: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  return (
    <section ref={ref} className="relative h-[90vh] md:h-screen overflow-hidden">
      <motion.div
        style={{ y, backgroundImage: bg ? `url(${bg})` : undefined }}
        className="absolute inset-0 bg-cover bg-center"
      />
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-3xl p-6 md:p-10 bg-white/70 backdrop-blur rounded-2xl shadow-xl">
          {children}
        </div>
      </div>
    </section>
  );
}
