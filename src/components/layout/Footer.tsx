import { useClocks } from '../../hooks/useClocks';
import { ArrowLink } from '../common/ArrowLink';

export function Footer() {
	const times = useClocks();
	return (
		<footer id='contact' className='site-footer section-shell'>
			<div className='site-footer__head'>
				<span className='section-label'>izanami</span>
				<ArrowLink href='#philosophy' revealOnScroll={false}>
					Philosophy
				</ArrowLink>
			</div>
			<div className='site-footer__body'>
				<nav aria-label='Footer navigation'>
					<a href='#top'>home</a>
					<a href='#philosophy'>philosophy</a>
					<a href='#projects'>projects</a>
					<a href='#company'>company</a>
					<a href='mailto:info@izanami-official.com'>contact</a>
				</nav>
				<div className='site-footer__links'>
					<a href='https://wa.me/817043537325' target='_blank' rel='noreferrer'>
						<span className='site-footer__social-mark' aria-hidden='true'>
							◉
						</span>
						whatsapp
					</a>
					<a href='https://www.instagram.com/moca.o64/' target='_blank' rel='noreferrer'>
						<span className='site-footer__social-mark' aria-hidden='true'>
							◎
						</span>
						instagram
					</a>
					<a href='#contact'>privacy policy</a>
				</div>
				<div className='site-footer__locations'>
					<address>
						<strong>dubai</strong>office m2-368
						<br />
						bn complex,
						<br />
						al muteena,
						<br />
						dubai, uae
					</address>
					<address>
						<strong>tokyo</strong>n&amp;e bldg. 6f,
						<br />
						1-12-4 ginza,
						<br />
						chuo-ku,
						<br />
						tokyo, jpn
					</address>
				</div>
			</div>
			<div className='site-footer__foot'>
				<small>©2026</small>
				<div>
					<span>
						<time>{times.dubai}</time> gst, dubai uae
					</span>
					<span>
						<time>{times.tokyo}</time> jst, tokyo jpn
					</span>
				</div>
				<a href='#top'>top</a>
			</div>
			<div className='site-footer__foot'>
				<p>Clone by yuqi</p>
			</div>
		</footer>
	);
}
