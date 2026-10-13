<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { AlertDialog } from 'bits-ui';
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

  function handleOpenChange(next: boolean) {
    // Escape while a request is in flight must not dismiss the dialog.
    if (!next && isPending) {
      open = true;
      return;
    }
    // Escape is a cancel (Cancel button and confirm close `open` directly).
    if (!next) oncancel?.();
  }
</script>

<AlertDialog.Root bind:open onOpenChange={handleOpenChange}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="ca-overlay" />
    <AlertDialog.Content
      class="ca-dialog ca-dialog--sm ca-alert-dialog {className}"
      style="--dialog-max-w:400px"
      aria-busy={isPending}
    >
      <div class="ca-dialog__header">
        <AlertDialog.Title class="ca-dialog__title">{title}</AlertDialog.Title>
      </div>

      {#if description}
        <AlertDialog.Description class="ca-dialog__description">{description}</AlertDialog.Description>
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
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
