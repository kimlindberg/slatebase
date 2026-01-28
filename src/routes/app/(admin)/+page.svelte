<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

  let { data } = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle>Welcome back</CardTitle>
    <CardDescription>You're signed in as {data.user?.email ?? 'an admin'}.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="text-sm text-muted-foreground">
      This is your admin home. Use the sidebar to manage customers, bookings, invoices, and settings.
    </p>
  </CardContent>
</Card>
