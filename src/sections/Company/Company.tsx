import { Reveal } from '../../components/animation/Reveal';
import { ArrowLink } from '../../components/common/ArrowLink';
import { Logo } from '../../components/common/Logo';

export function Company() {
	return (
		<section id='company' className='company-section section-shell'>
			<picture className='company-section__image'>
				<source media='(max-width: 767px)' srcSet='/images/sp_home_company_img.webp' />
				<img src='/images/home_company_img.webp' alt='' loading='lazy' />
			</picture>
			<div className='company-section__veil' />
			<h2 className='section-label'>company</h2>
			<Reveal className='company-section__content'>
				<Logo className='company-section__logo' />
				<p className='display-heading'>Who we are</p>
				<div className='body-copy company-section__descriptions'>
					<p>
						No matter how the world changes, what truly enriches human life remains the same. Across
						Japan, Dubai, and beyond, we nurture life through education, shape daily beauty through
						craft, and guide a return to oneself through healing.
					</p>
					<p>
						Across cultures and borders, we carry a way of being — ancient and quietly alive — where
						one’s inner nature is free to unfold.
					</p>
				</div>
				<ArrowLink href='#contact'>View Company</ArrowLink>
			</Reveal>
		</section>
	);
}
