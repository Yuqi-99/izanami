import { useEffect, useState } from 'react';

export function useClocks() {
	const [times, setTimes] = useState({ dubai: '', tokyo: '' });
	useEffect(() => {
		const update = () =>
			setTimes({
				dubai: new Intl.DateTimeFormat('en-GB', {
					timeZone: 'Asia/Dubai',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false,
				}).format(new Date()),
				tokyo: new Intl.DateTimeFormat('en-GB', {
					timeZone: 'Asia/Tokyo',
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false,
				}).format(new Date()),
			});
		update();
		const timer = window.setInterval(update, 1000);
		return () => window.clearInterval(timer);
	}, []);
	return times;
}
