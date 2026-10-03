import { motion } from 'motion/react';
import { Logo } from '../common/Logo';

interface HeaderProps {
	open: boolean;
	onToggle: () => void;
}
const navLinks = ['home', 'philosophy', 'projects', 'company', 'contact'];

function Menu({ onClose }: { onClose: () => void }) {
	return (
		<motion.nav
			id='navigation'
			className='menu-overlay'
			aria-label='Primary navigation'
			initial={{ clipPath: 'inset(0 0 100% 0)' }}
			animate={{ clipPath: 'inset(0 0 0% 0)' }}
			exit={{ clipPath: 'inset(0 0 100% 0)' }}
			transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
		>
			<div className='menu-overlay__body'>
				<ul>
					{navLinks.map((item, index) => (
						<motion.li
							key={item}
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 + index * 0.07 }}
						>
							<a href={item === 'home' ? '#top' : `#${item}`} onClick={onClose}>
								{item}
							</a>
						</motion.li>
					))}
				</ul>
				<div className='menu-overlay__projects'>
					<a href='#school' onClick={onClose}>
						school
					</a>
					<a href='#craft' onClick={onClose}>
						craft &nbsp;–&nbsp; izanami space
					</a>
					<a href='#retreat' onClick={onClose}>
						retreat
					</a>
				</div>
			</div>
			<div className='menu-overlay__footer'>
				<address>
					<span>dubai</span>office m2-368
					<br />
					bn complex,
					<br />
					al muteena, dubai, uae
				</address>
				<address>
					<span>tokyo</span>n&amp;e bldg. 6f,
					<br />
					1-12-4 ginza,
					<br />
					chuo-ku, tokyo, jpn
				</address>
			</div>
			<a className='menu-overlay__privacy' href='#contact' onClick={onClose}>
				privacy policy
			</a>
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
					<span>{open ? 'close' : 'menu'}</span>
				</button>
			</div>
		</header>
	);
}

Header.Menu = Menu;
