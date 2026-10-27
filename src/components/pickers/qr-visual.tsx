import { useMemo } from "react";

interface QrVisualProps {
	value: string;
	size?: number;
	label?: string;
	className?: string;
}

/**
 * Patrón tipo QR determinista a partir de un texto (visual, no escaneable).
 * Se usa en las pantallas de pago para representar el QR de transferencia.
 */
export function QrVisual({
	value,
	size = 140,
	label = "Código QR de pago (representación visual)",
	className,
}: QrVisualProps) {
	const celdas = 21;
	const matriz = useMemo(() => {
		let semilla = 0;
		for (let i = 0; i < value.length; i++) {
			semilla = (semilla * 31 + value.charCodeAt(i)) >>> 0;
		}
		const rand = () => {
			semilla ^= semilla << 13;
			semilla ^= semilla >>> 17;
			semilla ^= semilla << 5;
			semilla >>>= 0;
			return (semilla % 1000) / 1000;
		};
		const grid: boolean[][] = Array.from({ length: celdas }, () =>
			Array.from({ length: celdas }, () => rand() > 0.5),
		);
		const marcar = (fila: number, col: number) => {
			for (let f = 0; f < 7; f++) {
				for (let c = 0; c < 7; c++) {
					const borde = f === 0 || f === 6 || c === 0 || c === 6;
					const centro = f >= 2 && f <= 4 && c >= 2 && c <= 4;
					grid[fila + f][col + c] = borde || centro;
				}
			}
		};
		marcar(0, 0);
		marcar(0, celdas - 7);
		marcar(celdas - 7, 0);
		return grid;
	}, [value]);

	const celda = size / celdas;

	return (
		<svg
			viewBox={`0 0 ${size} ${size}`}
			width={size}
			height={size}
			role="img"
			aria-label={label}
			className={className}
		>
			{matriz.flatMap((fila, f) =>
				fila.map((activo, c) =>
					activo ? (
						<rect
							// biome-ignore lint/suspicious/noArrayIndexKey: grilla estática
							key={`${f}-${c}`}
							x={c * celda}
							y={f * celda}
							width={celda}
							height={celda}
							fill="var(--color-primary)"
						/>
					) : null,
				),
			)}
		</svg>
	);
}
