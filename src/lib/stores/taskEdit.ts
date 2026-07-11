import { writable } from 'svelte/store'

export const taskEditRequest = writable<{ charName: string; taskId: string } | null>(null)
