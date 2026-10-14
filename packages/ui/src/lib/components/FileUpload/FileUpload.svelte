<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import { Upload, X, File as FileIcon, Image as ImageIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  const t = useT();

  interface Props {
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // bytes
    disabled?: boolean;
    files?: File[];
    label?: string;
    hint?: string;
    class?: string;
    onchange?: (files: File[]) => void;
    children?: Snippet;
  }

  let {
    accept,
    multiple = false,
    maxSize,
    disabled = false,
    files = $bindable([]),
    label,
    hint,
    class: className = '',
    onchange,
    children,
  }: Props = $props();

  let dragging = $state(false);
  let errors = $state<string[]>([]);
  let inputRef = $state<HTMLInputElement | null>(null);

  function validate(picked: FileList | File[]): File[] {
    const arr = Array.from(picked);
    errors = [];
    const valid: File[] = [];
    for (const f of arr) {
      if (maxSize && f.size > maxSize) {
        errors = [...errors, t().fileUpload.tooLarge(f.name, (maxSize / 1024 / 1024).toFixed(1))];
        continue;
      }
      valid.push(f);
    }
    return valid;
  }

  function pick(picked: FileList | null) {
    if (!picked) return;
    const valid = validate(picked);
    files = multiple ? [...files, ...valid] : valid;
    onchange?.(files);
  }

  function remove(idx: number) {
    files = files.filter((_, i) => i !== idx);
    onchange?.(files);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (disabled) return;
    pick(e.dataTransfer?.files ?? null);
  }

  function isImage(f: File) {
    return f.type.startsWith('image/');
  }
</script>

<div class="ca-file-upload {className}" class:ca-file-upload--disabled={disabled}>
  <div
    class="ca-file-upload__zone glass-upload-zone"
    class:ca-file-upload__zone--dragging={dragging}
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-label={label ?? t().fileUpload.label}
    ondragover={(e) => { e.preventDefault(); if (!disabled) dragging = true; }}
    ondragleave={() => { dragging = false; }}
    ondrop={handleDrop}
    onclick={() => inputRef?.click()}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef?.click(); } }}
  >
    {#if children}
      {@render children()}
    {:else}
      <Upload size={24} class="ca-file-upload__icon" />
      <span class="ca-file-upload__label">{label ?? t().fileUpload.label}</span>
      {#if hint}
        <span class="ca-file-upload__hint">{hint}</span>
      {:else if accept}
        <span class="ca-file-upload__hint">{accept}</span>
      {/if}
    {/if}
  </div>

  <input
    bind:this={inputRef}
    type="file"
    {accept}
    {multiple}
    {disabled}
    class="ca-file-upload__input"
    tabindex="-1"
    aria-hidden="true"
    onchange={(e) => pick((e.target as HTMLInputElement).files)}
  />

  {#if errors.length > 0}
    <ul class="ca-file-upload__errors">
      {#each errors as err}
        <li>{err}</li>
      {/each}
    </ul>
  {/if}

  {#if files.length > 0}
    <ul class="ca-file-upload__list">
      {#each files as f, i}
        <li class="ca-file-upload__file">
          {#if isImage(f)}
            <ImageIcon size={16} class="ca-file-upload__file-icon" />
          {:else}
            <FileIcon size={16} class="ca-file-upload__file-icon" />
          {/if}
          <span class="ca-file-upload__file-name">{f.name}</span>
          <span class="ca-file-upload__file-size">{(f.size / 1024).toFixed(0)} KB</span>
          <button
            type="button"
            class="ca-file-upload__remove"
            aria-label={t().fileUpload.remove(f.name)}
            onclick={() => remove(i)}
          >
            <X size={14} />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-file-upload {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-2);
    }

    .ca-file-upload__zone {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-2);
      padding: var(--ca-space-8) var(--ca-space-6);
      border-radius: var(--ca-radius-lg);
      border: var(--ca-border-width-strong) dashed var(--ca-outline-subtle);
      cursor: pointer;
      text-align: center;
      transition:
        border-color var(--ca-duration-fast) var(--ca-ease-standard),
        background var(--ca-duration-fast) var(--ca-ease-standard);
      outline: none;
    }

    .ca-file-upload__zone:hover {
      border-color: var(--ca-brand-main);
      background: color-mix(in oklab, var(--ca-brand-main) 5%, transparent);
    }
    .ca-file-upload__zone:focus-visible {
      border-color: var(--ca-focus-ring);
      background: color-mix(in oklab, var(--ca-brand-main) 5%, transparent);
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }

    .ca-file-upload__zone--dragging {
      border-color: var(--ca-brand-main);
      background: color-mix(in oklab, var(--ca-brand-main) 8%, transparent);
    }

    .ca-file-upload__input {
      position: absolute;
      inset: 0;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
    }

    :global(.ca-file-upload__icon) {
      color: var(--ca-text-hint);
    }

    .ca-file-upload__label {
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
    }
    .ca-file-upload--disabled .ca-file-upload__label { color: var(--ca-text-secondary); }

    .ca-file-upload__hint {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-hint);
    }

    .ca-file-upload--disabled .ca-file-upload__zone {
      /* No opacity: it would drop the label below 4.5:1. Muted text + border convey the state. */
      border-style: dashed;
      background: var(--ca-action-disabled-bg);
      cursor: not-allowed;
      pointer-events: none;
    }

    .ca-file-upload__errors {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
    }

    .ca-file-upload__errors li {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-semantic-error);
    }

    .ca-file-upload__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
    }

    .ca-file-upload__file {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      padding: var(--ca-space-2) var(--ca-space-3);
      border-radius: var(--ca-radius-sm);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      background: var(--ca-action-hover);
    }

    :global(.ca-file-upload__file-icon) {
      color: var(--ca-text-hint);
      flex-shrink: 0;
    }

    .ca-file-upload__file-name {
      flex: 1;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ca-file-upload__file-size {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-hint);
      flex-shrink: 0;
    }

    .ca-file-upload__remove {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ca-text-hint);
      padding: var(--ca-space-0-5);
      border-radius: var(--ca-radius-xs);
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-file-upload__remove:hover {
      color: var(--ca-semantic-error);
    }
}
</style>
