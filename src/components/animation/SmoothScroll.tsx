import type { ReactNode } from 'react';
import { ReactLenis } from 'lenis/react';
import { useReducedMotion } from 'motion/react';
import 'lenis/dist/lenis.css';

export function SmoothScroll({ children }: { children: ReactNode }) {
	const reduceMotion = useReducedMotion();

	return (
		<ReactLenis root options={{ smoothWheel: !reduceMotion }}>
			{children}
		</ReactLenis>
	);
}
