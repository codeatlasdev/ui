<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  /**
   * Internal: header + month grids shared by Calendar, RangeCalendar, DatePicker and
   * DateRangePicker. The parent owns the `role="application"` root and the CalendarState.
   * Not exported from the package.
   */
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import type { CalendarState } from './calendar-state.svelte.js';
  import { sameDay } from './date-utils.js';

  interface Props {
    state: CalendarState;
    range?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    prevLabel?: string;
    nextLabel?: string;
  }

  let {
    state: cal,
    range = false,
    disabled = false,
    readonly = false,
    prevLabel,
    nextLabel,
  }: Props = $props();

  const flag = (v: boolean) => (v ? '' : undefined);
</script>

<div class="ca-cal__header" data-disabled={flag(disabled)} data-readonly={flag(readonly)}>
  <button
    type="button"
    class="ca-cal__nav"
    aria-label={prevLabel ?? t().calendar.previousMonth}
    aria-disabled={cal.prevDisabled}
    data-disabled={flag(cal.prevDisabled)}
    disabled={cal.prevDisabled}
    onclick={() => cal.prev()}
  >
    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
  </button>
  <div class="ca-cal__heading" aria-hidden="true">{cal.heading}</div>
  <button
    type="button"
    class="ca-cal__nav"
    aria-label={nextLabel ?? t().calendar.nextMonth}
    aria-disabled={cal.nextDisabled}
    data-disabled={flag(cal.nextDisabled)}
    disabled={cal.nextDisabled}
    onclick={() => cal.next()}
  >
    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
  </button>
</div>

<div class="ca-cal__months">
  {#each cal.months as month (month.value.toString())}
    <table
      class="ca-cal__grid"
      role="grid"
      tabindex="-1"
      aria-readonly={readonly}
      aria-disabled={disabled}
      data-readonly={flag(readonly)}
      data-disabled={flag(disabled)}
    >
      <thead>
        <tr>
          {#each cal.weekdays as day (day)}
            <th class="ca-cal__head-cell">{day}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each month.weeks as week, i (i)}
          <tr>
            {#each week as date (date.toString())}
              {@const outside = cal.isOutsideMonth(date, month.value)}
              {@const isDisabled = cal.isDisabled(date) || outside}
              {@const unavailable = cal.isUnavailable(date)}
              {@const selected = cal.isSelected(date)}
              {@const focused = cal.tabDate ? sameDay(date, cal.tabDate) : false}
              {@const start = range && cal.isRangeStart(date)}
              {@const end = range && cal.isRangeEnd(date)}
              {@const shared = {
                'data-unavailable': flag(unavailable),
                'data-today': flag(sameDay(date, cal.today)),
                'data-outside-month': flag(outside),
                'data-outside-visible-months': flag(cal.isOutsideVisible(date)),
                'data-focused': flag(focused),
                'data-selection-start': flag(start),
                'data-selection-end': flag(end),
                'data-highlighted': flag(range && cal.isHighlighted(date)),
                'data-selected': flag(selected),
                'data-value': date.toString(),
                'data-disabled': flag(isDisabled),
              }}
              <td
                class="ca-cal__cell"
                role="gridcell"
                aria-selected={selected}
                aria-disabled={isDisabled || unavailable}
                {...shared}
              >
                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                <div
                  class="ca-cal__day"
                  role="button"
                  aria-label={cal.label(date)}
                  aria-disabled={isDisabled || unavailable}
                  tabindex={isDisabled ? undefined : focused ? 0 : -1}
                  data-ca-day=""
                  {...shared}
                  onclick={() => {
                    if (!isDisabled) cal.select(date);
                  }}
                  onmouseenter={() => {
                    if (!isDisabled) cal.preview(date);
                  }}
                  onfocusin={() => {
                    if (!isDisabled) cal.preview(date);
                  }}
                >{date.day}</div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/each}
</div>
