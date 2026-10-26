import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

interface RevealImageProps {
	src: string;
	mobileSrc?: string;
	alt?: string;
	className?: string;
	eager?: boolean;
}

export function RevealImage({
	src,
	mobileSrc,
	alt = '',
	className = '',
	eager = false,
}: RevealImageProps) {
	const reduceMotion = useReducedMotion();
	const ref = useRef<HTMLDivElement>(null);
	const inView = useInView(ref, { once: true, amount: 0.12 });
	const visible = reduceMotion || inView;
	return (
		<div ref={ref} className={`reveal-image ${className}`}>
			<motion.div
				className='reveal-image__surface'
				initial={reduceMotion ? false : { y: '10%', clipPath: 'inset(0 0 100% 0)' }}
				animate={visible ? { y: '0%', clipPath: 'inset(0 0 0% 0)' } : undefined}
				transition={{ duration: 1.4, ease: [0, 0.55, 0.45, 1] }}
			>
				<picture>
					{mobileSrc && <source media='(max-width: 767px)' srcSet={mobileSrc} />}
					<motion.img
						src={src}
						alt={alt}
						loading={eager ? 'eager' : 'lazy'}
						initial={reduceMotion ? false : { scale: 1.14, y: '-5%' }}
						animate={visible ? { scale: 1, y: '0%' } : undefined}
						transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
					/>
				</picture>
			</motion.div>
		</div>
	);
}
