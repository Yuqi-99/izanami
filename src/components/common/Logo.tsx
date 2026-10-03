interface LogoProps {
	className?: string;
}

export function Logo({ className = '' }: LogoProps) {
	return (
		<span className={`brand-mark ${className}`} aria-label='Izanami'>
			<img src='/izanami-logo.svg' alt='' />
			<span>IZANAMI</span>
		</span>
	);
}
