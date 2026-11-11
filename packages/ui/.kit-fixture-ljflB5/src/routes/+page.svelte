<script>
 import { Sheet, Button } from "@codeatlasdev/ui";
 let sheet = $state(false);
</script><h1>Home</h1><Button onclick={() => (sheet = true)}>Open sheet</Button><Sheet bind:open={sheet} title="Filters"><p>x</p></Sheet>