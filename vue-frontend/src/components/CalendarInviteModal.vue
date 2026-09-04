<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
      <!-- Success Icon -->
      <div class="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <div class="text-center space-y-1">
        <h3 class="text-xl font-bold text-stone-900">Weigh-in Saved!</h3>
        <p class="text-sm text-stone-500">Weekly Google Calendar reminder ready</p>
      </div>

      <!-- Detail Card -->
      <div class="p-4 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2">
        <div class="flex justify-between items-center text-stone-700">
          <span class="font-medium text-stone-500">Logged Weight:</span>
          <span class="font-bold text-stone-900 text-sm">{{ data.record.weight }} {{ data.record.unit }}</span>
        </div>
        <div class="flex justify-between items-center text-stone-700">
          <span class="font-medium text-stone-500">Next Reminder:</span>
          <span class="font-semibold text-stone-900">{{ formattedReminderDate }}</span>
        </div>
        <div class="pt-2 border-t border-stone-200 text-stone-600 leading-relaxed">
          Consistent weekly weigh-ins cancel out transient water fluctuations and show true body composition trends.
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-2">
        <a
          :href="data.calendar.googleCalendarUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-sm"
        >
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
          </svg>
          <span>Open Google Calendar Invite</span>
        </a>

        <a
          :href="data.calendar.icsDownloadUrl"
          download
          class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-medium text-sm transition border border-stone-200"
        >
          <svg class="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>Download .ICS File (Apple / Outlook)</span>
        </a>
      </div>

      <button
        type="button"
        @click="$emit('close')"
        class="w-full text-xs text-stone-400 hover:text-stone-700 transition font-medium pt-1"
      >
        Dismiss &amp; View History
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: { type: Object, required: true }
});

defineEmits(['close']);

const formattedReminderDate = computed(() => {
  if (!props.data?.calendar?.reminderDate) return '';
  const d = new Date(props.data.calendar.reminderDate);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});
</script>
