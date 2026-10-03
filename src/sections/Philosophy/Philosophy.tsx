import { motion, useMotionTemplate, useScroll, useTransform } from 'motion/react';
import { Reveal } from '../../components/animation/Reveal';
import { RevealImage } from '../../components/animation/RevealImage';
import { ArrowLink } from '../../components/common/ArrowLink';

export function Philosophy() {
	const { scrollY } = useScroll();
	const sceneProgress = useTransform(scrollY, (value) => value / window.innerHeight);
	const smallY = useTransform(sceneProgress, [1.1, 2.6], ['-10%', '12%']);
	const squareY = useTransform(sceneProgress, [0.9, 2.2], ['10%', '-12%']);
	const courtyardOpacity = useTransform(sceneProgress, [0.35, 1.45], [0, 1]);
	const courtyardMask = useMotionTemplate`linear-gradient(to bottom, rgba(0, 0, 0, ${courtyardOpacity}) 0%, rgba(0, 0, 0, 1) 100%)`;
	const transitionShadeOpacity = useTransform(
		sceneProgress,
		[0.3, 0.9, 1.35, 1.65],
		[0, 0.32, 0.24, 0]
	);
	const singleClip = useTransform(
		sceneProgress,
		[0.96, 1.16],
		['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)']
	);
	const singleOpacity = useTransform(sceneProgress, [0.96, 1.02], [0, 1]);
	const largeClip = useTransform(
		sceneProgress,
		[1.18, 1.48],
		['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)']
	);
	const largeOpacity = useTransform(sceneProgress, [1.18, 1.24], [0, 1]);
	const smallClip = useTransform(
		sceneProgress,
		[1.28, 1.56],
		['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)']
	);
	const smallOpacity = useTransform(sceneProgress, [1.28, 1.34], [0, 1]);
	return (
		<section id='philosophy' className='philosophy-section section-shell'>
			<div className='philosophy-transition' aria-hidden='true'>
				<div className='philosophy-transition__sticky'>
					<motion.div
						className='philosophy-transition__courtyard-stage'
						style={{
							opacity: courtyardOpacity,
							maskImage: courtyardMask,
							WebkitMaskImage: courtyardMask,
						}}
					>
						<picture className='philosophy-transition__courtyard'>
							<source media='(max-width: 767px)' srcSet='/images/sp_home_projects_img.webp' />
							<img src='/images/home_projects_img.webp' alt='' />
						</picture>
						<div className='philosophy-transition__shade' />
					</motion.div>
					<motion.div
						className='philosophy-transition__veil'
						style={{ opacity: transitionShadeOpacity }}
					/>
				</div>
			</div>
			<h2 className='section-label'>philosophy</h2>
			<div className='philosophy-section__content'>
				<Reveal className='philosophy-section__copy'>
					<p className='display-heading'>
						Sharing
						<br />
						the Japanese Spirit
						<br />
						<span>of Harmony</span>
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
