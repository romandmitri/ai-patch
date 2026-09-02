export enum ContentFormat {
	// TODO: reidenzon - Roll improved JSON support, if needed.
	// Json = "json",
	Text = "text",
}

export const isValidContentFormat = (format: ContentFormat | undefined): boolean => {
	if (!format) return false;
	return Object.values(ContentFormat).includes(format);
}
