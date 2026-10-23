export interface CarouselContext {
	register(el: HTMLElement): () => void;
	count(): number;
	indexOf(el: HTMLElement): number;
	visible(index: number): boolean;
}

export const CAROUSEL_KEY = Symbol("ca-carousel");
