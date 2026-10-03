interface LogoProps {
	className?: string;
}

export function Logo({ className = '' }: LogoProps) {
	return (
		<span className={`brand-mark ${className}`} aria-label='Izanami'>
			<img src='/izanami-logo.svg' alt='' />
			<span className='text-[12px] font-bold text-white'>IZANAMI</span>
		</span>
	);
}
