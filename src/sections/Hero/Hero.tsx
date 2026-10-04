import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export function Hero() {
	const sectionRef = useRef<HTMLElement>(null);
	const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
	const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '5%']);
	const imageScale = useTransform(scrollYProgress, [0, 1], [1.01, 1.075]);
	const forestOpacity = useTransform(scrollYProgress, [0, 0.44, 0.89, 1], [1, 1, 0, 0]);
	const cloudOpacity = useTransform(scrollYProgress, [0, 0.74, 0.9, 1], [1, 1, 0, 0]);
	const cloudY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
	const titleY = useTransform(scrollYProgress, [0, 0.7], ['0%', '55%']);
	const opacity = useTransform(scrollYProgress, [0, 0.42, 0.5, 1], [1, 0, 0, 0]);
	const heroOpacity = useTransform(scrollYProgress, [0, 0.86, 0.91, 1], [1, 1, 0, 0]);

	return (
		<section ref={sectionRef} id='top' className='hero-section'>
			<motion.div className='hero-section__sticky' style={{ opacity: heroOpacity }}>
				<motion.picture className='hero-section__image' style={{ y: imageY, scale: imageScale, opacity: forestOpacity }}>
					<source media='(max-width: 767px)' srcSet='/images/sp_home_fv_img.webp' />
					<img src='/images/home_fv_img.webp' alt='' fetchPriority='high' />
				</motion.picture>
				<motion.div className='cloud-layer' style={{ y: cloudY, opacity: cloudOpacity }} aria-hidden='true'>
					{['one', 'two'].map((cloud, cloudIndex) => (
						<div className={`cloud cloud--${cloud}`} key={cloud}>
							{[0, 1].map((item) => (
								<picture className={`cloud__item cloud__item--${item + 1}`} key={item}>
									<source
										media='(max-width: 767px)'
										srcSet={`/images/sp_common_fv_cloud0${cloudIndex + 1}.webp`}
									/>
									<img src={`/images/common_fv_cloud0${cloudIndex + 1}.webp`} alt='' />
								</picture>
							))}
						</div>
					))}
				</motion.div>
				<motion.h1
					className='hero-section__title display-small'
					style={{ y: titleY, opacity }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1.2, delay: 1.1 }}
				>
					Remember who you are
				</motion.h1>
			</motion.div>
		</section>
	);
}
