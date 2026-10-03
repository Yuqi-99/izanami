import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Aside } from './components/layout/Aside';
import { PageIntro } from './components/animation/PageIntro';
import { Hero } from './sections/Hero/Hero';
import { Philosophy } from './sections/Philosophy/Philosophy';
import { Projects } from './sections/Projects/Projects';
import { Company } from './sections/Company/Company';
import './App.css';

function App() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const finishLoading = useCallback(() => setLoading(false), []);

	useEffect(() => {
		document.body.style.overflow = menuOpen || loading ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [loading, menuOpen]);

	return (
		<div className='site-shell'>
			<a className='skip-link' href='#main'>
				Skip to content
			</a>
			<div className={`site-content${loading ? '' : ' is-visible'}`}>
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
			</div>
			<AnimatePresence>{loading && <PageIntro onComplete={finishLoading} />}</AnimatePresence>
		</div>
	);
}

export default App;
