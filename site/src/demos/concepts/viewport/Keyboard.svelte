<script lang="ts">
  import { Button, StickyActions, TextField } from '@codeatlasdev/ui';
  import { keyboardAware } from '@codeatlasdev/ui/actions';

  let email = $state('');
  let sent = $state(false);
</script>

<form
  class="form"
  use:keyboardAware
  onsubmit={(e) => {
    e.preventDefault();
    sent = true;
  }}
>
  <h3 class="title">Create your account</h3>
  <p class="hint">On a phone, focus a field: the page keeps scrolling, and the action bar stays above the keyboard and the home indicator.</p>
  <TextField label="Work email" type="email" bind:value={email} autocomplete="email" />
  <TextField label="Company" autocomplete="organization" />
  <TextField label="Role" autocomplete="organization-title" />
  <div class="filler">Terms, pricing note and what happens next sit here, reachable by scrolling.</div>
  <StickyActions align="stretch">
    <Button variant="filled" type="submit">{sent ? 'Sent' : 'Continue'}</Button>
  </StickyActions>
</form>

<style>
  .form { display: grid; gap: var(--ca-space-3); width: 100%; max-height: 24rem; overflow-y: auto; padding: var(--ca-space-4); }
  .title { margin: 0; }
  .hint { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
  .filler { min-block-size: 8rem; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
</style>
