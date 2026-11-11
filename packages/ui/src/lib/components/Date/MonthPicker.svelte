<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { monthPicker } from '../../i18n/groups/monthPicker.js';
  import { CalendarDays, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { CalendarDate, DateFormatter, endOfMonth, startOfMonth, type DateValue } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import { fieldWidth, type FieldWidth } from '../../utils/field-width.js';
  import type { FieldVariant } from '../../theme/components.js';
  import DateFieldShell from './DateFieldShell.svelte';
  import { todayDate } from './date-utils.js';
  import { FieldState } from './field-state.svelte.js';
  import PickerPopover from './PickerPopover.svelte';
  import './date.css';
  const t = useMessages(monthPicker);

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
    /** Selected month, always the 1st of it (`new CalendarDate(2026, 3, 1)`). Any other day passed in is read as its month, and a pick writes the 1st. Bindable. */
    value?:        CalendarDate;
    /** Year the grid shows while the field is empty. Defaults to the current year. Bindable. */
    placeholder?:  DateValue;
    /** Popover open state. Bindable. */
    open?:         boolean;
    /** A month that ends before this day is disabled. */
    minValue?:     DateValue;
    /** A month that starts after this day is disabled. */
    maxValue?:     DateValue;
    locale?:       string;
    size?:         'sm' | 'md';
    /** How the field is drawn: `outlined` (the style's own), `filled` or `underline`. Default follows the theme (`components.field.variant`). */
    variant?:      FieldVariant;
    /** Name for the hidden input (ISO date of the 1st of the month) in native forms. */
    name?:         string;
    /** aria-label of the button that opens the grid. */
    triggerLabel?: string;
    onchange?:     (value: CalendarDate | undefined) => void;
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
    locale       = 'pt-BR',
    size         = 'md',
    variant,
    name,
    triggerLabel,
    onchange,
    class: className = '',
  }: Props = $props();

  const id = uid('mp');

  let wrap = $state<HTMLElement | null>(null);
  let triggerEl = $state<HTMLElement | null>(null);
  let root = $state<HTMLElement | null>(null);

  // The field has no typed segments; the shell still wants a FieldState (label click, invalid state).
  const field = new FieldState({
    mode: 'date',
    getValue: () => value,
    setValue: () => {},
    getPlaceholder: () => placeholder ?? value ?? todayDate(),
    getLocale: () => locale,
    getGranularity: () => 'day',
    getHourCycle: () => undefined,
    getDisabled: () => disabled,
    getReadonly: () => readonly,
    getMin: () => minValue,
    getMax: () => maxValue,
    getRoot: () => wrap,
    announce,
  });

  const monthOf = (v: DateValue) => new CalendarDate(v.year, v.month, 1);
  const current = $derived(value ? monthOf(value) : undefined);

  /** Year shown by the grid; moves with the year buttons without touching the value. */
  let shownYear = $state(0);
  const year = $derived(shownYear || (value ?? placeholder ?? todayDate()).year);

  const longFmt = $derived(new DateFormatter(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }));
  const shortFmt = $derived(new DateFormatter(locale, { month: 'short', timeZone: 'UTC' }));
  /** "março de 2026" -> "Março de 2026": only the first letter, so "de" stays lowercase. */
  const upFirst = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
  const longText = (d: CalendarDate) => upFirst(longFmt.format(new Date(Date.UTC(d.year, d.month - 1, 1))));
  const shortText = (d: CalendarDate) => upFirst(shortFmt.format(new Date(Date.UTC(d.year, d.month - 1, 1))));

  const months = $derived(Array.from({ length: 12 }, (_, i) => new CalendarDate(year, i + 1, 1)));
  const rows = $derived([months.slice(0, 3), months.slice(3, 6), months.slice(6, 9), months.slice(9, 12)]);

  const isDisabled = (m: CalendarDate) =>
    disabled ||
    (!!minValue && endOfMonth(m).compare(startOfMonth(minValue)) < 0) ||
    (!!maxValue && m.compare(maxValue) > 0);
  const isSelected = (m: CalendarDate) => !!current && current.compare(m) === 0;
  const isCurrent = (m: CalendarDate) => m.compare(startOfMonth(todayDate())) === 0;

  /** The month with the roving tab stop: the selected one, else the current one, else the first enabled one of the year. */
  const tabMonth = $derived(
    months.find((m) => isSelected(m) && !isDisabled(m)) ??
      months.find((m) => isCurrent(m) && !isDisabled(m)) ??
      months.find((m) => !isDisabled(m)),
  );

  const prevDisabled = $derived(!!minValue && endOfMonth(new CalendarDate(year - 1, 12, 1)).compare(startOfMonth(minValue)) < 0);
  const nextDisabled = $derived(!!maxValue && new CalendarDate(year + 1, 1, 1).compare(maxValue) > 0);

  function pick(m: CalendarDate) {
    if (isDisabled(m) || readonly) return;
    value = m;
    placeholder = m;
    onchange?.(m);
    announce(longText(m));
    close(true);
  }

  function close(restoreFocus = false) {
    open = false;
    shownYear = 0;
    if (restoreFocus) triggerEl?.focus();
  }

  const monthEl = (m: CalendarDate) => root?.querySelector<HTMLElement>(`[data-ca-month][data-value="${m.toString()}"]`);

  function focusMonth(m: CalendarDate) {
    shownYear = m.year;
    // the grid re-renders for another year; the cell exists once that has flushed
    queueMicrotask(() => monthEl(m)?.focus({ preventScroll: true }));
  }

  function onopen(content: HTMLElement) {
    root = content;
    shownYear = 0;
    queueMicrotask(() => {
      const start = tabMonth;
      if (start) monthEl(start)?.focus({ preventScroll: true });
      else content.focus({ preventScroll: true });
    });
  }

  function onkeydown(e: KeyboardEvent) {
    const target = e.target;
    if (!(target instanceof HTMLElement) || !target.hasAttribute('data-ca-month')) return;
    const m = months.find((x) => x.toString() === target.dataset.value);
    if (!m) return;
    let next: CalendarDate | undefined;
    switch (e.key) {
      case 'ArrowLeft': next = m.subtract({ months: 1 }); break;
      case 'ArrowRight': next = m.add({ months: 1 }); break;
      case 'ArrowUp': next = m.subtract({ months: 3 }); break;
      case 'ArrowDown': next = m.add({ months: 3 }); break;
      case 'Home': next = new CalendarDate(m.year, 1, 1); break;
      case 'End': next = new CalendarDate(m.year, 12, 1); break;
      case 'PageUp': next = m.subtract({ years: 1 }); break;
      case 'PageDown': next = m.add({ years: 1 }); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        return pick(m);
      default:
        return;
    }
    e.preventDefault();
    if (!isDisabled(next)) focusMonth(next);
  }

  const shownText = $derived(current ? longText(current) : '');
</script>

{#snippet segments()}
  <span class="ca-mp__value" id="{id}-value" data-placeholder={current ? undefined : ''} data-segment="value">{current ? shownText : t().monthPicker.placeholder}</span>
{/snippet}

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
  triggerIcon={CalendarDays}
  triggerLabel={triggerLabel ?? t().monthPicker.openGrid}
  bind:triggerEl
  onToggle={() => (open = !open)}
  {name}
  formValue={current?.toString()}
  {segments}
  bind:wrap
/>

<PickerPopover
  {open}
  anchor={triggerEl}
  trigger={triggerEl}
  id="{id}-content"
  label={label ?? t().monthPicker.label}
  onclose={() => close()}
  {onopen}
  {onkeydown}
>
  <div class="ca-cal">
    <div class="ca-cal__header">
      <button
        type="button"
        class="ca-cal__nav"
        aria-label={t().monthPicker.previousYear}
        aria-disabled={prevDisabled}
        data-disabled={prevDisabled ? '' : undefined}
        disabled={prevDisabled}
        onclick={() => (shownYear = year - 1)}
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      <div class="ca-cal__heading" aria-live="polite">{year}</div>
      <button
        type="button"
        class="ca-cal__nav"
        aria-label={t().monthPicker.nextYear}
        aria-disabled={nextDisabled}
        data-disabled={nextDisabled ? '' : undefined}
        disabled={nextDisabled}
        onclick={() => (shownYear = year + 1)}
      >
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
    <table class="ca-mp__grid" role="grid" aria-label={String(year)}>
      <tbody>
        {#each rows as row, r (r)}
          <tr>
            {#each row as m (m.toString())}
              {@const off = isDisabled(m)}
              {@const selected = isSelected(m)}
              <td class="ca-mp__cell" role="gridcell" aria-selected={selected} aria-disabled={off}>
                <!-- Keyboard is handled by the grid (roving focus); the focused month is the one tab stop. -->
                <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_click_events_have_key_events -->
                <div
                  class="ca-mp__month"
                  role="button"
                  aria-disabled={off}
                  tabindex={off ? undefined : tabMonth && m.compare(tabMonth) === 0 ? 0 : -1}
                  data-ca-month=""
                  data-value={m.toString()}
                  data-selected={selected ? '' : undefined}
                  data-current={isCurrent(m) ? '' : undefined}
                  data-disabled={off ? '' : undefined}
                  onmousedown={(e) => off && e.preventDefault()}
                  onclick={() => pick(m)}
                >{shortText(m)}{' '}<span class="ca-sr-only">{m.year}</span></div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</PickerPopover>
