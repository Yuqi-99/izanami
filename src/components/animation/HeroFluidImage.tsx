import { useEffect, useRef, useState } from 'react';

interface HeroFluidImageProps {
	desktopSrc: string;
	mobileSrc: string;
	alt?: string;
}

interface ProgramBundle {
	program: WebGLProgram;
	uniforms: Record<string, WebGLUniformLocation | null>;
}

interface RenderTarget {
	texture: WebGLTexture;
	framebuffer: WebGLFramebuffer;
}

const PIXEL_BUDGET = 2_400_000;
const FIELD_SCALE = 8;
const FIELD_RADIUS = 92;
const FIELD_STRENGTH = 0.5;
const DISTORTION_STRENGTH = 0.5;

const VERTEX_SHADER = `#version 300 es
const vec2 corners[3] = vec2[3](
	vec2(-1.0, -1.0),
	vec2(3.0, -1.0),
	vec2(-1.0, 3.0)
);

void main() {
	gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;

// Cursor-field technique adapted from React Bits' Balatro component
// (Copyright David Haz, MIT + Commons Clause):
// https://github.com/DavidHDev/react-bits/tree/main/src/content/Backgrounds/Balatro
// Pointer movement is written into a small floating-point field and advected
// between two framebuffers; the output pass below samples the Izanami hero image.
const FIELD_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uPrevious;
uniform vec2 uFieldSize;
uniform vec2 uCssSize;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform vec2 uPush;
uniform float uRadius;
uniform float uDecay;

out vec4 fragColor;

void main() {
	vec2 cell = gl_FragCoord.xy / uFieldSize;
	vec2 point = vec2(cell.x, 1.0 - cell.y) * uCssSize;
	vec2 segment = uTo - uFrom;
	float segmentLength = max(dot(segment, segment), 0.000001);
	float amount = clamp(dot(point - uFrom, segment) / segmentLength, 0.0, 1.0);
	vec2 distanceFromStroke = point - uFrom - segment * amount;
	vec2 impulse = uPush * exp(-dot(distanceFromStroke, distanceFromStroke) / (uRadius * uRadius));
	vec2 source = point - impulse;
	vec2 previous = texture(
		uPrevious,
		vec2(source.x / uCssSize.x, 1.0 - source.y / uCssSize.y)
	).xy;

	fragColor = vec4((previous + impulse) * uDecay, 0.0, 1.0);
}`;

const IMAGE_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uImage;
uniform sampler2D uField;
uniform vec2 uCanvasSize;
uniform vec2 uCssSize;
uniform vec2 uImageSize;
uniform float uFieldActive;
uniform float uStrength;

out vec4 fragColor;

vec2 coverUv(vec2 uv, float viewportAspect, float imageAspect) {
	if (viewportAspect > imageAspect) {
		uv.y = (uv.y - 0.5) * (imageAspect / viewportAspect) + 0.5;
	} else {
		uv.x = (uv.x - 0.5) * (viewportAspect / imageAspect) + 0.5;
	}
	return uv;
}

void main() {
	vec2 point = vec2(
		gl_FragCoord.x / uCanvasSize.x * uCssSize.x,
		(uCanvasSize.y - gl_FragCoord.y) / uCanvasSize.y * uCssSize.y
	);

	if (uFieldActive > 0.5) {
		vec2 fieldUv = vec2(point.x / uCssSize.x, 1.0 - point.y / uCssSize.y);
		point -= texture(uField, fieldUv).xy * uStrength;
	}

	vec2 uv = point / uCssSize;
	uv = coverUv(uv, uCssSize.x / uCssSize.y, uImageSize.x / uImageSize.y);
	fragColor = texture(uImage, uv);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) return null;

	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function createProgram(
	gl: WebGL2RenderingContext,
	fragmentSource: string,
	uniformNames: string[],
): ProgramBundle | null {
	const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	if (!vertex || !fragment) {
		if (vertex) gl.deleteShader(vertex);
		if (fragment) gl.deleteShader(fragment);
		return null;
	}

	const program = gl.createProgram();
	if (!program) {
		gl.deleteShader(vertex);
		gl.deleteShader(fragment);
		return null;
	}

	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return null;
	}

	return {
		program,
		uniforms: Object.fromEntries(uniformNames.map((name) => [name, gl.getUniformLocation(program, name)])),
	};
}

function createFieldTarget(gl: WebGL2RenderingContext, width: number, height: number): RenderTarget | null {
	const texture = gl.createTexture();
	const framebuffer = gl.createFramebuffer();
	if (!texture || !framebuffer) return null;

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, width, height, 0, gl.RG, gl.HALF_FLOAT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	return { texture, framebuffer };
}

export function HeroFluidImage({ desktopSrc, mobileSrc, alt = '' }: HeroFluidImageProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [enabled, setEnabled] = useState(false);
	const [ready, setReady] = useState(false);
	const [generation, setGeneration] = useState(0);

	useEffect(() => {
		const query = window.matchMedia(
			'(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
		);
		const update = () => setEnabled(query.matches);
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	}, []);

	useEffect(() => {
		if (!enabled) return;

		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container || !canvas) return;

		const gl = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: 'high-performance',
		});
		if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) {
			return;
		}

		const fieldProgram = createProgram(gl, FIELD_SHADER, [
			'uPrevious',
			'uFieldSize',
			'uCssSize',
			'uFrom',
			'uTo',
			'uPush',
			'uRadius',
			'uDecay',
		]);
		const imageProgram = createProgram(gl, IMAGE_SHADER, [
			'uImage',
			'uField',
			'uCanvasSize',
			'uCssSize',
			'uImageSize',
			'uFieldActive',
			'uStrength',
		]);
		const vertexArray = gl.createVertexArray();
		const imageTexture = gl.createTexture();
		if (!fieldProgram || !imageProgram || !vertexArray || !imageTexture) {
			if (fieldProgram) gl.deleteProgram(fieldProgram.program);
			if (imageProgram) gl.deleteProgram(imageProgram.program);
			if (vertexArray) gl.deleteVertexArray(vertexArray);
			if (imageTexture) gl.deleteTexture(imageTexture);
			return;
		}

		let targets: RenderTarget[] = [];
		let fieldWidth = 0;
		let fieldHeight = 0;
		let cssWidth = 1;
		let cssHeight = 1;
		let imageWidth = 1;
		let imageHeight = 1;
		let imageLoaded = false;
		let frameId = 0;
		let lastTime = 0;
		let energy = 0;
		let visible = true;
		let pageVisible = document.visibilityState !== 'hidden';
		let disposed = false;
		let contextLost = false;
		const pointer = {
			x: 0,
			y: 0,
			lastX: 0,
			lastY: 0,
			inside: false,
			ready: false,
		};

		const destroyTargets = () => {
			targets.forEach((target) => {
				gl.deleteTexture(target.texture);
				gl.deleteFramebuffer(target.framebuffer);
			});
			targets = [];
			fieldWidth = 0;
			fieldHeight = 0;
			energy = 0;
		};

		const resize = () => {
			const rect = container.getBoundingClientRect();
			cssWidth = Math.max(1, rect.width);
			cssHeight = Math.max(1, rect.height);
			const requestedRatio = Math.min(window.devicePixelRatio || 1, 1.5);
			const budgetRatio = Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight));
			const ratio = Math.max(0.75, Math.min(requestedRatio, budgetRatio));
			const width = Math.max(1, Math.round(cssWidth * ratio));
			const height = Math.max(1, Math.round(cssHeight * ratio));

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
			}

			const nextFieldWidth = Math.max(8, Math.min(320, Math.ceil(cssWidth / FIELD_SCALE)));
			const nextFieldHeight = Math.max(8, Math.min(320, Math.ceil(cssHeight / FIELD_SCALE)));
			if (nextFieldWidth !== fieldWidth || nextFieldHeight !== fieldHeight) {
				destroyTargets();
				fieldWidth = nextFieldWidth;
				fieldHeight = nextFieldHeight;
				const first = createFieldTarget(gl, fieldWidth, fieldHeight);
				const second = createFieldTarget(gl, fieldWidth, fieldHeight);
				if (first && second) targets = [first, second];
			}
		};

		const renderField = (
			fromX: number,
			fromY: number,
			toX: number,
			toY: number,
			pushX: number,
			pushY: number,
			decay: number,
		) => {
			if (targets.length !== 2) return;
			const [read, write] = targets;
			const uniforms = fieldProgram.uniforms;
			gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
			gl.viewport(0, 0, fieldWidth, fieldHeight);
			gl.useProgram(fieldProgram.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, read.texture);
			gl.uniform1i(uniforms.uPrevious, 0);
			gl.uniform2f(uniforms.uFieldSize, fieldWidth, fieldHeight);
			gl.uniform2f(uniforms.uCssSize, cssWidth, cssHeight);
			gl.uniform2f(uniforms.uFrom, fromX, fromY);
			gl.uniform2f(uniforms.uTo, toX, toY);
			gl.uniform2f(uniforms.uPush, pushX, pushY);
			gl.uniform1f(uniforms.uRadius, FIELD_RADIUS);
			gl.uniform1f(uniforms.uDecay, decay);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			targets = [write, read];
		};

		const renderImage = (fieldActive: boolean) => {
			if (!imageLoaded) return;
			const uniforms = imageProgram.uniforms;
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(imageProgram.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, imageTexture);
			gl.uniform1i(uniforms.uImage, 0);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, targets[0]?.texture ?? null);
			gl.uniform1i(uniforms.uField, 1);
			gl.uniform2f(uniforms.uCanvasSize, canvas.width, canvas.height);
			gl.uniform2f(uniforms.uCssSize, cssWidth, cssHeight);
			gl.uniform2f(uniforms.uImageSize, imageWidth, imageHeight);
			gl.uniform1f(uniforms.uFieldActive, fieldActive ? 1 : 0);
			gl.uniform1f(uniforms.uStrength, DISTORTION_STRENGTH);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		};

		const frame = (now: number) => {
			frameId = 0;
			if (disposed || contextLost || !visible || !pageVisible || !imageLoaded) return;

			const deltaTime = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000 || 1 / 60));
			lastTime = now;
			const deltaX = pointer.x - pointer.lastX;
			const deltaY = pointer.y - pointer.lastY;
			const moved = pointer.ready && pointer.inside && (deltaX !== 0 || deltaY !== 0);
			const decay = Math.exp(-deltaTime / 1.35);

			if (targets.length === 2 && (moved || energy > 0.04)) {
				const travel = moved ? Math.hypot(deltaX, deltaY) * FIELD_STRENGTH : 0;
				const steps = Math.max(1, Math.ceil(travel / (FIELD_RADIUS * 0.28)));
				for (let step = 0; step < steps; step += 1) {
					const from = step / steps;
					const to = (step + 1) / steps;
					renderField(
						pointer.lastX + deltaX * from,
						pointer.lastY + deltaY * from,
						pointer.lastX + deltaX * to,
						pointer.lastY + deltaY * to,
						moved ? deltaX * (to - from) * FIELD_STRENGTH : 0,
						moved ? deltaY * (to - from) * FIELD_STRENGTH : 0,
						step === steps - 1 ? decay : 1,
					);
				}
				energy = energy * decay + travel;
				if (energy <= 0.04) energy = 0;
			}

			pointer.lastX = pointer.x;
			pointer.lastY = pointer.y;
			renderImage(energy > 0.04);
			if (energy > 0.04) frameId = window.requestAnimationFrame(frame);
		};

		const wake = () => {
			if (frameId || disposed || contextLost || !visible || !pageVisible || !imageLoaded) return;
			lastTime = performance.now();
			frameId = window.requestAnimationFrame(frame);
		};

		const locatePointer = (event: PointerEvent) => {
			const rect = container.getBoundingClientRect();
			return {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
				inside:
					event.clientX >= rect.left &&
					event.clientX <= rect.right &&
					event.clientY >= rect.top &&
					event.clientY <= rect.bottom,
			};
		};

		const onPointerMove = (event: PointerEvent) => {
			const point = locatePointer(event);
			if (!pointer.ready || !pointer.inside) {
				pointer.lastX = point.x;
				pointer.lastY = point.y;
			}
			pointer.x = point.x;
			pointer.y = point.y;
			pointer.inside = point.inside;
			pointer.ready = true;
			wake();
		};

		const onPointerLeave = () => {
			pointer.inside = false;
			wake();
		};

		const onVisibilityChange = () => {
			pageVisible = document.visibilityState !== 'hidden';
			wake();
		};

		const onContextLost = (event: Event) => {
			event.preventDefault();
			contextLost = true;
			window.cancelAnimationFrame(frameId);
			frameId = 0;
			setReady(false);
		};

		const onContextRestored = () => setGeneration((value) => value + 1);

		gl.bindVertexArray(vertexArray);
		gl.bindTexture(gl.TEXTURE_2D, imageTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		const image = new Image();
		image.decoding = 'async';
		image.onload = () => {
			if (disposed || contextLost) return;
			imageWidth = image.naturalWidth;
			imageHeight = image.naturalHeight;
			gl.bindTexture(gl.TEXTURE_2D, imageTexture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			imageLoaded = true;
			resize();
			renderImage(false);
			setReady(true);
		};
		image.src = desktopSrc;

		const onResize = () => {
			resize();
			renderImage(energy > 0.04);
			wake();
		};

		const heroSection = container.closest('.hero-section');
		const intersectionObserver = new IntersectionObserver((entries) => {
			visible = entries.some((entry) => entry.isIntersecting);
			if (!visible) {
				pointer.inside = false;
				energy = 0;
			}
			wake();
		});
		if (heroSection) intersectionObserver.observe(heroSection);

		window.addEventListener('pointermove', onPointerMove, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });
		document.documentElement.addEventListener('pointerleave', onPointerLeave);
		document.addEventListener('visibilitychange', onVisibilityChange);
		canvas.addEventListener('webglcontextlost', onContextLost);
		canvas.addEventListener('webglcontextrestored', onContextRestored);
		resize();

		return () => {
			disposed = true;
			image.onload = null;
			window.cancelAnimationFrame(frameId);
			intersectionObserver.disconnect();
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('resize', onResize);
			document.documentElement.removeEventListener('pointerleave', onPointerLeave);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			canvas.removeEventListener('webglcontextlost', onContextLost);
			canvas.removeEventListener('webglcontextrestored', onContextRestored);

			if (!gl.isContextLost()) {
				destroyTargets();
				gl.deleteTexture(imageTexture);
				gl.deleteVertexArray(vertexArray);
				gl.deleteProgram(fieldProgram.program);
				gl.deleteProgram(imageProgram.program);
			}
		};
	}, [desktopSrc, enabled, generation]);

	return (
		<div
			ref={containerRef}
			className={`hero-fluid-image${ready && enabled ? ' is-ready' : ''}`}
			data-fluid-text-skip
		>
			<picture className='hero-fluid-image__fallback'>
				<source media='(max-width: 767px)' srcSet={mobileSrc} />
				<img src={desktopSrc} alt={alt} fetchPriority='high' />
			</picture>
			<canvas ref={canvasRef} className='hero-fluid-image__canvas' aria-hidden='true' />
		</div>
	);
}
