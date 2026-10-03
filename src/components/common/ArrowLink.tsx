import { motion } from 'motion/react';

interface ArrowLinkProps {
	href: string;
	children: React.ReactNode;
}

export function ArrowLink({ href, children }: ArrowLinkProps) {
	return (
		<motion.a
			className='arrow-link'
			href={href}
			initial='rest'
			whileHover='hover'
			whileFocus='hover'
		>
			<span className='arrow-link__line' aria-hidden='true'>
				<motion.span
					variants={{ rest: { x: '-100%' }, hover: { x: '0%' } }}
					transition={{ duration: 0.6 }}
				/>
			</span>
			<span className='arrow-link__text'>{children}</span>
		</motion.a>
	);
}
