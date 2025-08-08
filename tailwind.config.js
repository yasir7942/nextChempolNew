/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		// App router + pages folder
		"./app/**/*.{js,jsx,ts,tsx}",
		"./pages/**/*.{js,jsx,ts,tsx}",

		// Shared components
		"./components/**/*.{js,jsx,ts,tsx}",

		// Any other source folders
		"./src/**/*.{js,jsx,ts,tsx}",
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: { "2xl": "1536px" },
		},
		extend: {
			colors: {
				backgroundColor: "white",
				textBlue: "#1976bc",
				textLightBlue: "#03c7ff",
				darkYellow: "#FFDE00",
				darkGary: "#2c2c2c",
				burnYellow: "#f7be5a",
				// …your other color tokens…
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [
		require("tailwindcss-animate"),
		require("tailwindcss-rtl"),
	],
};
