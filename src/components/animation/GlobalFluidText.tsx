import { useEffect, useRef, useState } from 'react';

interface ProgramBundle {
	program: WebGLProgram;
	uniforms: Record<string, WebGLUniformLocation | null>;
}

interface RenderTarget {
	texture: WebGLTexture;
	framebuffer: WebGLFramebuffer;
}

interface DoubleTarget {
	read: RenderTarget;
	write: RenderTarget;
}

const SOURCE_PIXEL_BUDGET = 2_000_000;
const FLUID_PIXEL_BUDGET = 850_000;
const CURSOR_SIZE = 0.5;
const CURSOR_POWER = 25;
const DISTORTION_POWER = 0.5;
const SNAPSHOT_INTERVAL = 72;
const EXCLUDED_SELECTOR = '[data-fluid-disabled]';

const VERTEX_SHADER = `#version 300 es
precision highp float;

const vec2 corners[3] = vec2[3](
	vec2(-1.0, -1.0),
	vec2(3.0, -1.0),
	vec2(-1.0, 3.0)
);

uniform vec2 uTexel;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;

void main() {
	vec2 position = corners[gl_VertexID];
	vUv = position * 0.5 + 0.5;
	vL = vUv - vec2(uTexel.x, 0.0);
	vR = vUv + vec2(uTexel.x, 0.0);
	vT = vUv + vec2(0.0, uTexel.y);
	vB = vUv - vec2(0.0, uTexel.y);
	gl_Position = vec4(position, 0.0, 1.0);
}`;

// This mirrors the stable-fluids stages and values used by the original
// Izanami post effect. The scene texture is still generated from this app's
// DOM, keeping the existing layout, links and reveal animations intact.
const SPLAT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uInput;
uniform vec3 uPointValue;
uniform vec2 uPoint;
uniform float uRatio;
uniform float uPointSize;
in vec2 vUv;
out vec4 fragColor;
void main() {
	vec2 p = vUv - uPoint;
	p.x *= uRatio;
	vec3 splat = 0.6 * exp2(-dot(p, p) / uPointSize) * uPointValue;
	fragColor = vec4(texture(uInput, vUv).xyz + splat, 1.0);
}`;

const DIVERGENCE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uVelocity;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
void main() {
	float L = texture(uVelocity, vL).x;
	float R = texture(uVelocity, vR).x;
	float T = texture(uVelocity, vT).y;
	float B = texture(uVelocity, vB).y;
	fragColor = vec4(0.25 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const PRESSURE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
void main() {
	float L = texture(uPressure, vL).x;
	float R = texture(uPressure, vR).x;
	float T = texture(uPressure, vT).x;
	float B = texture(uPressure, vB).x;
	float divergence = texture(uDivergence, vUv).x;
	fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
void main() {
	float L = texture(uPressure, vL).x;
	float R = texture(uPressure, vR).x;
	float T = texture(uPressure, vT).x;
	float B = texture(uPressure, vB).x;
	vec2 velocity = texture(uVelocity, vUv).xy;
	velocity -= vec2(R - L, T - B);
	fragColor = vec4(velocity, 0.0, 1.0);
}`;

const ADVECTION_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uVelocity;
uniform sampler2D uInput;
uniform vec2 uTexel;
uniform vec2 uOutputTexel;
uniform float uDt;
uniform float uDissipation;
in vec2 vUv;
out vec4 fragColor;

vec4 bilerp(sampler2D source, vec2 uv, vec2 texel) {
	vec2 st = uv / texel - 0.5;
	vec2 index = floor(st);
	vec2 fraction = fract(st);
	vec4 a = texture(source, (index + vec2(0.5, 0.5)) * texel);
	vec4 b = texture(source, (index + vec2(1.5, 0.5)) * texel);
	vec4 c = texture(source, (index + vec2(0.5, 1.5)) * texel);
	vec4 d = texture(source, (index + vec2(1.5, 1.5)) * texel);
	return mix(mix(a, b, fraction.x), mix(c, d, fraction.x), fraction.y);
}

void main() {
	vec2 coordinate = vUv - uDt * bilerp(uVelocity, vUv, uTexel).xy * uTexel;
	fragColor = uDissipation * bilerp(uInput, coordinate, uOutputTexel);
}`;

const OUTPUT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform sampler2D uVelocity;
uniform sampler2D uOutput;
uniform float uDisturbPower;
in vec2 vUv;
out vec4 fragColor;
void main() {
	float offset = texture(uOutput, vUv).r;
	vec2 velocity = texture(uVelocity, vUv).xy + 0.001;
	vec2 direction = normalize(velocity);
	vec2 displacedFluidUv = vUv - uDisturbPower * direction * offset;
	displacedFluidUv -= uDisturbPower * direction * offset;
	vec2 displacedSourceUv = vec2(displacedFluidUv.x, 1.0 - displacedFluidUv.y);
	vec4 displaced = texture(uSource, displacedSourceUv);
	float fieldMask = smoothstep(0.00025, 0.0075, abs(offset));
	fragColor = vec4(displaced.rgb, fieldMask);
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
	uniformNames: string[]
): ProgramBundle | null {
	const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	if (!vertex || !fragment) return null;
	const program = gl.createProgram();
	if (!program) return null;
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
		uniforms: Object.fromEntries(
			['uTexel', ...uniformNames].map((name) => [name, gl.getUniformLocation(program, name)])
		),
	};
}

function createTarget(gl: WebGL2RenderingContext, width: number, height: number) {
	const texture = gl.createTexture();
	const framebuffer = gl.createFramebuffer();
	if (!texture || !framebuffer) return null;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	return { texture, framebuffer } satisfies RenderTarget;
}

function createDoubleTarget(gl: WebGL2RenderingContext, width: number, height: number) {
	const read = createTarget(gl, width, height);
	const write = createTarget(gl, width, height);
	return read && write ? ({ read, write } satisfies DoubleTarget) : null;
}

function swap(target: DoubleTarget) {
	const previous = target.read;
	target.read = target.write;
	target.write = previous;
}

function effectiveOpacity(element: HTMLElement, root: HTMLElement) {
	let opacity = 1;
	let current: HTMLElement | null = element;
	while (current) {
		if (current.matches(EXCLUDED_SELECTOR)) return 0;
		const style = window.getComputedStyle(current);
		if (style.display === 'none' || style.visibility === 'hidden') return 0;
		opacity *= Number.parseFloat(style.opacity || '1');
		if (current === root || opacity < 0.025) break;
		current = current.parentElement;
	}
	return opacity;
}

function clipIsOpen(clipPath: string) {
	if (!clipPath || clipPath === 'none') return true;
	if (!clipPath.startsWith('inset(')) return false;
	const values = clipPath.match(/-?\d*\.?\d+/g)?.map(Number.parseFloat) ?? [];
	return values.every((value) => Math.abs(value) < 0.01);
}

function clippedRect(element: HTMLElement, source: DOMRect) {
	let left = source.left;
	let top = source.top;
	let right = source.right;
	let bottom = source.bottom;
	let current = element.parentElement;
	while (current && current !== document.body) {
		if (current.matches(EXCLUDED_SELECTOR)) return null;
		const style = window.getComputedStyle(current);
		if (!clipIsOpen(style.clipPath)) return null;
		if (/hidden|clip/.test(`${style.overflow}${style.overflowX}${style.overflowY}`)) {
			const bounds = current.getBoundingClientRect();
			left = Math.max(left, bounds.left);
			top = Math.max(top, bounds.top);
			right = Math.min(right, bounds.right);
			bottom = Math.min(bottom, bounds.bottom);
			if (right <= left || bottom <= top) return null;
		}
		current = current.parentElement;
	}
	return { left, top, right, bottom };
}

function objectPosition(value: string) {
	const parts = value.split(/\s+/);
	const parse = (part: string | undefined) => {
		if (!part || part === 'center') return 0.5;
		if (part === 'left' || part === 'top') return 0;
		if (part === 'right' || part === 'bottom') return 1;
		return part.endsWith('%') ? Math.max(0, Math.min(1, Number.parseFloat(part) / 100)) : 0.5;
	};
	return [parse(parts[0]), parse(parts[1])] as const;
}

function drawImages(
	context: CanvasRenderingContext2D,
	root: HTMLElement,
	width: number,
	height: number
) {
	// Fixed navigation sits above the scene, despite appearing first in DOM order.
	const images = Array.from(root.querySelectorAll<HTMLImageElement>('img')).sort(
		(a, b) => Number(Boolean(a.closest('.brand-mark'))) - Number(Boolean(b.closest('.brand-mark')))
	);
	images.forEach((image) => {
		if (
			!image.complete ||
			image.naturalWidth === 0 ||
			image.closest(`${EXCLUDED_SELECTOR}, [data-fluid-text-skip]`)
		)
			return;
		const style = window.getComputedStyle(image);
		const rect = image.getBoundingClientRect();
		const clipped = clippedRect(image, rect);
		const opacity = effectiveOpacity(image, root);
		if (
			!clipped ||
			opacity <= 0.025 ||
			!clipIsOpen(style.clipPath) ||
			rect.right <= 0 ||
			rect.left >= width ||
			rect.bottom <= 0 ||
			rect.top >= height
		)
			return;

		let sourceX = 0;
		let sourceY = 0;
		let sourceWidth = image.naturalWidth;
		let sourceHeight = image.naturalHeight;
		if (style.objectFit === 'cover') {
			const sourceAspect = image.naturalWidth / image.naturalHeight;
			const targetAspect = rect.width / rect.height;
			const [positionX, positionY] = objectPosition(style.objectPosition);
			if (sourceAspect > targetAspect) {
				sourceWidth = image.naturalHeight * targetAspect;
				sourceX = (image.naturalWidth - sourceWidth) * positionX;
			} else {
				sourceHeight = image.naturalWidth / targetAspect;
				sourceY = (image.naturalHeight - sourceHeight) * positionY;
			}
		}
		context.save();
		context.globalAlpha = Math.min(1, opacity);
		context.beginPath();
		context.rect(
			clipped.left,
			clipped.top,
			clipped.right - clipped.left,
			clipped.bottom - clipped.top
		);
		context.clip();
		context.drawImage(
			image,
			sourceX,
			sourceY,
			sourceWidth,
			sourceHeight,
			rect.left,
			rect.top,
			rect.width,
			rect.height
		);
		context.restore();
		// Include the scene's darkening layer in the displaced texture.
		const shade = image
			.closest('.journey-backdrop__fixed, .company-section')
			?.querySelector<HTMLElement>('.journey-backdrop__shade, .company-section__veil');
		if (shade) {
			const shadeStyle = window.getComputedStyle(shade);
			context.save();
			context.globalAlpha = effectiveOpacity(shade, root);
			context.fillStyle = shadeStyle.backgroundColor;
			context.fillRect(
				clipped.left,
				clipped.top,
				clipped.right - clipped.left,
				clipped.bottom - clipped.top
			);
			context.restore();
		}
	});
}

function drawSnapshot(
	context: CanvasRenderingContext2D,
	root: HTMLElement,
	width: number,
	height: number,
	ratio: number
) {
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	context.setTransform(ratio, 0, 0, ratio, 0, 0);
	// An opaque scene erases the original glyph underneath its displaced copy.
	// A transparent snapshot only adds a second glyph and produces a ghost trail.
	context.fillStyle = window.getComputedStyle(document.body).backgroundColor;
	context.fillRect(0, 0, width, height);
	drawImages(context, root, width, height);
	const range = document.createRange();
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	let node = walker.nextNode();
	while (node) {
		const element = node.parentElement;
		const value = node.nodeValue ?? '';
		if (
			element &&
			value.trim() &&
			!element.closest(`svg, canvas, script, style, ${EXCLUDED_SELECTOR}, [data-fluid-text-skip]`)
		) {
			const style = window.getComputedStyle(element);
			const elementRect = element.getBoundingClientRect();
			const opacity = effectiveOpacity(element, root);
			if (
				opacity > 0.025 &&
				clipIsOpen(style.clipPath) &&
				elementRect.right > -16 &&
				elementRect.left < width + 16 &&
				elementRect.bottom > -16 &&
				elementRect.top < height + 16
			) {
				const size = Number.parseFloat(style.fontSize) || 16;
				const scaleY = element.offsetHeight > 0 ? elementRect.height / element.offsetHeight : 1;
				const renderedSize = size * Math.max(0.5, Math.min(2, scaleY || 1));
				context.font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${renderedSize}px ${style.fontFamily}`;
				context.fillStyle = style.color;
				context.globalAlpha = Math.min(1, opacity);
				for (let index = 0; index < value.length; index += 1) {
					const code = value.charCodeAt(index);
					const length = code >= 0xd800 && code <= 0xdbff ? 2 : 1;
					const character = value.slice(index, index + length);
					if (/\s/.test(character)) {
						index += length - 1;
						continue;
					}
					range.setStart(node, index);
					range.setEnd(node, Math.min(value.length, index + length));
					const rect = range.getBoundingClientRect();
					const clipped = clippedRect(element, rect);
					if (
						clipped &&
						rect.width > 0 &&
						rect.height > 0 &&
						rect.bottom > 0 &&
						rect.top < height
					) {
						let output = character;
						if (style.textTransform === 'uppercase') output = output.toUpperCase();
						if (style.textTransform === 'lowercase') output = output.toLowerCase();
						const metrics = context.measureText(output);
						const ascent = metrics.actualBoundingBoxAscent || renderedSize * 0.76;
						const descent = metrics.actualBoundingBoxDescent || renderedSize * 0.2;
						const centerX = rect.left + rect.width / 2;
						const centerY = rect.top + rect.height / 2;
						context.save();
						context.beginPath();
						context.rect(
							clipped.left,
							clipped.top,
							clipped.right - clipped.left,
							clipped.bottom - clipped.top
						);
						context.clip();
						if (style.writingMode.startsWith('vertical')) {
							context.translate(centerX, centerY);
							context.rotate(Math.PI / 2);
							context.fillText(output, -metrics.width / 2, (ascent - descent) / 2);
						} else {
							context.fillText(
								output,
								centerX - metrics.width / 2,
								centerY + (ascent - descent) / 2
							);
						}
						context.restore();
					}
					index += length - 1;
				}
			}
		}
		node = walker.nextNode();
	}
	range.detach();
	context.globalAlpha = 1;
}

export function GlobalFluidText() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [enabled, setEnabled] = useState(false);
	const [generation, setGeneration] = useState(0);

	useEffect(() => {
		const query = window.matchMedia(
			'(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
		);
		const update = () => setEnabled(query.matches);
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	}, []);

	useEffect(() => {
		if (!enabled) return;
		const canvas = canvasRef.current;
		const root = document.querySelector<HTMLElement>('.site-content');
		if (!canvas || !root) return;
		const gl = canvas.getContext('webgl2', {
			alpha: true,
			antialias: false,
			depth: false,
			stencil: false,
			premultipliedAlpha: false,
			powerPreference: 'high-performance',
		});
		if (!gl || !gl.getExtension('EXT_color_buffer_float')) return;

		const splatProgram = createProgram(gl, SPLAT_SHADER, [
			'uInput',
			'uPointValue',
			'uPoint',
			'uRatio',
			'uPointSize',
		]);
		const divergenceProgram = createProgram(gl, DIVERGENCE_SHADER, ['uVelocity']);
		const pressureProgram = createProgram(gl, PRESSURE_SHADER, ['uPressure', 'uDivergence']);
		const gradientProgram = createProgram(gl, GRADIENT_SHADER, ['uPressure', 'uVelocity']);
		const advectionProgram = createProgram(gl, ADVECTION_SHADER, [
			'uVelocity',
			'uInput',
			'uOutputTexel',
			'uDt',
			'uDissipation',
		]);
		const outputProgram = createProgram(gl, OUTPUT_SHADER, [
			'uSource',
			'uVelocity',
			'uOutput',
			'uDisturbPower',
		]);
		const vertexArray = gl.createVertexArray();
		const sourceTexture = gl.createTexture();
		const sourceCanvas = document.createElement('canvas');
		const sourceContext = sourceCanvas.getContext('2d', { alpha: true });
		const programs = [
			splatProgram,
			divergenceProgram,
			pressureProgram,
			gradientProgram,
			advectionProgram,
			outputProgram,
		];
		if (programs.some((program) => !program) || !vertexArray || !sourceTexture || !sourceContext)
			return;

		const splat = splatProgram as ProgramBundle;
		const divergence = divergenceProgram as ProgramBundle;
		const pressure = pressureProgram as ProgramBundle;
		const gradient = gradientProgram as ProgramBundle;
		const advection = advectionProgram as ProgramBundle;
		const output = outputProgram as ProgramBundle;
		let velocity: DoubleTarget | null = null;
		let dye: DoubleTarget | null = null;
		let pressureField: DoubleTarget | null = null;
		let divergenceField: RenderTarget | null = null;
		let fluidWidth = 1;
		let fluidHeight = 1;
		let cssWidth = 1;
		let cssHeight = 1;
		let sourceRatio = 1;
		let sourceTextureWidth = 0;
		let sourceTextureHeight = 0;
		let frameId = 0;
		let lastSnapshot = 0;
		let liveSnapshotUntil = 0;
		let energy = 0;
		let snapshotDirty = true;
		let pageVisible = document.visibilityState !== 'hidden';
		let disposed = false;
		let contextLost = false;
		let wasExcluded = false;
		const pointer = { x: 0, y: 0, lastX: 0, lastY: 0, ready: false, inside: false, moved: false };

		const allTargets = () =>
			[
				velocity?.read,
				velocity?.write,
				dye?.read,
				dye?.write,
				pressureField?.read,
				pressureField?.write,
				divergenceField,
			].filter(Boolean) as RenderTarget[];
		const destroyTargets = () => {
			allTargets().forEach((target) => {
				gl.deleteTexture(target.texture);
				gl.deleteFramebuffer(target.framebuffer);
			});
			velocity = null;
			dye = null;
			pressureField = null;
			divergenceField = null;
		};
		const clearFluid = () => {
			gl.disable(gl.BLEND);
			gl.clearColor(0, 0, 0, 0);
			allTargets().forEach((target) => {
				gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
				gl.clear(gl.COLOR_BUFFER_BIT);
			});
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.clear(gl.COLOR_BUFFER_BIT);
			energy = 0;
		};
		const bindTexture = (
			uniform: WebGLUniformLocation | null,
			unit: number,
			texture: WebGLTexture
		) => {
			gl.activeTexture(gl.TEXTURE0 + unit);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(uniform, unit);
		};
		const pass = (program: ProgramBundle, target: RenderTarget | null) => {
			if (target) gl.disable(gl.BLEND);
			gl.bindFramebuffer(gl.FRAMEBUFFER, target?.framebuffer ?? null);
			gl.viewport(0, 0, target ? fluidWidth : canvas.width, target ? fluidHeight : canvas.height);
			gl.useProgram(program.program);
			gl.uniform2f(program.uniforms.uTexel, 1 / fluidWidth, 1 / fluidHeight);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		};

		const uploadSnapshot = () => {
			drawSnapshot(sourceContext, root, cssWidth, cssHeight, sourceRatio);
			gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
			if (
				sourceTextureWidth !== sourceCanvas.width ||
				sourceTextureHeight !== sourceCanvas.height
			) {
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
				sourceTextureWidth = sourceCanvas.width;
				sourceTextureHeight = sourceCanvas.height;
			} else {
				gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
			}
			snapshotDirty = false;
		};

		const resize = () => {
			cssWidth = Math.max(1, window.innerWidth);
			cssHeight = Math.max(1, window.innerHeight);
			const requestedRatio = Math.min(window.devicePixelRatio || 1, 1.35);
			sourceRatio = Math.max(
				0.75,
				Math.min(requestedRatio, Math.sqrt(SOURCE_PIXEL_BUDGET / (cssWidth * cssHeight)))
			);
			canvas.width = Math.max(1, Math.round(cssWidth * sourceRatio));
			canvas.height = Math.max(1, Math.round(cssHeight * sourceRatio));
			sourceCanvas.width = canvas.width;
			sourceCanvas.height = canvas.height;
			const fluidRatio = Math.min(1, Math.sqrt(FLUID_PIXEL_BUDGET / (cssWidth * cssHeight)));
			const nextWidth = Math.max(64, Math.round(cssWidth * fluidRatio));
			const nextHeight = Math.max(64, Math.round(cssHeight * fluidRatio));
			if (nextWidth !== fluidWidth || nextHeight !== fluidHeight) {
				destroyTargets();
				fluidWidth = nextWidth;
				fluidHeight = nextHeight;
				velocity = createDoubleTarget(gl, fluidWidth, fluidHeight);
				dye = createDoubleTarget(gl, fluidWidth, fluidHeight);
				pressureField = createDoubleTarget(gl, fluidWidth, fluidHeight);
				divergenceField = createTarget(gl, fluidWidth, fluidHeight);
			}
			snapshotDirty = true;
		};

		const inject = (field: DoubleTarget, valueX: number, valueY: number) => {
			gl.useProgram(splat.program);
			bindTexture(splat.uniforms.uInput, 0, field.read.texture);
			gl.uniform3f(splat.uniforms.uPointValue, valueX, valueY, 0);
			gl.uniform2f(splat.uniforms.uPoint, pointer.x / cssWidth, 1 - pointer.y / cssHeight);
			gl.uniform1f(splat.uniforms.uRatio, cssWidth / cssHeight);
			gl.uniform1f(splat.uniforms.uPointSize, CURSOR_SIZE * 0.001);
			pass(splat, field.write);
			swap(field);
		};

		const simulate = () => {
			if (!velocity || !dye || !pressureField || !divergenceField) return;
			if (pointer.moved) {
				inject(velocity, 6 * (pointer.x - pointer.lastX), -6 * (pointer.y - pointer.lastY));
				inject(dye, CURSOR_POWER * 0.001, 0);
				pointer.moved = false;
			}
			gl.useProgram(divergence.program);
			bindTexture(divergence.uniforms.uVelocity, 0, velocity.read.texture);
			pass(divergence, divergenceField);
			gl.useProgram(pressure.program);
			bindTexture(pressure.uniforms.uPressure, 0, pressureField.read.texture);
			bindTexture(pressure.uniforms.uDivergence, 1, divergenceField.texture);
			pass(pressure, pressureField.write);
			swap(pressureField);
			gl.useProgram(gradient.program);
			bindTexture(gradient.uniforms.uPressure, 0, pressureField.read.texture);
			bindTexture(gradient.uniforms.uVelocity, 1, velocity.read.texture);
			pass(gradient, velocity.write);
			swap(velocity);
			gl.useProgram(advection.program);
			bindTexture(advection.uniforms.uVelocity, 0, velocity.read.texture);
			bindTexture(advection.uniforms.uInput, 1, velocity.read.texture);
			gl.uniform2f(advection.uniforms.uOutputTexel, 1 / fluidWidth, 1 / fluidHeight);
			gl.uniform1f(advection.uniforms.uDt, 1 / 60);
			gl.uniform1f(advection.uniforms.uDissipation, 0.97);
			pass(advection, velocity.write);
			swap(velocity);
			gl.useProgram(advection.program);
			bindTexture(advection.uniforms.uVelocity, 0, velocity.read.texture);
			bindTexture(advection.uniforms.uInput, 1, dye.read.texture);
			gl.uniform2f(advection.uniforms.uOutputTexel, 1 / fluidWidth, 1 / fluidHeight);
			gl.uniform1f(advection.uniforms.uDt, 8 / 60);
			gl.uniform1f(advection.uniforms.uDissipation, 0.98);
			pass(advection, dye.write);
			swap(dye);
		};

		const renderOutput = () => {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			if (!velocity || !dye || energy <= 0.004) return;
			// The browser composites this straight-alpha canvas with the DOM once.
			gl.disable(gl.BLEND);
			gl.useProgram(output.program);
			bindTexture(output.uniforms.uSource, 0, sourceTexture);
			bindTexture(output.uniforms.uVelocity, 1, velocity.read.texture);
			bindTexture(output.uniforms.uOutput, 2, dye.read.texture);
			gl.uniform1f(output.uniforms.uDisturbPower, DISTORTION_POWER);
			pass(output, null);
		};

		const frame = (now: number) => {
			frameId = 0;
			if (disposed || contextLost || !pageVisible) return;
			if (pointer.moved || energy > 0.004) {
				simulate();
				energy *= 0.98;
				if (energy <= 0.004) energy = 0;
			}
			if (
				energy > 0.004 &&
				(snapshotDirty || now < liveSnapshotUntil) &&
				now - lastSnapshot >= SNAPSHOT_INTERVAL
			) {
				uploadSnapshot();
				lastSnapshot = now;
			}
			pointer.lastX = pointer.x;
			pointer.lastY = pointer.y;
			renderOutput();
			if (energy > 0.004) frameId = window.requestAnimationFrame(frame);
		};

		const wake = () => {
			if (!frameId && !disposed && !contextLost && pageVisible)
				frameId = window.requestAnimationFrame(frame);
		};
		const pointIsExcluded = (y: number) =>
			Array.from(document.querySelectorAll<HTMLElement>(EXCLUDED_SELECTOR)).some((element) => {
				const rect = element.getBoundingClientRect();
				return rect.top <= y && rect.bottom >= y;
			});
		const onPointerMove = (event: PointerEvent) => {
			if (pointIsExcluded(event.clientY)) {
				if (!wasExcluded) clearFluid();
				wasExcluded = true;
				pointer.inside = false;
				pointer.moved = false;
				pointer.lastX = pointer.x = event.clientX;
				pointer.lastY = pointer.y = event.clientY;
				wake();
				return;
			}
			wasExcluded = false;
			if (!pointer.ready || !pointer.inside) {
				pointer.lastX = event.clientX;
				pointer.lastY = event.clientY;
			}
			pointer.x = event.clientX;
			pointer.y = event.clientY;
			pointer.ready = true;
			pointer.inside = true;
			pointer.moved = pointer.x !== pointer.lastX || pointer.y !== pointer.lastY;
			if (pointer.moved) energy = 1;
			liveSnapshotUntil = performance.now() + 950;
			wake();
		};
		const onLayoutChange = () => {
			if (pointer.ready && pointIsExcluded(pointer.y)) {
				if (!wasExcluded) clearFluid();
				wasExcluded = true;
			}
			snapshotDirty = true;
			liveSnapshotUntil = performance.now() + 180;
			wake();
		};
		const onResize = () => {
			resize();
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
		};
		const onContextRestored = () => setGeneration((value) => value + 1);

		gl.bindVertexArray(vertexArray);
		gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		const mutationObserver = new MutationObserver(onLayoutChange);
		mutationObserver.observe(root, { childList: true, subtree: true, characterData: true });
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });
		window.addEventListener('scroll', onLayoutChange, { passive: true });
		document.addEventListener('visibilitychange', onVisibilityChange);
		canvas.addEventListener('webglcontextlost', onContextLost);
		canvas.addEventListener('webglcontextrestored', onContextRestored);
		void document.fonts.ready.then(onLayoutChange);
		resize();

		return () => {
			disposed = true;
			window.cancelAnimationFrame(frameId);
			mutationObserver.disconnect();
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('scroll', onLayoutChange);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			canvas.removeEventListener('webglcontextlost', onContextLost);
			canvas.removeEventListener('webglcontextrestored', onContextRestored);
			if (!gl.isContextLost()) {
				destroyTargets();
				gl.deleteTexture(sourceTexture);
				gl.deleteVertexArray(vertexArray);
				programs.forEach((program) => program && gl.deleteProgram(program.program));
			}
		};
	}, [enabled, generation]);

	if (!enabled) return null;
	return <canvas ref={canvasRef} className='global-fluid-text' aria-hidden='true' />;
}
