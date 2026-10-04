import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, type ReactNode } from 'react';

export function HomeJourney({ children }: { children: ReactNode }) {
	const journeyRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: journeyRef,
		offset: ['start end', 'end start'],
	});
	const backdropOpacity = useTransform(scrollYProgress, [0.01, 0.06, 0.9, 0.98], [0, 1, 1, 0]);
	const roomY = useTransform(scrollYProgress, [0.08, 0.78], ['7%', '-13%']);
	const roomScale = useTransform(scrollYProgress, [0.08, 0.78], [1.14, 1.08]);
	const shadeOpacity = useTransform(scrollYProgress, [0.43, 0.76], [0.08, 0.82]);

	return (
		<div ref={journeyRef} className='home-journey'>
			<div className='journey-backdrop' aria-hidden='true'>
				<motion.div className='journey-backdrop__fixed' style={{ opacity: backdropOpacity }}>
					<motion.picture className='journey-backdrop__room' style={{ y: roomY, scale: roomScale }}>
						<source media='(max-width: 767px)' srcSet='/images/sp_home_projects_img.webp' />
						<img src='/images/home_projects_img.webp' alt='' loading='eager' />
					</motion.picture>
					<motion.div className='journey-backdrop__shade' style={{ opacity: shadeOpacity }} />
				</motion.div>
			</div>
			{children}
		</div>
	);
}
