import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { Reveal } from '../../components/animation/Reveal';
import { RevealImage } from '../../components/animation/RevealImage';
import { WaterReveal } from '../../components/animation/WaterReveal';
import { ArrowLink } from '../../components/common/ArrowLink';

export function Philosophy() {
	const sectionRef = useRef<HTMLElement>(null);
	const { scrollYProgress: sceneProgress } = useScroll({
		target: sectionRef,
		offset: ['start end', 'end start'],
	});
	const smallY = useTransform(sceneProgress, [0, 1], ['-10%', '12%']);
	const squareY = useTransform(sceneProgress, [0, 1], ['10%', '-12%']);
	const singleClip = useTransform(
		sceneProgress,
		[0.08, 0.24],
		['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)']
	);
	const singleOpacity = useTransform(sceneProgress, [0.08, 0.16], [0, 1]);
	const largeClip = useTransform(
		sceneProgress,
		[0.38, 0.58],
		['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)']
	);
	const largeOpacity = useTransform(sceneProgress, [0.38, 0.46], [0, 1]);
	const smallClip = useTransform(
		sceneProgress,
		[0.44, 0.64],
		['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)']
	);
	const smallOpacity = useTransform(sceneProgress, [0.44, 0.52], [0, 1]);
	return (
		<section ref={sectionRef} id='philosophy' className='philosophy-section section-shell'>
			<h2 className='section-label'>philosophy</h2>
			<div className='philosophy-section__content'>
				<Reveal className='philosophy-section__copy'>
					<p className='display-heading'>
						<WaterReveal>Sharing</WaterReveal>
						<WaterReveal delay={0.08}>the Japanese Spirit</WaterReveal>
						<WaterReveal className='is-end' delay={0.16}>of Harmony</WaterReveal>
					</p>
					<p className='body-copy philosophy-section__description'>
						Harmony is not something to be created. It is something to be remembered. Guided by the
						ancient spirit of “和” Wa, Izanami opens a quiet path back to oneself into harmony with
						who you are, and harmony with the world around you.
					</p>
					<ArrowLink href='#projects'>View Philosophy</ArrowLink>
				</Reveal>
				<motion.div className='philosophy-collage'>
					<motion.div
						className='philosophy-collage__large'
						style={{ clipPath: largeClip, opacity: largeOpacity }}
					>
						<RevealImage
							src='/images/home_philosophy_img01.webp'
							mobileSrc='/images/sp_home_philosophy_img01.webp'
						/>
					</motion.div>
					<motion.div
						className='philosophy-collage__small'
						style={{ y: smallY, clipPath: smallClip, opacity: smallOpacity }}
					>
						<RevealImage
							src='/images/home_philosophy_img02.webp'
							mobileSrc='/images/sp_home_philosophy_img02.webp'
						/>
					</motion.div>
				</motion.div>
			</div>
			<motion.div
				className='philosophy-section__single'
				style={{ y: squareY, clipPath: singleClip, opacity: singleOpacity }}
			>
				<RevealImage
					src='/images/home_philosophy_img03.webp'
					mobileSrc='/images/sp_home_philosophy_img03.webp'
				/>
			</motion.div>
		</section>
	);
}
