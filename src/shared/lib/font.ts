export const fontFamily = {
	flatlion: "'Flatlion', sans-serif",
	moreSugar: "'More Sugar', cursive",
	mungil: "'Mungil', sans-serif",
};

export type FontType = typeof fontFamily;

export const fontArray = Object.entries(fontFamily).map(
	([fontname, fontfamily]) => ({
		fontname,
		fontfamily,
	}),
);
