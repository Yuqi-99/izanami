import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Aside } from './components/layout/Aside';
import { Hero } from './sections/Hero/Hero';
import { Philosophy } from './sections/Philosophy/Philosophy';
import { Projects } from './sections/Projects/Projects';
import { Company } from './sections/Company/Company';
import './App.css';

function App() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		document.body.style.overflow = menuOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [menuOpen]);

	useEffect(() => {
		const timer = window.setTimeout(() => setLoading(false), 1800);
		return () => window.clearTimeout(timer);
	}, []);

	return (
		<div className='site-shell'>
			<a className='skip-link' href='#main'>
				Skip to content
			</a>
			<Header open={menuOpen} onToggle={() => setMenuOpen((value) => !value)} />
			<Aside />
			<AnimatePresence>
				{menuOpen && <Header.Menu onClose={() => setMenuOpen(false)} />}
			</AnimatePresence>
			<main id='main'>
				<Hero />
				<Philosophy />
				<Projects />
				<Company />
			</main>
			<Footer />
			<AnimatePresence>
				{loading && (
					<motion.div
						aria-hidden='true'
						className='page-intro'
						initial={{ clipPath: 'inset(0 0 0 0)' }}
						exit={{ clipPath: 'inset(0 0 100% 0)' }}
						transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
					>
						<span className='page-intro__title'>Remember who you are</span>
						<motion.span
							className='page-intro__number'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.4 }}
						>
							100
						</motion.span>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default App;
