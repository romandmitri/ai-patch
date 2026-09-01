export function greet(name: string): string {
	return `Hello, ${name}!`;
}

export class Greeter {
	constructor(private readonly greeting: string) {}

	greet(name: string): string {
		return `${this.greeting}, ${name}!`;
	}
}
