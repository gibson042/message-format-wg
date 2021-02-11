import {IMessage, ISimpleMessage, ISelectorMessage} from './imessageformat';
import {IPart, IPlaceholder, IPlainText} from './imessageformat';
import {ISwitch, ICase} from './imessageformat';
import {IPlaceholderFormatterFunction, ISwitchSelectorFunction} from './imessageformat';
import {formatDateTime, formatNumber} from './some_format_functions';
import {pluralSwitchSelector, genderSwitchSelector, selectSwitchSelector} from './some_format_functions';
import {objectToMap} from './util_functions';

const _defaultFormatterFunctions = new Map<string, IPlaceholderFormatterFunction>([
	['date', formatDateTime],
	['time', formatDateTime],
	['number', formatNumber]
]);

const _defaultSwitchSelectorFunctions = new Map<string, ISwitchSelectorFunction>([
	['plural', pluralSwitchSelector],
	['gender', genderSwitchSelector],
	['select', selectSwitchSelector]
]);

export abstract class Message implements IMessage {
	id: string;
	locale: string;
	constructor(id: string, locale: string) {
		this.id = id;
		this.locale = locale;
	}
	static format(msg: IMessage, parameters: {[k: string]: unknown}): string {
		if (msg instanceof SimpleMessage) {
			return SimpleMessage._format(msg, parameters);
		} else if (msg instanceof SelectorMessage) {
			return SelectorMessage._format(msg, parameters);
		} else {
			console.log(msg);
			throw new Error('I don\'t know how to format ' + typeof (msg));
		}
	}
}

export class SimpleMessage extends Message implements ISimpleMessage {
	parts: IPart[];
	constructor(id: string, locale: string, parts: IPart[]) {
		super(id, locale);
		this.parts = parts;
	}
	static _format(msg: SimpleMessage, parameters: {[k: string]: unknown}): string {
		let result = '';
		for (const idx in msg.parts) {
			const part = msg.parts[idx];
			if (part instanceof PlainText) {
				result = result.concat(part.value);
			} else if (typeof part === 'string') {
				result = result.concat(part);
			} else if (part instanceof Placeholder) {
				result = result.concat(Placeholder._format(part, msg.locale, objectToMap(parameters)));
			}
		}
		return result;
	}
}

export class SelectorMessage extends Message implements ISelectorMessage {
	switches: ISwitch[];
	// The order matters. So we need a "special map" that keeps the order
	messages: Map<ICase[], ISimpleMessage>;
	constructor(id: string, locale: string, switches: Switch[], messages: Map<ICase[], ISimpleMessage>) {
		super(id, locale);
		// Need way better validation that this for prod (types, null, etc.)
		messages.forEach((value: ISimpleMessage, key: ICase[]) => {
			if (switches.length != key.length) {
				throw new Error('Switch count different than case count:\n'
					+ switches.length
					+ ' != '
					+ key.length
				);
			}
		});
		this.switches = switches;
		this.messages = messages;
	}
	static _format(msg: SelectorMessage, parameters: {[k: string]: unknown}): string {
		let bestScore = -1;
		let bestMessage = new SimpleMessage(msg.id, msg.locale, []);
		msg.messages.forEach((msgVal: ISimpleMessage, caseElement: ICase[]) => {
			let currentScore = -1;
			for (let i = 0; i < msg.switches.length; i++) {
				const switchElement = msg.switches[i];
				const value = parameters[switchElement.name];
				const switchFunction = _defaultSwitchSelectorFunctions.get(switchElement.type);
				if (switchFunction) {
					const score = switchFunction(value, caseElement[i], msg.locale);
					currentScore += score;
				}
			}
			if (currentScore > bestScore) {
				bestScore = currentScore;
				bestMessage = msgVal;
			}
		});
		if (bestScore >= 1) {
			return SimpleMessage._format(bestMessage, parameters);
		}
		console.log("=== ERROR ===");
		console.log(this);
		console.log(parameters);
		throw new Error('Some troubles.\nParameters: ' + parameters);
	}
}

export class Switch implements ISwitch {
	name: string; // the variable to switch on
	type: string; // plural, ordinal, gender, select, ...
	constructor(name: string, type: string) {
		this.name = name;
		this.type = type;
	}
}

export class PlainText implements IPlainText {
	value: string;
	constructor(value: string) {
		this.value = value;
	}
	format(): string {
		return this.value;
	}
}

export class Placeholder implements IPlaceholder {
	name: string;
	type: string;
	flags: Map<string, string>;

	constructor(name: string, type?: string, flags?: {[k: string]: string}) {
		this.name = name;
		this.type = type ? type : '';
		this.flags = objectToMap<string>(flags);
	}

	static _format(ph: IPlaceholder, locale: string, parameters: Map<string, unknown>): string {
		const value = parameters.get(ph.name); // the runtime value of the placeholder
		const formatterFunction = _defaultFormatterFunctions.get(ph.type);
		if (formatterFunction) {
			return formatterFunction(ph, locale, parameters);
		} else if (value) {
			return String(value);
		}
		return '<undefined ' + ph.name + '>';
	}
}
