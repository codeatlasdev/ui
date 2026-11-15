<script lang="ts">
  import { Card, ClampedText } from '@codeatlasdev/ui';

  const posts = [
    {
      id: 'p1',
      author: 'Product team',
      body: 'Shipped the new onboarding flow today. The first screen now asks for a workspace name only; invites, billing and the theme moved to later steps that can be skipped. People in the pilot group got to their first project with fewer steps and fewer questions in the chat. Two things are still open: the spreadsheet import times out on very large files, and the welcome email still links to the old help page. Both are on the board for next week. Thanks to everyone who sat through the early prototypes and sent notes, especially on the empty states, which read much better now.',
    },
    {
      id: 'p2',
      author: 'Office',
      body: 'The office is closed on Friday for the holiday. See you on Monday.',
    },
  ];
</script>

<div class="feed">
  {#each posts as p (p.id)}
    <Card>
      <article class="post">
        <strong class="author">{p.author}</strong>
        <ClampedText lines={3}>{p.body}</ClampedText>
      </article>
    </Card>
  {/each}
</div>

<style>
  .feed {
    display: grid;
    gap: var(--ca-space-4);
    max-width: 560px;
  }

  .post {
    display: grid;
    gap: var(--ca-space-2);
    line-height: var(--ca-line-height-body);
  }

  .author {
    font-weight: var(--ca-font-weight-medium);
  }
</style>
