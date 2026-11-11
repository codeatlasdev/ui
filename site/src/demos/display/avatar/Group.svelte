<script lang="ts">
  import { AvatarGroup } from '@codeatlasdev/ui';

  const reviewers = [
    { name: 'Alice Moreira', src: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Bob Tavares', src: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Clara Nunes', src: 'https://i.pravatar.cc/150?img=32' },
    { name: 'Davi Prado' },
    { name: 'Eva Ramos' },
    { name: 'Fabio Lins' },
  ];
</script>

<AvatarGroup items={reviewers} max={4} label="Reviewers" />
