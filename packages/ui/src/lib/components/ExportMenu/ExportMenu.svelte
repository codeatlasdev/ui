<script lang="ts" generics="T extends object">
  import { Download } from '@lucide/svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import { announce } from '../../utils/announce.js';
  import { downloadFile, toCsv, toJson, type ExportColumn } from '../../utils/export.js';
  import Button from '../Button/Button.svelte';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuItem from '../DropdownMenu/DropdownMenuItem.svelte';
  const t = useT();

  type Format = 'csv' | 'json';
  interface ExportEvent {
    format: Format;
    /** Final file name, with extension. */
    filename: string;
    /** The generated text. */
    content: string;
    rows: number;
  }

  /**
   * ExportMenu: "Export" button with a CSV / JSON menu.
   *
   * Builds the file from `data` in the browser (RFC 4180 CSV with spreadsheet-formula
   * neutralisation, pretty JSON), downloads it and announces the result politely.
   * Pass `onexport` to take over the delivery (e.g. upload) after the download.
   *
   * Usage:
   *   <ExportMenu data={rows} filename="domains" columns={[{ key: 'domain' }, { key: 'price' }]} />
   */
  interface Props {
    /** Rows to export (all of them, not just the visible page). */
    data: readonly T[];
    /** Base file name without extension. */
    filename?: string;
    /** Columns, order and headers. Defaults to the keys of the first row. */
    columns?: readonly ExportColumn<T>[];
    /** Formats offered, in menu order. */
    formats?: Format[];
    /** Visible button label. */
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'filled' | 'glass' | 'outlined' | 'ghost';
    disabled?: boolean;
    class?: string;
    /** Called after each export with the generated content. */
    onexport?: (e: ExportEvent) => void;
  }

  let {
    data,
    filename = 'export',
    columns,
    formats = ['csv', 'json'],
    label,
    size = 'md',
    variant = 'outlined',
    disabled = false,
    class: className = '',
    onexport,
  }: Props = $props();

  const MIME: Record<Format, string> = { csv: 'text/csv;charset=utf-8', json: 'application/json' };

  function run(format: Format) {
    const content = format === 'csv' ? toCsv(data, columns) : toJson(data, columns);
    const name = `${filename}.${format}`;
    // A leading BOM lets Excel open UTF-8 CSV with the right encoding.
    downloadFile(name, format === 'csv' ? `\uFEFF${content}` : content, MIME[format]);
    announce(t().exportMenu.exported(format.toUpperCase(), data.length));
    onexport?.({ format, filename: name, content, rows: data.length });
  }
</script>

<DropdownMenu align="end" class={className}>
  {#snippet triggerChild(props)}
    <Button {...props} {variant} {size} disabled={disabled || data.length === 0}>
      {#snippet leading()}<Download size={16} stroke-width={2} />{/snippet}
      {label ?? t().exportMenu.label}
    </Button>
  {/snippet}
  {#each formats as format (format)}
    <DropdownMenuItem onclick={() => run(format)}>{t().exportMenu[format]}</DropdownMenuItem>
  {/each}
</DropdownMenu>
