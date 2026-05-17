import { resolve } from "path";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	clearScreen: false,
	define: {
		__VERSION__: JSON.stringify(process.env.npm_package_version),
	},
	build: {
		target: ["chrome109", "edge109"],
		minify: "terser",
		terserOptions: {
			toplevel: true,
			compress: { passes: 3 },
		},
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				graphics: resolve(__dirname, "graphics.html"),
			},
		},
	},
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: "ws",
					host,
					port: 1421,
				}
			: undefined,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
});
