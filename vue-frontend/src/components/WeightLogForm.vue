<template>
  <div class="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-semibold text-stone-900">Record Today's Weight</h2>
        <p class="text-xs text-stone-500">Each entry automatically generates a Google Calendar invite for exactly 1 week later</p>
      </div>
      <!-- Unit switch -->
      <div class="inline-flex rounded-lg p-1 bg-stone-100 border border-stone-200 text-xs font-medium">
        <button
          type="button"
          :class="[unit === 'kg' ? 'bg-white shadow text-stone-900 font-semibold' : 'text-stone-600', 'px-3 py-1 rounded-md transition']"
          @click="$emit('toggle-unit')"
        >
          kg
        </button>
        <button
          type="button"
          :class="[unit === 'lbs' ? 'bg-white shadow text-stone-900 font-semibold' : 'text-stone-600', 'px-3 py-1 rounded-md transition']"
          @click="$emit('toggle-unit')"
        >
          lbs
        </button>
      </div>
    </div>

    <form @submit.prevent="submitLog" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Weight Input -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold uppercase tracking-wider text-stone-600">Weight ({{ unit }})</label>
          <div class="relative flex items-center">
            <input
              type="number"
              step="0.1"
              min="20"
              max="400"
              v-model="weightInput"
              required
              placeholder="e.g. 75.4"
              class="w-full text-xl font-bold px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50"
            />
            <span class="absolute right-3 text-stone-400 font-semibold text-sm">{{ unit }}</span>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold uppercase tracking-wider text-stone-600">Log Date</label>
          <input
            type="date"
            v-model="loggedDate"
            class="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50"
          />
        </div>

        <!-- Preferred 1-Week Reminder Time -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold uppercase tracking-wider text-stone-600">Reminder Time (+7 days)</label>
          <input
            type="time"
            v-model="reminderTime"
            class="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50"
          />
        </div>
      </div>

      <!-- Notes Field -->
      <div class="space-y-1">
        <label class="block text-xs font-semibold uppercase tracking-wider text-stone-600">Context Notes (Optional)</label>
        <input
          type="text"
          v-model="notes"
          placeholder="e.g. Morning fasted weigh-in, post routine"
          class="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50"
        />
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        :disabled="submitting"
        class="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
      >
        <span>{{ submitting ? 'Saving to SQL Database...' : 'Save Weight &amp; Create Google Calendar Reminder' }}</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  unit: { type: String, default: 'kg' }
});

const emit = defineEmits(['weight-logged', 'toggle-unit']);

const weightInput = ref('');
const loggedDate = ref(new Date().toISOString().split('T')[0]);
const reminderTime = ref('09:00');
const notes = ref('');
const submitting = ref(false);

async function submitLog() {
  if (!weightInput.value) return;

  submitting.value = true;
  try {
    const payload = {
      weight: parseFloat(weightInput.value),
      unit: props.unit,
      logged_at: new Date(loggedDate.value).toISOString(),
      notes: notes.value,
      reminder_time: reminderTime.value,
    };

    const res = await fetch('/api/weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      emit('weight-logged', data);
      weightInput.value = '';
      notes.value = '';
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to record weight');
    }
  } catch (err) {
    console.error('Error submitting log:', err);
    alert('Network error communicating with backend');
  } finally {
    submitting.value = false;
  }
}
</script>
