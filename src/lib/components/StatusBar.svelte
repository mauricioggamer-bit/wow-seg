<script lang="ts">
  import { gistStore } from '../stores/gist'
</script>

<div class="gist-status" class:ok={$gistStore.status.tone === 'ok'} class:error={$gistStore.status.tone === 'error'} class:syncing={$gistStore.status.tone === 'syncing'}>
  {$gistStore.status.text || 'Gist: desconectado'}
</div>
