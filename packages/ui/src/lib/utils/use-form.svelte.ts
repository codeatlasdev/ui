export interface FieldState {
	value: string;
	error: string | undefined;
	touched: boolean;
}

export interface FieldArrayState<T> {
	items: T[];
	add(item: T): void;
	remove(index: number): void;
	/** Move the item at `from` to position `to`. Out-of-range indexes are ignored. */
	move(from: number, to: number): void;
}

export interface FormState<
	K extends string,
	A extends Record<string, unknown> = Record<never, never>,
> {
	fields: Record<K, FieldState>;
	/** Repeatable row groups declared via `options.arrays`. */
	arrays: { [N in keyof A]: FieldArrayState<A[N]> };
	dirty: boolean;
	valid: boolean;
	submitting: boolean;
	/** Mark a field as touched and run validation. */
	touch(field: K): void;
	/** Set field value and re-validate if touched. */
	set(field: K, value: string): void;
	/** Run full validation; returns true if all fields pass. */
	validate(): boolean;
	/** Reset to initial values and clear all errors/touched state. */
	reset(): void;
}

// Generic schema duck-type — works with Zod, Valibot, or a plain object.
export type ValidationSchema<K extends string> =
	| {
			parse?: (data: Record<K, string>) => unknown;
			safeParse?: (data: Record<K, string>) => {
				success: boolean;
				error?: { flatten?: () => { fieldErrors: Partial<Record<K, string[]>> } };
			};
			_run?: (
				data: Record<K, string>,
				config: unknown
			) => {
				output: unknown;
				issues?: Array<{ path: (string | number)[]; message: string }>;
			};
	  }
	| ((data: Record<K, string>) => Partial<Record<K, string>>);

function runSchema<K extends string>(
	schema: ValidationSchema<K>,
	data: Record<K, string>
): Partial<Record<K, string>> {
	if (typeof schema === "function") return schema(data);

	// Zod safeParse
	if ("safeParse" in schema && schema.safeParse) {
		const result = schema.safeParse(data);
		if (result.success) return {};
		const flat = result.error?.flatten?.();
		const errs: Partial<Record<K, string>> = {};
		if (flat) {
			for (const [k, v] of Object.entries(flat.fieldErrors)) {
				errs[k as K] = (v as string[])[0];
			}
		}
		return errs;
	}

	// Valibot _run
	if ("_run" in schema && schema._run) {
		const result = schema._run(data, {});
		if (!result.issues?.length) return {};
		const errs: Partial<Record<K, string>> = {};
		for (const issue of result.issues) {
			const key = String(issue.path?.[0]) as K;
			if (key && !errs[key]) errs[key] = issue.message;
		}
		return errs;
	}

	return {};
}

/** Reactive form state: per-field value, error and touched flag, optional field arrays, and validation through a Zod- or Valibot-style `schema`. Returns `FormState`. */
export function useForm<K extends string, A extends Record<string, unknown> = Record<never, never>>(
	initialValues: Record<K, string>,
	options?: {
		schema?: ValidationSchema<K>;
		/** Initial rows per field array, e.g. `{ phones: [{ number: "" }] }`. */
		arrays?: { [N in keyof A]: A[N][] };
	}
): FormState<K, A> {
	type Fields = Record<K, FieldState>;

	function makeFields(): Fields {
		return Object.fromEntries(
			(Object.keys(initialValues) as K[]).map((k) => [
				k,
				{ value: initialValues[k], error: undefined, touched: false } satisfies FieldState,
			])
		) as Fields;
	}

	function makeArray(initial: unknown[]): FieldArrayState<unknown> {
		let items = $state<unknown[]>([...initial]);
		return {
			get items() {
				return items;
			},
			add(item) {
				items.push(item);
			},
			remove(index) {
				if (index >= 0 && index < items.length) items.splice(index, 1);
			},
			move(from, to) {
				if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
				items.splice(to, 0, items.splice(from, 1)[0]);
			},
		};
	}

	function makeArrays() {
		return Object.fromEntries(
			Object.entries((options?.arrays ?? {}) as Record<string, unknown[]>).map(([n, v]) => [
				n,
				makeArray(v),
			])
		) as FormState<K, A>["arrays"];
	}

	let fields = $state<Fields>(makeFields());
	let arrays = makeArrays();
	let submitting = $state(false);

	function getErrors(): Partial<Record<K, string>> {
		if (!options?.schema) return {};
		const data = Object.fromEntries(
			(Object.keys(fields) as K[]).map((k) => [k, fields[k].value])
		) as Record<K, string>;
		return runSchema(options.schema, data);
	}

	const form: FormState<K, A> = {
		get fields() {
			return fields;
		},
		get arrays() {
			return arrays;
		},
		get dirty() {
			return (Object.keys(fields) as K[]).some((k) => fields[k].value !== initialValues[k]);
		},
		get valid() {
			const errs = getErrors();
			return (Object.keys(fields) as K[]).every((k) => !errs[k]);
		},
		get submitting() {
			return submitting;
		},
		set submitting(v) {
			submitting = v;
		},

		touch(field: K) {
			const errs = getErrors();
			fields[field].touched = true;
			fields[field].error = errs[field];
		},
		set(field: K, value: string) {
			fields[field].value = value;
			if (fields[field].touched) {
				const errs = getErrors();
				fields[field].error = errs[field];
			}
		},
		validate(): boolean {
			const errs = getErrors();
			for (const k of Object.keys(fields) as K[]) {
				fields[k].touched = true;
				fields[k].error = errs[k];
			}
			return (Object.values(errs) as (string | undefined)[]).every((e) => !e);
		},
		reset() {
			fields = makeFields();
			arrays = makeArrays();
			submitting = false;
		},
	};

	return form;
}
