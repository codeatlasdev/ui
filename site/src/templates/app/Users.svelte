<script lang="ts">
  import UsersScreen from '../_shared/UsersScreen.svelte';

  const ALL = [
    { id:  1, name: 'Ana Lima',        email: 'ana@acme.com',    role: 'Admin',  status: 'active',   plan: 'Pro',  joined: 'Sep 18' },
    { id:  2, name: 'Carlos Melo',     email: 'carlos@apex.io',  role: 'Editor', status: 'active',   plan: 'Free', joined: 'Sep 17' },
    { id:  3, name: 'Diana Kwan',      email: 'diana@nova.dev',  role: 'Viewer', status: 'inactive', plan: 'Team', joined: 'Sep 15' },
    { id:  4, name: 'Eduardo S.',      email: 'edu@mesh.ai',     role: 'Editor', status: 'active',   plan: 'Pro',  joined: 'Sep 14' },
    { id:  5, name: 'Fiona Clarke',    email: 'fi@relay.io',     role: 'Admin',  status: 'active',   plan: 'Team', joined: 'Sep 12' },
    { id:  6, name: 'George Hart',     email: 'george@orbit.dev',role: 'Viewer', status: 'active',   plan: 'Free', joined: 'Sep 10' },
    { id:  7, name: 'Hana Park',       email: 'hana@forge.io',   role: 'Editor', status: 'inactive', plan: 'Pro',  joined: 'Sep 8'  },
    { id:  8, name: 'Ivan Torres',     email: 'ivan@stack.io',   role: 'Viewer', status: 'active',   plan: 'Free', joined: 'Sep 5'  },
    { id:  9, name: 'Julia Santos',    email: 'julia@wave.io',   role: 'Editor', status: 'active',   plan: 'Pro',  joined: 'Sep 3'  },
    { id: 10, name: 'Kevin Zhao',      email: 'kevin@drift.dev', role: 'Viewer', status: 'active',   plan: 'Free', joined: 'Sep 1'  },
    { id: 11, name: 'Laura Mendes',    email: 'laura@arc.dev',   role: 'Admin',  status: 'active',   plan: 'Team', joined: 'Aug 30' },
    { id: 12, name: 'Miguel Ferreira', email: 'miguel@pulse.io', role: 'Editor', status: 'inactive', plan: 'Free', joined: 'Aug 28' },
    { id: 13, name: 'Nina Okafor',     email: 'nina@forma.dev',  role: 'Viewer', status: 'active',   plan: 'Pro',  joined: 'Aug 25' },
    { id: 14, name: 'Oscar Lindqvist', email: 'oscar@crest.io',  role: 'Editor', status: 'active',   plan: 'Team', joined: 'Aug 22' },
    { id: 15, name: 'Priya Nair',      email: 'priya@vela.dev',  role: 'Viewer', status: 'inactive', plan: 'Free', joined: 'Aug 20' },
  ];
</script>

<UsersScreen users={ALL} newUserHref="/templates/app/users/new/" selectedLabel="selected" />
