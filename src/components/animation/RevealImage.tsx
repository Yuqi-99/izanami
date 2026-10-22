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
		<motion.div
			className={`reveal-image ${className}`}
			initial={reduceMotion ? false : { y: '16%', scaleX: 1.08 }}
			whileInView={{ y: '0%', scaleX: 1 }}
			viewport={{ once: true, amount: 0.12 }}
			transition={{ duration: 1.4, ease: [0, 0.55, 0.45, 1] }}
		>
			<picture>
				{mobileSrc && <source media='(max-width: 767px)' srcSet={mobileSrc} />}
				<motion.img
					src={src}
					alt={alt}
					loading={eager ? 'eager' : 'lazy'}
					initial={reduceMotion ? false : { scale: 1.14, y: '-5%' }}
					whileInView={{ scale: 1, y: '0%' }}
					viewport={{ once: true }}
					transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
				/>
			</picture>
		</motion.div>
	);
}
