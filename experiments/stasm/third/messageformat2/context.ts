import {
	Formattable,
	FunctionCall,
	Parameter,
	Selector,
	VariableReference,
	StringLiteral,
	Part,
} from "./model.js";
import {REGISTRY} from "./registry.js";

// A value passed in as a variable to format() or to which literals are resolved
// at runtime. There are 3 built-in runtime value types in this JavaScript
// implementation: StringValue, NumberValue, BooleanValue. Other implementations
// may introduce additional types, e.g. Uint32Value. RuntimeValue can also be
// inherited from in the userspace code to create new variable types; see
// example_list's ArrayValue type.
export abstract class RuntimeValue<T> {
	public value: T;

	constructor(value: T) {
		this.value = value;
	}

	abstract format(ctx: Context): string;
}

export class StringValue extends RuntimeValue<string> {
	format(ctx: Context): string {
		return this.value;
	}
}

export class NumberValue extends RuntimeValue<number> {
	format(ctx: Context): string {
		// TODO(stasm): Cache NumberFormat.
		// TODO(stasm): Pass options.
		return new Intl.NumberFormat(ctx.locale).format(this.value);
	}
}

export class BooleanValue extends RuntimeValue<boolean> {
	format(ctx: Context): string {
		throw new TypeError("BooleanValue is not formattable.");
	}
}

export interface Context {
	locale: string;
	formattable: Formattable;
	vars: Record<string, RuntimeValue<unknown>>;
	// cached formatters,
}

export function format(
	locale: string,
	formattable: Formattable,
	vars: Record<string, RuntimeValue<unknown>>
): string {
	let ctx: Context = {
		locale,
		formattable,
		vars,
	};

	let resolved_selectors: Array<ResolvedSelector> = [];
	for (let selector of formattable.selectors) {
		resolved_selectors.push(resolve_selector(ctx, selector));
	}

	function matches_corresponding_selector(key: StringLiteral, idx: number) {
		return (
			key.value === resolved_selectors[idx].value ||
			key.value === resolved_selectors[idx].default
		);
	}

	for (let variant of formattable.variants) {
		if (variant.keys.every(matches_corresponding_selector)) {
			return resolve_parts(ctx, variant.value);
		}
	}

	throw new RangeError();
}

interface ResolvedSelector {
	value: string | null;
	default: string;
}

function resolve_selector(ctx: Context, selector: Selector): ResolvedSelector {
	if (selector.expr === null) {
		// A special selector which only selects its default value. Used in the
		// data model of single-variant messages.
		return {value: null, default: selector.default.value};
	}

	switch (selector.expr.type) {
		case "VariableReference": {
			// TODO(stasm): Should selection logic format the selector?
			let value = format_var(ctx, selector.expr);
			return {value, default: selector.default.value};
		}
		case "FunctionCall": {
			let value = call_func(ctx, selector.expr);
			return {value, default: selector.default.value};
		}
		default:
			// TODO(stasm): Should we allow Literals as selectors?
			throw new TypeError();
	}
}

function resolve_parts(ctx: Context, parts: Array<Part>): string {
	let result = "";
	for (let part of parts) {
		switch (part.type) {
			case "StringLiteral":
				result += part.value;
				continue;
			case "VariableReference":
				result += format_var(ctx, part);
				continue;
			case "FunctionCall":
				result += call_func(ctx, part);
				continue;
		}
	}
	return result;
}

function call_func(ctx: Context, func: FunctionCall): string {
	let callable = REGISTRY[func.name];
	return callable(ctx, func.args, func.opts);
}

function format_var(ctx: Context, variable: VariableReference): string {
	let value = ctx.vars[variable.name];
	return value.format(ctx);
}

export function resolve_value(ctx: Context, node: Parameter): RuntimeValue<unknown> {
	if (typeof node === "undefined") {
		return new BooleanValue(false);
	}

	switch (node.type) {
		case "StringLiteral":
			return new StringValue(node.value);
		case "NumberLiteral":
			return new NumberValue(parseFloat(node.value));
		case "BooleanLiteral":
			return new BooleanValue(node.value);
		case "VariableReference":
			return ctx.vars[node.name];
		default:
			throw new TypeError("Invalid node type.");
	}
}
