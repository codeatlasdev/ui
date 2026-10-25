<script lang="ts">
  /**
   * Internal: the `role="application"` root of a calendar, its screen-reader heading and the grid
   * (CalendarBody). Shared by Calendar, RangeCalendar and the popovers of DatePicker and
   * DateRangePicker. Not exported from the package.
   */
  import CalendarBody from './CalendarBody.svelte';
  import type { CalendarState } from './calendar-state.svelte.js';

  interface Props {
    state: CalendarState;
    disabled: boolean;
    readonly: boolean;
    range?: boolean;
    /** A calendar on its own page (not inside a popover): adds the standalone class and state hooks. */
    standalone?: boolean;
    class?: string;
  }

  let { state: cal, disabled, readonly, range = false, standalone = false, class: className = '' }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  bind:this={cal.root}
  class="ca-cal {standalone ? 'ca-cal--standalone' : ''} {className}"
  role="application"
  aria-label={cal.fullLabel}
  data-disabled={standalone && disabled ? '' : undefined}
  data-readonly={standalone && readonly ? '' : undefined}
  onkeydown={cal.onkeydown}
>
  <div class="ca-sr-only"><div role="heading" aria-level="2">{cal.fullLabel}</div></div>
  <CalendarBody state={cal} {disabled} {readonly} {range} />
</div>
