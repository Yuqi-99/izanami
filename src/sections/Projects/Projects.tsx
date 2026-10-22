import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Reveal } from '../../components/animation/Reveal';
import { WaterReveal } from '../../components/animation/WaterReveal';
import { ArrowLink } from '../../components/common/ArrowLink';

interface Project {
	number: string;
	slug: string;
	title: string;
	lead: React.ReactNode;
	description: string;
	image: string;
	mobileImage: string;
}

const projects: Project[] = [
	{
		number: '01',
		slug: 'school',
		title: 'School',
		lead: 'Nurturing the foundations of life.',
		description:
			'Through “Mama School” over 20,000 families across Japan have been supported. A place where the wishes of both parent and child are gently met.',
		image: '/images/home_projects_img01.webp',
		mobileImage: '/images/sp_home_projects_img01.webp',
	},
	{
		number: '02',
		slug: 'craft',
		title: 'Craft',
		lead: (
			<>
				Awakening the senses
				<br />
				through Japanese aesthetics.
			</>
		),
		description:
			'In Japan, beauty has always been a form of awareness. We carry this into objects and spaces of quiet refinement — rooted in the spirit of harmony, centered in Dubai.',
		image: '/images/home_projects_img02.webp',
		mobileImage: '/images/sp_home_projects_img02.webp',
	},
	{
		number: '03',
		slug: 'retreat',
		title: 'Retreat',
		lead: 'Returning to your essence.',
		description:
			'Rooted in ancient Mayan plant, Izanami offers private ceremonies for a return to one’s original senses and way of being. Guided by founder Moca, unfolding across the world.',
		image: '/images/home_projects_img03.webp',
		mobileImage: '/images/sp_home_projects_img03.webp',
	},
];

function ProjectImage({ project }: { project: Project }) {
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
	const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);
	return (
		<motion.div ref={ref} className='project-story__image-wrap'>
			<picture>
				<source media='(max-width: 767px)' srcSet={project.mobileImage} />
				<motion.img
					initial={{ scale: 1.08 }}
					whileInView={{ scale: 1.02 }}
					viewport={{ once: true }}
					transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
					style={{ y }}
					src={project.image}
					alt=''
					loading='lazy'
				/>
			</picture>
		</motion.div>
	);
}

function ProjectStory({ project }: { project: Project }) {
	return (
		<article id={project.slug} className='project-story section-shell'>
			<div className='project-story__label section-label'>projects</div>
			<div className='project-story__body'>
				<Reveal className='project-story__copy'>
					<h3 className='project-story__title'>
						<span>{project.number}</span>
						<WaterReveal>{project.title}</WaterReveal>
					</h3>
					<p className='project-story__lead'>{project.lead}</p>
					<p className='project-story__description body-copy'>{project.description}</p>
					<ArrowLink href={`#${project.slug}`}>View {project.title}</ArrowLink>
				</Reveal>
				<ProjectImage project={project} />
			</div>
		</article>
	);
}

export function Projects() {
	const viewportRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const reduceMotion = useReducedMotion();
	const [trackShift, setTrackShift] = useState(0);
	const { scrollYProgress } = useScroll({
		target: viewportRef,
		offset: ['start start', 'end end'],
	});
	const trackY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -trackShift]);

	useLayoutEffect(() => {
		const viewport = viewportRef.current;
		const track = trackRef.current;
		if (!viewport || !track) return;

		const sections = Array.from(track.querySelectorAll<HTMLElement>('.project-story'));
		const desktopTimeline = window.matchMedia(
			'(min-width: 768px) and (hover: hover) and (pointer: fine)'
		);

		const resetTimeline = () => {
			viewport.style.removeProperty('height');
			sections.forEach((section) => section.style.removeProperty('top'));
			setTrackShift(0);
		};

		const updateTimeline = () => {
			resetTimeline();
			if (!desktopTimeline.matches || reduceMotion || sections.length < 2) return;

			const firstHeight = sections[0].getBoundingClientRect().height;
			const shift = firstHeight * 0.5;
			const targetHeight = Math.max(track.scrollHeight - shift, window.innerHeight);
			const range = Math.max(targetHeight - window.innerHeight, 1);

			viewport.style.height = `${targetHeight}px`;
			sections.forEach((section, index) => {
				if (index === 0) section.style.top = '0px';
				else if (index === sections.length - 1) section.style.removeProperty('top');
				else section.style.top = `${(shift * firstHeight * index) / (range + shift)}px`;
			});
			setTrackShift(shift);
		};

		const resizeObserver = new ResizeObserver(updateTimeline);
		resizeObserver.observe(track);
		desktopTimeline.addEventListener('change', updateTimeline);
		window.addEventListener('resize', updateTimeline);
		updateTimeline();

		return () => {
			resizeObserver.disconnect();
			desktopTimeline.removeEventListener('change', updateTimeline);
			window.removeEventListener('resize', updateTimeline);
			resetTimeline();
		};
	}, [reduceMotion]);

	return (
		<section id='projects' className='projects-section'>
			<div className='projects-intro'>
				<div className='projects-intro__veil' />
				<h2 className='section-label'>projects</h2>
				<div className='projects-intro__copy'>
					<p className='display-heading'>
						<WaterReveal>Designing</WaterReveal>
						<WaterReveal delay={0.08}>the Dimensions</WaterReveal>
						<WaterReveal delay={0.16}>of Life</WaterReveal>
					</p>
					<Reveal delay={0.48}>
						<p className='body-copy'>
							Through three practices,
							<br />
							Izanami designs harmony across life.
							<br />
							How life is nurtured, how living is enriched,
							<br />
							and how one returns to oneself.
						</p>
					</Reveal>
					<ArrowLink href='#school' delay={0.78}>
						View Projects
					</ArrowLink>
				</div>
			</div>
			<div ref={viewportRef} className='project-stories'>
				<motion.div ref={trackRef} className='project-stories__track' style={{ y: trackY }}>
					{projects.map((project) => (
						<ProjectStory key={project.slug} project={project} />
					))}
				</motion.div>
			</div>
		</section>
	);
}
