<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { DateRangePicker, Portal } from 'bits-ui';
  import { CalendarRange } from '@lucide/svelte';
  import type { DateValue } from '@internationalized/date';
  import { uid } from '../../utils/index.js';
  import CalendarBody from './CalendarBody.svelte';
  import type { DateRange } from './types.js';
  import './date.css';

  interface Props {
    label?:        string;
    description?:  string;
    error?:        string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    /** Selected range. Bindable. */
    value?:        DateRange;
    /** Controls the visible month when empty. Bindable. */
    placeholder?:  DateValue;
    /** Popover open state. Bindable. */
    open?:         boolean;
    minValue?:     DateValue;
    maxValue?:     DateValue;
    locale?:       string;
    /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    numberOfMonths?: number;
    isDateDisabled?:    (date: DateValue) => boolean;
    isDateUnavailable?: (date: DateValue) => boolean;
    closeOnRangeSelect?: boolean;
    size?:         'sm' | 'md';
    /** aria-label of the calendar button. */
    triggerLabel?: string;
    onchange?:     (value: DateRange) => void;
    class?:        string;
  }

  let {
    label,
    description,
    error,
    disabled     = false,
    required     = false,
    readonly     = false,
    value        = $bindable({ start: undefined, end: undefined }),
    placeholder  = $bindable(),
    open         = $bindable(false),
    minValue,
    maxValue,
    locale       = 'pt-BR',
    weekStartsOn = 1,
    numberOfMonths = 2,
    isDateDisabled,
    isDateUnavailable,
    closeOnRangeSelect = true,
    size         = 'md',
    triggerLabel,
    onchange,
    class: className = '',
  }: Props = $props();

  const id = uid('drp');
  /**
   * bits-ui chains its own open-focus after ours; that one runs `document.querySelector(
   * '[data-bits-day][data-focused]').focus()` and so pulls focus (and a page scroll) to any
   * other calendar on the page. We can't stop it from running, so: remember the scroll
   * position, let it run, then put focus back on this popover's own day without scrolling.
   */
  let content = $state<HTMLElement | null>(null);

  function focusOwnDay(e: Event) {
    const day =
      content?.querySelector<HTMLElement>('[data-bits-day][data-focused]') ??
      content?.querySelector<HTMLElement>('[data-bits-day]:not([data-disabled])');
    if (!day) return;
    e.preventDefault();
    const { scrollX, scrollY } = window;
    // Runs after the chained handler in the same task, before the next paint.
    queueMicrotask(() => {
      day.focus({ preventScroll: true });
      window.scrollTo(scrollX, scrollY);
    });
  }

  const describedBy = $derived(error ? `${id}-err` : description ? `${id}-hint` : undefined);
</script>

<DateRangePicker.Root
  bind:value
  bind:placeholder
  bind:open
  {disabled}
  {required}
  {readonly}
  {minValue}
  {maxValue}
  {locale}
  {weekStartsOn}
  {numberOfMonths}
  {isDateDisabled}
  {isDateUnavailable}
  {closeOnRangeSelect}
  calendarLabel={label ?? t().calendar.rangeLabel}
  weekdayFormat="short"
  errorMessageId={error ? `${id}-err` : undefined}
  onValueChange={(v) => onchange?.(v)}
>
  <div class="ca-date {className}" class:ca-date--sm={size === 'sm'} class:ca-date--error={!!error} class:ca-date--disabled={disabled}>
    {#if label}
      <DateRangePicker.Label class="ca-date__label">
        {label}{#if required}<span class="ca-date__req" aria-hidden="true"> *</span>{/if}
      </DateRangePicker.Label>
    {/if}

    <div
      class="ca-date__wrap"
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
    >
      {#each ['start', 'end'] as const as type (type)}
        <DateRangePicker.Input {type} class="ca-date__input">
          {#snippet children({ segments })}
            {#each segments as { part, value: segValue }, i (i)}
              <DateRangePicker.Segment {part} class="ca-date__segment">{segValue}</DateRangePicker.Segment>
            {/each}
          {/snippet}
        </DateRangePicker.Input>
        {#if type === 'start'}
          <span class="ca-date__range-sep" aria-hidden="true">–</span>
        {/if}
      {/each}
      <DateRangePicker.Trigger class="ca-date__trigger" aria-label={triggerLabel ?? t().calendar.openCalendar}>
        <CalendarRange size={16} strokeWidth={2} aria-hidden="true" />
      </DateRangePicker.Trigger>
    </div>

    {#if error}
      <p id="{id}-err" class="ca-date__hint ca-date__hint--error" role="alert">{error}</p>
    {:else if description}
      <p id="{id}-hint" class="ca-date__hint">{description}</p>
    {/if}
  </div>

  <Portal>
    <DateRangePicker.Content class="ca-date__content glass-overlay" sideOffset={6} align="start" bind:ref={content} onOpenAutoFocus={focusOwnDay} role="dialog" aria-label={label ?? t().calendar.rangeLabel}>
      <DateRangePicker.Calendar class="ca-cal">
        {#snippet children({ months, weekdays })}
          <CalendarBody {months} {weekdays} range />
        {/snippet}
      </DateRangePicker.Calendar>
    </DateRangePicker.Content>
  </Portal>
</DateRangePicker.Root>
