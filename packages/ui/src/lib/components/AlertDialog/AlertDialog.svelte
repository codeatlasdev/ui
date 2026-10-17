<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import { createIds, createPresence } from '../../primitives/index.js';
  import { modalLayer } from '../Dialog/modal-layer.js';
  import Button from '../Button/Button.svelte';
  import '../Dialog/dialog.css';
  const t = useT();

  /**
   * AlertDialog: confirmation that requires an explicit answer (role="alertdialog").
   *
   * Unlike Dialog: no "X" button, clicking outside does not close it, and initial focus lands on
   * the content. Escape and Cancel close it (and fire `oncancel`), except while `pending`.
   *
   * `onconfirm` may be async: while the promise is pending the confirm button shows a spinner,
   * Cancel is disabled and the dialog stays open. If it resolves, the dialog closes; if it
   * throws, it stays open (the error is rethrown).
   * Pass `pending` to control the state externally.
   *
   * `children` renders a body under the description (a confirmation field, a choice) and
   * `confirmDisabled` keeps Confirm off until it is valid (type-to-confirm). `confirmProps` and
   * `cancelProps` forward attributes (`data-testid`, `id`, `aria-*`) to the two buttons and
   * `cancelVariant` restyles Cancel.
   *
   * Usage:
   *   <AlertDialog
   *     bind:open
   *     title="Delete item?"
   *     description="This action cannot be undone."
   *     confirmLabel="Delete"
   *     destructive
   *     onconfirm={() => api.remove(id)}
   *   />
   */

  /** Attributes a caller may add to a dialog button; variant, loading state, label and click stay owned by the dialog. */
  interface ButtonExtras {
    id?: string;
    class?: string;
    size?: 'sm' | 'md' | 'lg';
    'aria-label'?: string;
    'aria-describedby'?: string;
    [data: `data-${string}`]: string | number | boolean | undefined;
  }

  interface Props {
    open?:         boolean;
    title:         string;
    /** Plain text, or a snippet for rich text (links, emphasis). */
    description?:  string | Snippet;
    confirmLabel?: string;
    cancelLabel?:  string;
    /** Cancel button variant. Default `ghost`. */
    cancelVariant?: 'ghost' | 'outlined' | 'glass' | 'filled';
    /** Keeps Confirm disabled (type-to-confirm). Escape and Cancel still work. */
    confirmDisabled?: boolean;
    /** Attributes for the confirm button (`data-testid`, `id`, `aria-*`). */
    confirmProps?: ButtonExtras;
    /** Attributes for the cancel button. */
    cancelProps?:  ButtonExtras;
    /** Body between the description and the buttons: a confirmation field or a choice. */
    children?:     Snippet;
    /** Confirm button uses the destructive variant. */
    destructive?:  boolean;
    /** Controlled pending state. When omitted, pending is tracked while `onconfirm` is awaited. */
    pending?:      boolean;
    /** Runs on confirm. Dialog closes when it resolves (sync or async). */
    onconfirm:     () => void | Promise<void>;
    oncancel?:     () => void;
    class?:        string;
  }

  let {
    open         = $bindable(false),
    title,
    description,
    confirmLabel,
    cancelLabel,
    cancelVariant = 'ghost',
    confirmDisabled = false,
    confirmProps,
    cancelProps,
    children,
    destructive  = false,
    pending      = false,
    onconfirm,
    oncancel,
    class: className = '',
  }: Props = $props();

  let internalPending = $state(false);
  const isPending = $derived(pending || internalPending);

  async function confirm() {
    if (isPending) return;
    internalPending = true;
    try {
      await onconfirm();
      open = false;
    } finally {
      internalPending = false;
    }
  }

  function cancel() {
    if (isPending) return;
    open = false;
    oncancel?.();
  }

  const uid = $props.id();
  const ids = createIds(uid);
  const presence = createPresence(() => open);

  /** Escape counts as a cancel; a click on the scrim never dismisses an alert dialog. */
  function onDismiss() {
    // Escape while a request is in flight must not dismiss the dialog.
    if (isPending) return;
    open = false;
    oncancel?.();
  }
</script>

{#if presence.present}
  <dialog
    class="ca-overlay ca-dialog ca-dialog--sm ca-alert-dialog {className}"
    role="alertdialog"
    aria-labelledby={ids.part('title')}
    aria-describedby={description ? ids.part('description') : undefined}
    aria-busy={isPending}
    data-state={open ? 'open' : 'closed'}
    style="--dialog-max-w:400px"
    {@attach presence.ref}
    {@attach modalLayer(() => ({ onDismiss, outside: false, initial: 'container', closing: !open }))}
  >
    <div class="ca-dialog__header">
      <h2 id={ids.part('title')} class="ca-dialog__title">{title}</h2>
    </div>

    {#if description}
      <p id={ids.part('description')} class="ca-dialog__description">
        {#if typeof description === 'string'}{description}{:else}{@render description()}{/if}
      </p>
    {/if}

    {#if children}
      <div class="ca-dialog__body">{@render children()}</div>
    {/if}

    <div class="ca-dialog__actions ca-alert-dialog__actions">
      <Button {...cancelProps} variant={cancelVariant} disabled={isPending} onclick={cancel}>{cancelLabel ?? t().alertDialog.cancel}</Button>
      <Button
        {...confirmProps}
        variant={destructive ? 'destructive' : 'filled'}
        disabled={confirmDisabled}
        loading={isPending}
        onclick={confirm}
      >
        {confirmLabel ?? t().alertDialog.confirm}
      </Button>
    </div>
  </dialog>
{/if}
