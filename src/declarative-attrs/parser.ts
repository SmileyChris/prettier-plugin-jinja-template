import { AST, ParserOptions, format } from "prettier";
import { parsers } from "prettier/plugins/html";
import { extendedOptions } from "..";

const declarativeAttrs = ["x-data"];

async function parse(text: string, options: ParserOptions): Promise<AST> {
	const quoteAttributes = (options as extendedOptions).quoteAttributes;
	const nodes = await parsers.html.parse(text, options);
	const formatDeclarativeAttrs = async (node: AST) => {
		if (node.children) {
			for (const child of node.children) {
				if (child.attrs) {
					for (const attr of child.attrs) {
						if (declarativeAttrs.includes(attr.name)) {
							let formatted = await format(attr.value, {
								...options,
								singleQuote: !options.singleQuote,
								parser: "json5",
							});
							formatted = formatted.trim();
							if (!formatted.startsWith("{") || !formatted.endsWith("}")) {
								continue;
							}
							if (formatted.includes("\n")) {
								formatted = "\n" + formatted;
							} else if (!quoteAttributes) {
								formatted = " " + formatted + " ";
							}
							attr.value = formatted;
						}
					}
				}
				await formatDeclarativeAttrs(child);
			}
		}
	};
	await formatDeclarativeAttrs(nodes);
	return nodes;
}

export default {
	html: { ...parsers.html, parse },
	lwc: { ...parsers.lwc, parse },
};
