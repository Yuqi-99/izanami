import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { Reveal } from '../../components/animation/Reveal';
import { RevealImage } from '../../components/animation/RevealImage';
import { WaterReveal } from '../../components/animation/WaterReveal';
import { ArrowLink } from '../../components/common/ArrowLink';

export function Philosophy() {
	const sectionRef = useRef<HTMLElement>(null);
	const reduceMotion = useReducedMotion();
	const { scrollYProgress: sceneProgress } = useScroll({
		target: sectionRef,
		offset: ['start end', 'end start'],
	});
	const smallY = useTransform(sceneProgress, [0, 1], ['-10%', '12%']);
	const squareY = useTransform(sceneProgress, [0, 1], ['10%', '-12%']);
	return (
		<section ref={sectionRef} id='philosophy' className='philosophy-section section-shell'>
			<div className='section-marker'>
				<h2 className='section-label'>philosophy</h2>
			</div>
			<div className='philosophy-section__content'>
				<div className='philosophy-section__copy'>
					<p className='display-heading'>
						<WaterReveal>Sharing</WaterReveal>
						<WaterReveal delay={0.08}>the Japanese Spirit</WaterReveal>
						<WaterReveal className='is-end' delay={0.16}>
							of Harmony
						</WaterReveal>
					</p>
					<Reveal delay={0.48}>
						<p className='body-copy philosophy-section__description'>
							Harmony is not something to be created. It is something to be remembered. Guided by
							the ancient spirit of “和” Wa, Izanami opens a quiet path back to oneself into harmony
							with who you are, and harmony with the world around you.
						</p>
					</Reveal>
					<ArrowLink href='#projects' delay={0.78}>
						View Philosophy
					</ArrowLink>
				</div>
				<motion.div className='philosophy-collage'>
					<motion.div className='philosophy-collage__large'>
						<RevealImage
							src='/images/home_philosophy_img01.webp'
							mobileSrc='/images/sp_home_philosophy_img01.webp'
						/>
					</motion.div>
					<motion.div
						className='philosophy-collage__small'
						style={{ y: reduceMotion ? 0 : smallY }}
					>
						<RevealImage
							src='/images/home_philosophy_img02.webp'
							mobileSrc='/images/sp_home_philosophy_img02.webp'
						/>
					</motion.div>
				</motion.div>
			</div>
			<motion.div className='philosophy-section__single' style={{ y: reduceMotion ? 0 : squareY }}>
				<RevealImage
					src='/images/home_philosophy_img03.webp'
					mobileSrc='/images/sp_home_philosophy_img03.webp'
				/>
			</motion.div>
		</section>
	);
}
