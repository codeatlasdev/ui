<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { timePicker } from '../../i18n/groups/timePicker.js';
  import { Clock } from '@lucide/svelte';
  import { Time } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import { createListbox } from '../../primitives/index.js';
  import { fieldWidth, type FieldWidth } from '../../utils/field-width.js';
  import type { FieldVariant } from '../../theme/components.js';
  import DateFieldShell from './DateFieldShell.svelte';
  import { defaultHourCycle, toTime } from './date-utils.js';
  import { FieldState } from './field-state.svelte.js';
  import PickerPopover from './PickerPopover.svelte';
  import type { TimeValue } from './types.js';
  import './date.css';
  const t = useMessages(timePicker);

  interface Props {
    label?:        string;
    /** Keeps `label` for assistive tech only (`.ca-sr-only`), for a field in a toolbar, table or grid that already shows its name. */
    hideLabel?:    boolean;
    /** `full` (default), `auto`, `fit` or a CSS length (`--ca-field-width`). */
    width?:        FieldWidth;
    description?:  string;
    error?:        string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    /** Selected time. Bindable. Use `new Time(h, m)` from `@internationalized/date`. */
    value?:        Time;
    /** Starting point of an empty field. Bindable. */
    placeholder?:  TimeValue;
    /** Popover open state. Bindable. */
    open?:         boolean;
    /** Earlier times are disabled in the list and typed values become invalid. */
    minValue?:     TimeValue;
    /** Later times are disabled in the list and typed values become invalid. */
    maxValue?:     TimeValue;
    /** Minutes between two entries of the list. Default 15 (an hour granularity lists whole hours at least). */
    step?:         number;
    locale?:       string;
    /** Segments of the field (the list always steps in minutes). Default 'minute'. */
    granularity?:  'hour' | 'minute' | 'second';
    /** Default follows the locale (pt-BR → 24h). */
    hourCycle?:    12 | 24;
    size?:         'sm' | 'md';
    /** How the field is drawn: `outlined` (the style's own), `filled` or `underline`. Default follows the theme (`components.field.variant`). */
    variant?:      FieldVariant;
    /** Name for the hidden input (ISO string) in native forms. */
    name?:         string;
    /** aria-label of the list button. */
    triggerLabel?: string;
    onchange?:     (value: Time | undefined) => void;
    class?:        string;
  }

  let {
    label,
    hideLabel    = false,
    width,
    description,
    error,
    disabled     = false,
    required     = false,
    readonly     = false,
    value        = $bindable(),
    placeholder  = $bindable(),
    open         = $bindable(false),
    minValue,
    maxValue,
    step         = 15,
    locale       = 'pt-BR',
    granularity  = 'minute',
    hourCycle,
    size         = 'md',
    variant,
    name,
    triggerLabel,
    onchange,
    class: className = '',
  }: Props = $props();

  const id = uid('tp');

  let wrap = $state<HTMLElement | null>(null);
  let triggerEl = $state<HTMLElement | null>(null);
  let list = $state<HTMLElement | null>(null);

  const basePlaceholder = $derived(placeholder ?? new Time(0, 0, 0));

  const field = new FieldState({
    mode: 'time',
    getValue: () => value,
    setValue: (v) => commit(v as Time | undefined),
    getPlaceholder: () => basePlaceholder,
    getLocale: () => locale,
    getGranularity: () => granularity,
    getHourCycle: () => hourCycle,
    getDisabled: () => disabled,
    getReadonly: () => readonly,
    getMin: () => minValue,
    getMax: () => maxValue,
    getRoot: () => wrap,
    announce,
  });
  $effect(() => field.sync(value));

  function commit(v: Time | undefined) {
    value = v;
    if (v) placeholder = v;
    onchange?.(v);
  }

  /** The list never steps below a minute, nor (granularity 'hour') below an hour. */
  const stepMinutes = $derived(Math.max(granularity === 'hour' ? 60 : 1, Math.floor(step) || 15));
  const cycle = $derived(hourCycle ?? defaultHourCycle(locale));
  const minutes = (v: TimeValue) => toTime(v).hour * 60 + toTime(v).minute;

  const formatter = $derived(
    new Intl.DateTimeFormat(locale, {
      hour: cycle === 24 ? '2-digit' : 'numeric',
      minute: '2-digit',
      hourCycle: cycle === 24 ? 'h23' : 'h12',
      timeZone: 'UTC',
    }),
  );

  const options = $derived.by(() => {
    const [lo, hi] = [minValue && minutes(minValue), maxValue && minutes(maxValue)];
    const out: { time: Time; text: string; disabled: boolean }[] = [];
    for (let m = 0; m < 24 * 60; m += stepMinutes) {
      const time = new Time(Math.floor(m / 60), m % 60);
      out.push({
        time,
        text: formatter.format(Date.UTC(2000, 0, 1, time.hour, time.minute)),
        disabled: (lo !== undefined && m < lo) || (hi !== undefined && m > hi),
      });
    }
    return out;
  });

  const selectedIndex = $derived(
    value ? options.findIndex((o) => o.time.hour === value?.hour && o.time.minute === value?.minute) : -1,
  );

  const listbox = createListbox({
    mode: 'roving',
    loop: false,
    items: () =>
      options.map((o, i) => ({
        id: `${id}-opt-${i}`,
        el: () => list?.querySelector<HTMLElement>(`#${CSS.escape(`${id}-opt-${i}`)}`),
        text: o.text,
        disabled: o.disabled,
      })),
    onSelect: (_item, i) => pick(i),
  });

  function pick(i: number) {
    const o = options[i];
    if (!o || o.disabled || readonly) return;
    // a list pick starts the seconds of a second-granularity value at 0
    commit(o.time);
    close(true);
  }

  function close(restoreFocus = false) {
    open = false;
    listbox.clear();
    if (restoreFocus) triggerEl?.focus();
  }

  /** On open: the chosen time (else the first enabled one) gets the focus and is scrolled to the middle of the list. */
  function onopen(content: HTMLElement) {
    list = content;
    queueMicrotask(() => {
      const at = selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : options.findIndex((o) => !o.disabled);
      if (at < 0) return content.focus({ preventScroll: true });
      listbox.highlight(at);
      const el = content.querySelector<HTMLElement>(`#${CSS.escape(`${id}-opt-${at}`)}`);
      if (!el) return;
      el.focus({ preventScroll: true });
      content.scrollTop = el.offsetTop - (content.clientHeight - el.offsetHeight) / 2;
    });
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') return close();
    listbox.onkeydown(e);
  }
</script>

<DateFieldShell
  {id}
  {field}
  {label}
  {hideLabel}
  width={fieldWidth(width)}
  {description}
  {error}
  {disabled}
  {readonly}
  {required}
  {size}
  {variant}
  class={className}
  {open}
  triggerIcon={Clock}
  triggerLabel={triggerLabel ?? t().timePicker.openList}
  triggerPopup="listbox"
  bind:triggerEl
  onToggle={() => (open = !open)}
  {name}
  formValue={value?.toString()}
  bind:wrap
/>

<PickerPopover
  {open}
  anchor={triggerEl}
  trigger={triggerEl}
  id="{id}-content"
  label={label ?? t().timePicker.label}
  role="listbox"
  onclose={() => close()}
  {onopen}
  {onkeydown}
>
  {#each options as o, i (i)}
    <!-- Keyboard is handled on the listbox (roving focus); an option is the one tab stop. -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      id="{id}-opt-{i}"
      role="option"
      class="ca-tp__item"
      aria-selected={i === selectedIndex}
      aria-disabled={o.disabled ? 'true' : undefined}
      tabindex={listbox.isHighlighted(i) ? 0 : -1}
      data-selected={i === selectedIndex ? '' : undefined}
      data-disabled={o.disabled ? '' : undefined}
      onmousedown={(e) => o.disabled && e.preventDefault()}
      onclick={() => pick(i)}
    >{o.text}</div>
  {/each}
</PickerPopover>
