export const fontFamily = {
	arial: "'Arial', sans-serif",
	flatlion: "'Flatlion', sans-serif",
	moreSugar: "'More Sugar', cursive",
	mungil: "'Mungil', sans-serif",
	brownSugar: "'Brown Sugar', cursive",
	laLuxesScript: "'La Luxes Script', cursive",
	crimsonPro: "'Crimson Pro', serif",
	bubbly: "'Bubbly', cursive",
	glacialIndifference: "'Glacial Indifference', sans-serif",
	bugaki: "'Bugaki', sans-serif",
	quincyCF: "'Quincy CF', sans-serif",
	amsterdamFour: "'Amsterdam Four', sans-serif",
	rocaTwo: "'Roca Two', sans-serif",
	pinyonScript: "'Pinyon Script', cursive",
	bethEllen: "'Beth Ellen', cursive",
	canvaSans: "'Canva Sans', sans-serif",
	archivoBlack: "'Archivo Black', sans-serif",
	halimun: "'Halimun', sans-serif",
	theSeasons: "'The Seasons', cursive",
	ttNorms: "'TT Norms', sans-serif",
	autumnInNovember: "'Autumn in November', cursive",
	janethville: "'Janethville', cursive",
	lekton: "'Lekton', serif",
	cocogoose: "'Cocogoose', sans-serif",
	spaceMono: "'Space Mono', monospace",
	alice: "'Alice', serif",
	"29ltMakina": "'29LT Makina', sans-serif",
};

export type FontType = typeof fontFamily;

export const fontArray = Object.entries(fontFamily).map(
	([fontname, fontfamily]) => ({
		fontname,
		fontfamily,
	}),
);
