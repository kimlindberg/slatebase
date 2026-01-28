<script lang="ts">
  import LoginForm from '$lib/components/app/LoginForm.svelte';
  import SteamIcon from '@tabler/icons-svelte/icons/steam';
  import { APP_NAME } from '$lib/constants';
</script>

<div class="relative min-h-[calc(100svh-2rem)] overflow-hidden px-4 py-10">
  <div class="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_20%,rgba(255,186,116,0.35),transparent_55%),radial-gradient(800px_circle_at_80%_10%,rgba(255,124,67,0.25),transparent_55%),linear-gradient(135deg,#fff7ed_0%,#ffedd5_40%,#fff7ed_100%)]"></div>
  <div class="absolute inset-0 opacity-40 [background-image:linear-gradient(120deg,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0.0)_60%),repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_8px)]"></div>

  <div class="relative mx-auto max-w-sm">
    <div class="mb-6 flex items-center gap-2">
      <SteamIcon class="size-6 text-orange-500" />
      <span class="text-lg font-semibold">{APP_NAME}</span>
    </div>
    <LoginForm />
  </div>
</div>
