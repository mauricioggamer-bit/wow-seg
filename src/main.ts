import { mount } from 'svelte'
import App from './App.svelte'
import { preferencesStore } from './lib/stores/preferences'
import '../css/wow.css'
import '../css/mapa.css'

preferencesStore.init()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
