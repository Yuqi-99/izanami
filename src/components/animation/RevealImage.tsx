import { motion, useReducedMotion } from 'motion/react';

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
	return (
		<motion.div className={`reveal-image ${className}`}>
			<picture>
				{mobileSrc && <source media='(max-width: 767px)' srcSet={mobileSrc} />}
				<motion.img
					src={src}
					alt={alt}
					loading={eager ? 'eager' : 'lazy'}
					initial={reduceMotion ? false : { scale: 1.1 }}
					whileInView={{ scale: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
				/>
			</picture>
		</motion.div>
	);
}
