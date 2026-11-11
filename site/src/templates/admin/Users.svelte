<script lang="ts">
  import UsersScreen from '../_shared/UsersScreen.svelte';

  const ALL = [
    { id:  1, name: 'Ana Lima',        email: 'ana@acme.com',     role: 'Admin',  status: 'active',   plan: 'Pro',  joined: '18 Sep' },
    { id:  2, name: 'Carlos Melo',     email: 'carlos@apex.io',   role: 'Editor', status: 'active',   plan: 'Free', joined: '17 Sep' },
    { id:  3, name: 'Diana Kwan',      email: 'diana@nova.dev',   role: 'Viewer', status: 'inactive', plan: 'Team', joined: '15 Sep' },
    { id:  4, name: 'Eduardo S.',      email: 'edu@mesh.ai',      role: 'Editor', status: 'active',   plan: 'Pro',  joined: '14 Sep' },
    { id:  5, name: 'Fiona Clarke',    email: 'fi@relay.io',      role: 'Admin',  status: 'active',   plan: 'Team', joined: '12 Sep' },
    { id:  6, name: 'George Hart',     email: 'george@orbit.dev', role: 'Viewer', status: 'active',   plan: 'Free', joined: '10 Sep' },
    { id:  7, name: 'Hana Park',       email: 'hana@forge.io',    role: 'Editor', status: 'inactive', plan: 'Pro',  joined: '08 Sep' },
    { id:  8, name: 'Ivan Torres',     email: 'ivan@stack.io',    role: 'Viewer', status: 'active',   plan: 'Free', joined: '05 Sep' },
    { id:  9, name: 'Julia Santos',    email: 'julia@wave.io',    role: 'Editor', status: 'active',   plan: 'Pro',  joined: '03 Sep' },
    { id: 10, name: 'Kevin Zhao',      email: 'kevin@drift.dev',  role: 'Viewer', status: 'active',   plan: 'Free', joined: '01 Sep' },
    { id: 11, name: 'Laura Mendes',    email: 'laura@arc.dev',    role: 'Admin',  status: 'active',   plan: 'Team', joined: '30 Aug' },
    { id: 12, name: 'Miguel Ferreira', email: 'miguel@pulse.io',  role: 'Editor', status: 'inactive', plan: 'Free', joined: '28 Aug' },
  ];
</script>

<UsersScreen users={ALL} newUserHref="/templates/admin/users/new/" selectedLabel="selecionados" />
