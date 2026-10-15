<!--
  Type test (checked by `bun run check`, not rendered): `as` selects the element, and the
  element's own attributes and event types follow it (#154). Each `@ts-expect-error` must fire,
  otherwise svelte-check reports it as unused: a tag only accepts its own attributes.
-->
<script lang="ts">
  import Box from '../Box/Box.svelte';
  import Flex from '../Flex/Flex.svelte';
  import Grid from '../Grid/Grid.svelte';
  import Stack from '../Stack/Stack.svelte';
  import type { PolymorphicProps } from './layout.js';

  function submit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault();
    e.currentTarget.reportValidity();
  }
  function click(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
    void e.currentTarget.href;
  }

  const accepted: PolymorphicProps<'form'> = { novalidate: true, onsubmit: submit };
  void accepted;
  // @ts-expect-error `novalidate` belongs to form, not to the default div
  const onDiv: PolymorphicProps<'div'> = { novalidate: true };
  // @ts-expect-error `href` belongs to a, not to section
  const onSection: PolymorphicProps<'section'> = { href: '/x' };
  // @ts-expect-error `for` belongs to label, not to form
  const onForm: PolymorphicProps<'form'> = { for: 'field' };
  void [onDiv, onSection, onForm];
</script>

<Stack as="form" gap="3" onsubmit={submit} novalidate action="/save" method="post">x</Stack>
<Flex as="form" onsubmit={submit} novalidate>x</Flex>
<Grid as="form" columns={2} onsubmit={submit} autocomplete="off">x</Grid>
<Box as="form" onsubmit={submit} novalidate enctype="multipart/form-data">x</Box>

<Box as="a" href="/x" target="_blank" rel="noopener" onclick={click}>x</Box>
<Flex as="label" for="field">x</Flex>
<Stack as="button" type="submit" disabled>x</Stack>
<Grid as="ul" gap="2">x</Grid>
<Stack gap="2" aria-label="default div">x</Stack>
<Box as="section" p="4" aria-labelledby="h">x</Box>
