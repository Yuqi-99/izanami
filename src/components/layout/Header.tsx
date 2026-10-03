import { type CSSProperties, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Logo } from '../common/Logo';

interface HeaderProps {
	open: boolean;
	onToggle: () => void;
}

interface MenuProps {
	onClose: () => void;
}

const navItems = [
	{ label: 'home', href: '#top', delay: 0.6, current: true },
	{ label: 'philosophy', href: '#philosophy', delay: 0.7 },
	{ label: 'projects', href: '#projects', delay: 0.8 },
	{ label: 'company', href: '#company', delay: 1 },
	{ label: 'contact', href: '#contact', delay: 1.1 },
];

const projectItems = [
	{ label: 'school', href: '#school', delay: 1.1 },
	{ label: 'craft', href: '#craft', delay: 1.2 },
	{ label: 'izanami space', href: '#craft', delay: 1.2, connected: true },
	{ label: 'retreat', href: '#retreat', delay: 1.3 },
];

const locations = [
	{
		name: 'dubai',
		lines: ['office m2-368', 'bn complex,', 'al muteena, dubai, uae'],
	},
	{
		name: 'tokyo',
		lines: ['n&e bldg. 6f,', '1-12-4 ginza,', 'chuo-ku, tokyo, jpn'],
	},
];

function revealStyle(delay: number) {
	return { '--menu-delay': `${delay}s` } as CSSProperties;
}

function FlipLabel({ children }: { children: string }) {
	return (
		<span className='menu-flip'>
			<span className='menu-flip__text'>{children}</span>
			<span className='menu-flip__text menu-flip__text--clone' aria-hidden='true'>
				{children}
			</span>
		</span>
	);
}

function Menu({ onClose }: MenuProps) {
	const reduceMotion = useReducedMotion();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	return (
		<motion.nav
			id='navigation'
			className='menu-overlay'
			aria-label='Primary navigation'
			initial='hidden'
			animate='visible'
			exit='closed'
			variants={{
				hidden: { opacity: 1 },
				visible: {
					opacity: 1,
					transition: { duration: 0 },
				},
				closed: {
					opacity: 0,
					transition: {
						duration: reduceMotion ? 0.01 : 0.8,
						ease: [0.33, 1, 0.68, 1],
					},
				},
			}}
		>
			<div className='menu-overlay__glass' aria-hidden='true' />
			<div className='menu-overlay__ink' aria-hidden='true' />
			<div className='menu-overlay__body'>
				<ul className='menu-overlay__list'>
					{navItems.map((item) => (
						<li
							className={`menu-overlay__item${item.label === 'projects' ? ' has-projects' : ''}`}
							key={item.label}
						>
							<a
								className='menu-reveal'
								href={item.href}
								onClick={onClose}
								aria-current={item.current ? 'page' : undefined}
								style={revealStyle(item.delay)}
							>
								{item.current && <span className='menu-overlay__current-dot' aria-hidden='true' />}
								<FlipLabel>{item.label}</FlipLabel>
							</a>
							{item.label === 'projects' && (
								<ul className='menu-overlay__projects'>
									{projectItems.map((project) => (
										<li
											className='menu-reveal'
											key={project.label}
											style={revealStyle(project.delay)}
										>
											<a className={project.connected ? 'is-connected' : ''} href={project.href} onClick={onClose}>
												<FlipLabel>{project.label}</FlipLabel>
											</a>
										</li>
									))}
								</ul>
							)}
						</li>
					))}
				</ul>
				<a
					className='menu-overlay__privacy menu-reveal'
					href='#contact'
					onClick={onClose}
					style={revealStyle(1.7)}
				>
					<FlipLabel>privacy policy</FlipLabel>
				</a>
			</div>
			<div className='menu-overlay__footer'>
				{locations.map((location) => (
					<address key={location.name}>
						<span className='menu-reveal' style={revealStyle(1.4)}>
							{location.name}
						</span>
						{location.lines.map((line, index) => (
							<span className='menu-reveal' key={line} style={revealStyle(1.5 + index * 0.1)}>
								{line}
							</span>
						))}
					</address>
				))}
			</div>
		</motion.nav>
	);
}

export function Header({ open, onToggle }: HeaderProps) {
	return (
		<header className='site-header'>
			<a className='site-header__logo' href='#top' aria-label='Izanami home'>
				<Logo />
			</a>
			<div className='site-header__controls'>
				<div className='language-switcher' aria-label='Language selector'>
					<a className='is-active' href='#top'>
						en
					</a>
					<a href='/ja/'>ja</a>
				</div>
				<button
					className='menu-trigger'
					type='button'
					onClick={onToggle}
					aria-expanded={open}
					aria-controls='navigation'
				>
					<span className='menu-trigger__dot' aria-hidden='true' />
					<span className='menu-trigger__labels'>
						<motion.span animate={{ opacity: open ? 0 : 1 }} transition={{ duration: 0.4 }}>
							menu
						</motion.span>
						<motion.span aria-hidden={!open} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.4 }}>
							close
						</motion.span>
					</span>
				</button>
			</div>
		</header>
	);
}

Header.Menu = Menu;
