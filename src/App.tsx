import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence } from 'motion/react';
import { useLenis } from 'lenis/react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Aside } from './components/layout/Aside';
import { PageIntro } from './components/animation/PageIntro';
import { GlobalFluidText } from './components/animation/GlobalFluidText';
import { Hero } from './sections/Hero/Hero';
import { Philosophy } from './sections/Philosophy/Philosophy';
import { Projects } from './sections/Projects/Projects';
import { Company } from './sections/Company/Company';
import { HomeJourney } from './sections/HomeJourney/HomeJourney';
import './App.css';

function App() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const lenis = useLenis();
	const finishLoading = useCallback(() => setLoading(false), []);

	useEffect(() => {
		const locked = menuOpen || loading;
		document.body.style.overflow = locked ? 'hidden' : '';
		if (locked) lenis?.stop();
		else lenis?.start();

		return () => {
			document.body.style.overflow = '';
			lenis?.start();
		};
	}, [lenis, loading, menuOpen]);

	return (
		<div className='site-shell'>
			<a className='skip-link' href='#main'>
				Skip to content
			</a>
			<div className={clsx('site-content', !loading && 'is-visible')}>
				<Header open={menuOpen} onToggle={() => setMenuOpen((value) => !value)} />
				<Aside />
				<AnimatePresence>
					{menuOpen && <Header.Menu onClose={() => setMenuOpen(false)} />}
				</AnimatePresence>
				<div className={clsx('page-content', menuOpen && 'is-menu-opening')}>
					<main id='main'>
						<Hero />
						<HomeJourney>
							<Philosophy />
							<Projects />
						</HomeJourney>
						<Company />
					</main>
					<Footer />
					<GlobalFluidText />
				</div>
			</div>

			<AnimatePresence>{loading && <PageIntro onComplete={finishLoading} />}</AnimatePresence>
		</div>
	);
}

export default App;
