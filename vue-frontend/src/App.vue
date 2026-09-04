<template>
  <div class="min-h-screen bg-stone-50 text-stone-900 font-sans p-6 md:p-10">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Header -->
      <header class="flex items-center justify-between pb-6 border-b border-stone-200">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Body Weight Tracker</h1>
          <p class="text-stone-500 text-sm mt-1">Log weekly body weight &amp; automatically sync reminder invites with Google Calendar</p>
        </div>
        <div class="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-semibold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          SQL Database Connected
        </div>
      </header>

      <!-- Main Logging Form Component -->
      <WeightLogForm 
        :unit="unit"
        @weight-logged="onWeightLogged"
        @toggle-unit="toggleUnit"
      />

      <!-- Weight History & Trend Chart Component -->
      <WeightHistoryList 
        :logs="logs"
        :unit="unit"
        :loading="loading"
        @delete-log="deleteLog"
        @open-calendar="openCalendarInvite"
      />

      <!-- Google Calendar Reminder Modal -->
      <CalendarInviteModal 
        v-if="activeModalData"
        :data="activeModalData"
        @close="activeModalData = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import WeightLogForm from './components/WeightLogForm.vue';
import WeightHistoryList from './components/WeightHistoryList.vue';
import CalendarInviteModal from './components/CalendarInviteModal.vue';

const logs = ref([]);
const unit = ref('kg');
const loading = ref(false);
const activeModalData = ref(null);

const API_BASE = '/api/weights';

async function fetchLogs() {
  loading.value = true;
  try {
    const res = await fetch(API_BASE);
    if (res.ok) {
      logs.value = await res.json();
    }
  } catch (err) {
    console.error('Error fetching logs:', err);
  } finally {
    loading.value = false;
  }
}

async function onWeightLogged(newEntryResponse) {
  // Show the Google Calendar invite modal immediately
  activeModalData.value = {
    record: newEntryResponse.record,
    calendar: newEntryResponse.calendar,
  };
  await fetchLogs();
}

async function deleteLog(id) {
  if (!confirm('Are you sure you want to delete this weigh-in entry?')) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      logs.value = logs.value.filter(item => item.id !== id);
    }
  } catch (err) {
    console.error('Error deleting log:', err);
  }
}

function openCalendarInvite(log) {
  if (log.google_calendar_url) {
    window.open(log.google_calendar_url, '_blank', 'noopener,noreferrer');
  }
}

function toggleUnit() {
  unit.value = unit.value === 'kg' ? 'lbs' : 'kg';
}

onMounted(() => {
  fetchLogs();
});
</script>
