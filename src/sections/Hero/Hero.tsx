import { motion, useScroll, useTransform } from 'motion/react';

export function Hero() {
	const { scrollY } = useScroll();
	const sceneProgress = useTransform(scrollY, (value) => value / window.innerHeight);
	const imageY = useTransform(sceneProgress, [0, 1.5], ['0%', '10%']);
	const titleY = useTransform(sceneProgress, [0, 0.35], ['0%', '24%']);
	const opacity = useTransform(sceneProgress, [0, 0.25], [1, 0]);
	return (
		<section id='top' className='hero-section'>
			<motion.picture className='hero-section__image' style={{ y: imageY }}>
				<source media='(max-width: 767px)' srcSet='/images/sp_home_fv_img.webp' />
				<img src='/images/home_fv_img.webp' alt='' fetchPriority='high' />
			</motion.picture>
			<div className='cloud-layer' aria-hidden='true'>
				<motion.picture
					className='cloud cloud--one'
					animate={{ x: ['-7%', '1%', '-7%'] }}
					transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
				>
					<source media='(max-width: 767px)' srcSet='/images/sp_common_fv_cloud01.webp' />
					<img src='/images/common_fv_cloud01.webp' alt='' />
				</motion.picture>
				<motion.picture
					className='cloud cloud--two'
					animate={{ x: ['1%', '-7%', '1%'] }}
					transition={{ duration: 42, repeat: Infinity, ease: 'easeInOut' }}
				>
					<source media='(max-width: 767px)' srcSet='/images/sp_common_fv_cloud02.webp' />
					<img src='/images/common_fv_cloud02.webp' alt='' />
				</motion.picture>
			</div>
			<motion.h1
				className='hero-section__title display-small'
				style={{ y: titleY, opacity }}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1.2, delay: 1.1 }}
			>
				Remember who you are
			</motion.h1>
		</section>
	);
}
