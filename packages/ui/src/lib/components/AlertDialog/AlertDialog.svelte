<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { createIds, createPresence } from '../../primitives/index.js';
  import { modalLayer } from '../Dialog/modal-layer.js';
  import Button from '../Button/Button.svelte';
  import '../Dialog/dialog.css';

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

  interface Props {
    open?:         boolean;
    title:         string;
    description?:  string;
    confirmLabel?: string;
    cancelLabel?:  string;
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
    {@attach modalLayer(() => ({ onDismiss, outside: false, initial: 'container' }))}
  >
    <div class="ca-dialog__header">
      <h2 id={ids.part('title')} class="ca-dialog__title">{title}</h2>
    </div>

    {#if description}
      <p id={ids.part('description')} class="ca-dialog__description">{description}</p>
    {/if}

    <div class="ca-dialog__actions ca-alert-dialog__actions">
      <Button variant="ghost" disabled={isPending} onclick={cancel}>{cancelLabel ?? t().alertDialog.cancel}</Button>
      <Button
        variant={destructive ? 'destructive' : 'filled'}
        loading={isPending}
        onclick={confirm}
      >
        {confirmLabel ?? t().alertDialog.confirm}
      </Button>
    </div>
  </dialog>
{/if}
