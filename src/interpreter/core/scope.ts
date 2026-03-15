import { RuntimeValue } from "./interpreter";

export class Scope {
	private variables: Map<string, RuntimeValue> = new Map();
	constructor(public parent: Scope | null = null) {}

	declare(name: string, value: RuntimeValue): void {
		if (this.variables.has(name)) {
			throw new Error(`Переменная "${name}" уже объявлена в этой области`);
		}
		this.variables.set(name, value);
	}

	assign(name: string, value: RuntimeValue): void {
		const scope = this.lookupScope(name);
		if (!scope) {
			throw new Error(`Переменная "${name}" не определена`);
		}
		scope.variables.set(name, value);
	}

	get(name: string): RuntimeValue {
		const scope = this.lookupScope(name);
		if (!scope) {
			throw new Error(`Переменная "${name}" не определена`);
		}
		return scope.variables.get(name)!;
	}

	private lookupScope(name: string): Scope | null {
		if (this.variables.has(name)) return this;
		if (this.parent) return this.parent.lookupScope(name);
		return null;
	}

	createChild(): Scope {
		return new Scope(this);
	}
}
