import { useId, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

interface WaterRevealProps {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}

export function WaterReveal({ children, className = '', delay = 0 }: WaterRevealProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const inView = useInView(ref, { once: true, amount: 0.35 });
	const reduceMotion = useReducedMotion();
	const filterId = `water-reveal-${useId().replace(/:/g, '')}`;
	const animate = reduceMotion || inView;

	return (
		<span ref={ref} className={`water-reveal ${className}`}>
			<svg className='water-reveal__filter' width='0' height='0' aria-hidden='true'>
				<filter id={filterId} x='-30%' y='-80%' width='160%' height='260%' colorInterpolationFilters='sRGB'>
					<feTurbulence
						type='fractalNoise'
						baseFrequency='0.008 0.075'
						numOctaves='2'
						seed='7'
						result='noise'
					/>
					<feDisplacementMap
						in='SourceGraphic'
						in2='noise'
						scale={animate && !reduceMotion ? 34 : 0}
						xChannelSelector='R'
						yChannelSelector='G'
					>
						{animate && !reduceMotion && (
							<animate attributeName='scale' from='34' to='0' dur='1.45s' fill='freeze' begin={`${delay}s`} />
						)}
					</feDisplacementMap>
				</filter>
			</svg>
			<motion.span
				className='water-reveal__text'
				style={{ filter: reduceMotion ? undefined : `url(#${filterId})` }}
				initial={reduceMotion ? false : { opacity: 0, clipPath: 'inset(0 100% 0 0)', x: 18 }}
				animate={animate ? { opacity: 1, clipPath: 'inset(0 0% 0 0)', x: 0 } : undefined}
				transition={{ duration: 1.45, delay, ease: [0.16, 1, 0.3, 1] }}
			>
				{children}
			</motion.span>
		</span>
	);
}
