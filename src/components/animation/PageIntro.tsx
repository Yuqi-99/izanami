import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface PageIntroProps {
	onComplete: () => void;
}

const progressTimeline = [
	{ at: 0, value: 0 },
	{ at: 450, value: 0 },
	{ at: 850, value: 2 },
	{ at: 1450, value: 34 },
	{ at: 2050, value: 92 },
	{ at: 2450, value: 99 },
	{ at: 3200, value: 99 },
];

function progressAt(elapsed: number) {
	for (let index = 1; index < progressTimeline.length; index += 1) {
		const previous = progressTimeline[index - 1];
		const next = progressTimeline[index];
		if (elapsed <= next.at) {
			const distance = next.at - previous.at;
			const localProgress = distance === 0 ? 1 : (elapsed - previous.at) / distance;
			return Math.floor(previous.value + (next.value - previous.value) * localProgress);
		}
	}

	return 99;
}

function preloadHero() {
	const mobile = window.matchMedia('(max-width: 767px)').matches;
	const sources = mobile
		? [
				'/images/sp_home_fv_img.webp',
				'/images/sp_common_fv_cloud01.webp',
				'/images/sp_common_fv_cloud02.webp',
			]
		: [
				'/images/home_fv_img.webp',
				'/images/common_fv_cloud01.webp',
				'/images/common_fv_cloud02.webp',
			];

	return Promise.allSettled(
		sources.map(
			(source) =>
				new Promise<void>((resolve) => {
					const image = new Image();
					image.onload = () => resolve();
					image.onerror = () => resolve();
					image.src = source;
				}),
		),
	);
}

export function PageIntro({ onComplete }: PageIntroProps) {
	const reduceMotion = useReducedMotion();
	const [progress, setProgress] = useState(0);
	const displayedProgress = reduceMotion ? 100 : progress;

	useEffect(() => {
		if (reduceMotion) {
			const reducedTimer = window.setTimeout(onComplete, 120);
			return () => window.clearTimeout(reducedTimer);
		}

		let cancelled = false;
		let animationFrame = 0;
		let completionTimer = 0;
		const startedAt = performance.now();

		const updateProgress = (now: number) => {
			if (cancelled) return;
			setProgress(progressAt(now - startedAt));
			animationFrame = window.requestAnimationFrame(updateProgress);
		};

		animationFrame = window.requestAnimationFrame(updateProgress);

		const minimumDuration = new Promise<void>((resolve) => {
			window.setTimeout(resolve, 3200);
		});
		const fontsReady = document.fonts?.ready ?? Promise.resolve();

		Promise.allSettled([minimumDuration, fontsReady, preloadHero()]).then(() => {
			if (cancelled) return;
			window.cancelAnimationFrame(animationFrame);
			setProgress(100);
			completionTimer = window.setTimeout(onComplete, 260);
		});

		return () => {
			cancelled = true;
			window.cancelAnimationFrame(animationFrame);
			window.clearTimeout(completionTimer);
		};
	}, [onComplete, reduceMotion]);

	return (
		<motion.div
			className='page-intro'
			role='status'
			aria-label={`Loading ${displayedProgress}%`}
			exit={{ opacity: 0 }}
			transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
		>
			<span className='page-intro__title-wrap' aria-hidden='true'>
				<span className='page-intro__title'>Remember who you are</span>
			</span>
			<span className='page-intro__number' aria-hidden='true'>
				{displayedProgress}
			</span>
		</motion.div>
	);
}
