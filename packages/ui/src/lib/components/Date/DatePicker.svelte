<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { DatePicker } from 'bits-ui';
  import { CalendarDays } from '@lucide/svelte';
  import type { DateValue } from '@internationalized/date';
  import { uid } from '../../utils/index.js';
  import CalendarBody from './CalendarBody.svelte';
  import './date.css';

  interface Props {
    label?:        string;
    description?:  string;
    error?:        string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    /** Selected date. Bindable. */
    value?:        DateValue;
    /** Controls the visible month when empty. Bindable. */
    placeholder?:  DateValue;
    /** Popover open state. Bindable. */
    open?:         boolean;
    minValue?:     DateValue;
    maxValue?:     DateValue;
    locale?:       string;
    /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    /** Adds hour/minute segments to the field. Default 'day'. */
    granularity?:  'day' | 'hour' | 'minute' | 'second';
    numberOfMonths?: number;
    isDateDisabled?:    (date: DateValue) => boolean;
    isDateUnavailable?: (date: DateValue) => boolean;
    closeOnDateSelect?: boolean;
    size?:         'sm' | 'md';
    /** Name for the hidden input (ISO string) in native forms. */
    name?:         string;
    /** aria-label of the calendar button. */
    triggerLabel?: string;
    onchange?:     (value: DateValue | undefined) => void;
    class?:        string;
  }

  let {
    label,
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
    weekStartsOn = 1,
    granularity  = 'day',
    numberOfMonths = 1,
    isDateDisabled,
    isDateUnavailable,
    closeOnDateSelect = true,
    size         = 'md',
    name,
    triggerLabel,
    onchange,
    class: className = '',
  }: Props = $props();

  const id = uid('dp');
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

<DatePicker.Root
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
  {granularity}
  {numberOfMonths}
  {isDateDisabled}
  {isDateUnavailable}
  {closeOnDateSelect}
  calendarLabel={label ?? t().calendar.label}
  weekdayFormat="short"
  errorMessageId={error ? `${id}-err` : undefined}
  onValueChange={(v) => onchange?.(v)}
>
  <div class="ca-date {className}" class:ca-date--sm={size === 'sm'} class:ca-date--error={!!error} class:ca-date--disabled={disabled}>
    {#if label}
      <DatePicker.Label class="ca-date__label">
        {label}{#if required}<span class="ca-date__req" aria-hidden="true"> *</span>{/if}
      </DatePicker.Label>
    {/if}

    <DatePicker.Input
      {name}
      class="ca-date__wrap"
      aria-describedby={describedBy}
    >
      {#snippet children({ segments })}
        <span class="ca-date__input">
          {#each segments as { part, value: segValue }, i (i)}
            <DatePicker.Segment {part} class="ca-date__segment">{segValue}</DatePicker.Segment>
          {/each}
        </span>
        <DatePicker.Trigger class="ca-date__trigger" aria-label={triggerLabel ?? t().calendar.openCalendar}>
          <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
        </DatePicker.Trigger>
      {/snippet}
    </DatePicker.Input>

    {#if error}
      <p id="{id}-err" class="ca-date__hint ca-date__hint--error" role="alert">{error}</p>
    {:else if description}
      <p id="{id}-hint" class="ca-date__hint">{description}</p>
    {/if}
  </div>

  <DatePicker.Portal>
    <DatePicker.Content class="ca-date__content glass-overlay" sideOffset={6} align="start" bind:ref={content} onOpenAutoFocus={focusOwnDay} role="dialog" aria-label={label ?? t().calendar.label}>
      <DatePicker.Calendar class="ca-cal">
        {#snippet children({ months, weekdays })}
          <CalendarBody {months} {weekdays} />
        {/snippet}
      </DatePicker.Calendar>
    </DatePicker.Content>
  </DatePicker.Portal>
</DatePicker.Root>
