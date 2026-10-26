import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

interface ArrowLinkProps {
	href: string;
	children: React.ReactNode;
	delay?: number;
	revealOnScroll?: boolean;
}

export function ArrowLink({ href, children, delay = 0, revealOnScroll = true }: ArrowLinkProps) {
	const reduceMotion = useReducedMotion();
	const ref = useRef<HTMLAnchorElement>(null);
	const inView = useInView(ref, { once: true, amount: 0.2 });
	const visible = !revealOnScroll || reduceMotion || inView;

	return (
		<a ref={ref} className='arrow-link' href={href}>
			<span className='arrow-link__line' aria-hidden='true'>
				<span className='arrow-link__moving-line' />
			</span>
			<motion.span
				className='arrow-link__text'
				initial={!revealOnScroll || reduceMotion ? false : { opacity: 0, y: '105%' }}
				animate={visible ? { opacity: 1, y: '0%' } : undefined}
				transition={{ duration: 1.05, delay: delay + 0.16, ease: [0.16, 1, 0.3, 1] }}
			>
				<span className='arrow-link__text-before'>{children}</span>
				<span className='arrow-link__text-after' aria-hidden='true'>
					{children}
				</span>
			</motion.span>
		</a>
	);
}
