import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

export type Theme = "light" | "dark" | "system";
export type TemaResuelto = "light" | "dark";

export const THEME_STORAGE_KEY = "remax-theme";

/** Script inline anti-flash: se ejecuta antes de hidratar (ver __root.tsx). */
export const THEME_INLINE_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var t=localStorage.getItem(k);var m=window.matchMedia("(prefers-color-scheme: dark)").matches;var d=t==="dark"||(t!=="light"&&!t&&m);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

interface ThemeContextValue {
	theme: Theme;
	resolved: TemaResuelto;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function prefiereOscuro(): TemaResuelto {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function aplicar(theme: Theme): TemaResuelto {
	const resolved = theme === "system" ? prefiereOscuro() : theme;
	if (typeof document !== "undefined") {
		document.documentElement.classList.toggle("dark", resolved === "dark");
		document.documentElement.style.colorScheme = resolved;
	}
	return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [resolved, setResolved] = useState<TemaResuelto>("light");

	useEffect(() => {
		let stored: Theme = "system";
		try {
			const value = localStorage.getItem(THEME_STORAGE_KEY);
			if (value === "light" || value === "dark" || value === "system") {
				stored = value;
			}
		} catch {
			// localStorage no disponible (modo privado): usar "system".
		}
		setThemeState(stored);
		setResolved(aplicar(stored));
	}, []);

	useEffect(() => {
		if (theme !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => setResolved(aplicar("system"));
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [theme]);

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// Persistencia opcional; si falla, el tema aplica solo en la sesión.
		}
		setResolved(aplicar(next));
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, resolved, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme debe usarse dentro de <ThemeProvider>.");
	}
	return context;
}
