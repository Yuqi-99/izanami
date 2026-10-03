import { useClocks } from '../../hooks/useClocks';
import { motion, useScroll, useTransform } from 'motion/react';

export function Aside() {
	const times = useClocks();
	const { scrollY } = useScroll();
	const opacity = useTransform(scrollY, [0, 640], [1, 0]);
	return (
		<motion.aside
			className='page-aside'
			style={{ opacity }}
			aria-label='Local times and scroll status'
		>
			<small>©2026</small>
			<div className='page-aside__times'>
				<span>
					<time>{times.dubai}</time> gst, dubai uae
				</span>
				<span>
					<time>{times.tokyo}</time> jst, tokyo jpn
				</span>
			</div>
			<span>scroll</span>
		</motion.aside>
	);
}
