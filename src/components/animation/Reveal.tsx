import { motion, useReducedMotion } from 'motion/react';

interface RevealProps {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
	const reduceMotion = useReducedMotion();
	return (
		<motion.div
			className={className}
			initial={reduceMotion ? false : { opacity: 0, y: 36 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.22 }}
			transition={{ duration: 1.15, delay, ease: [0.22, 1, 0.36, 1] }}
		>
			{children}
		</motion.div>
	);
}
