<template>
  <div v-if="visible" class="modal-overlay" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Новый заказ</h3>
        <button class="modal-close" @click="emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Дата:</span>
            <span class="detail-value">{{ formatDateForModal(selectedDate) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Время:</span>
            <span class="detail-value">{{ dragInfo.startTime }} – {{ dragInfo.endTime }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Длительность:</span>
            <span class="detail-value">{{ durationLabel }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Столы:</span>
            <span class="detail-value">{{ tablesLabel }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Количество столов:</span>
            <span class="detail-value">{{ tableCountLabel }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Общая вместимость:</span>
            <span class="detail-value">{{ dragInfo.totalCapacity }} чел</span>
          </div>
        </div>

        <div class="form-group">
          <label for="orderName">Имя клиента:</label>
          <input
            id="orderName"
            v-model="form.customerName"
            type="text"
            placeholder="Введите имя клиента"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="orderPhone">Телефон:</label>
          <input
            id="orderPhone"
            v-model="form.customerPhone"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="orderPeople">Количество человек:</label>
          <input
            id="orderPeople"
            v-model="form.numPeople"
            type="number"
            min="1"
            :max="dragInfo.totalCapacity"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="orderStatus">Статус:</label>
          <select id="orderStatus" v-model="form.status" class="form-select">
            <option value="New">Новый</option>
            <option value="Bill">Счет</option>
            <option value="Closed">Закрыт</option>
            <option value="Banquet">Банкет</option>
            <option value="Reservation">Бронирование</option>
            <option value="LiveQueue">Очередь</option>
          </select>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="emit('close')">Отменить</button>
        <button class="btn btn-primary" :disabled="!canCreate" @click="submit">
          Создать заказ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { Table } from '../types/reservation';
import { formatDateForModal } from '../utils/time';

export interface DragInfo {
  startTime: string;
  endTime: string;
  durationHours: number;
  selectedTables: Table[];
  totalCapacity: number;
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  numPeople: number;
  status: string;
}

const props = defineProps<{
  visible: boolean;
  selectedDate: string;
  dragInfo: DragInfo;
}>();

const emit = defineEmits<{
  close: [];
  create: [payload: CreateOrderPayload];
}>();

const blankForm = () => ({
  customerName: '',
  customerPhone: '',
  numPeople: 1,
  status: 'New',
});

const form = reactive(blankForm());

watch(() => props.visible, (isOpen) => {
  if (isOpen) Object.assign(form, blankForm(), {
    numPeople: Math.min(props.dragInfo.totalCapacity, 1),
  });
});

const durationLabel = computed(() => {
  const h = props.dragInfo.durationHours;
  const suffix = h === 1 ? 'час' : h < 5 ? 'часа' : 'часов';
  return `${h} ${suffix}`;
});

const tablesLabel = computed(() =>
  props.dragInfo.selectedTables.map((t) => `#${t.number}`).join(', '),
);

const tableCountLabel = computed(() => {
  const n = props.dragInfo.selectedTables.length;
  const suffix = n === 1 ? 'стол' : n < 5 ? 'стола' : 'столов';
  return `${n} ${suffix}`;
});

const canCreate = computed(() =>
  form.customerName.trim() !== ''
  && form.customerPhone.trim() !== ''
  && form.numPeople > 0
  && form.numPeople <= props.dragInfo.totalCapacity,
);

const submit = () => {
  if (!canCreate.value) return;
  emit('create', {
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    numPeople: Number(form.numPeople),
    status: form.status,
  });
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-content {
  background-color: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
}

:global(.light-theme) .modal-content {
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

:global(.light-theme) .modal-header {
  background-color: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover { background-color: var(--bg-tertiary); color: var(--text-primary); }

.modal-body { padding: 1.5rem; }

:global(.light-theme) .modal-body { background-color: #ffffff; }

.order-details {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

:global(.light-theme) .order-details {
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.detail-row:last-child { margin-bottom: 0; }
.detail-label { color: var(--text-secondary); font-size: 0.9rem; }
.detail-value { color: var(--text-primary); font-weight: 500; }

.form-group { margin-bottom: 1rem; }
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

:global(.light-theme) .form-input,
:global(.light-theme) .form-select {
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.form-input::placeholder { color: var(--text-muted); }

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

:global(.light-theme) .modal-footer {
  background-color: #f8fafc;
  border-top: 2px solid #e2e8f0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary { background-color: var(--accent-color); color: white; }
.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-1px);
}
.btn-primary:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
  transform: none;
}

.btn-secondary { background-color: var(--bg-tertiary); color: var(--text-primary); }
.btn-secondary:hover { background-color: #505050; }

@media (max-width: 768px) {
  .modal-content { width: 95%; margin: 1rem; }
  .modal-footer { flex-direction: column; }
  .btn { width: 100%; }
}

@media (max-width: 460px) {
  .modal-overlay { padding: 1rem 0.5rem; }
  .modal-content { width: 95%; max-width: none; margin: 1rem auto; padding: 1rem; }
  .modal-header h3 { font-size: 1.2rem; }
  .form-group label { font-size: 14px; }
  .form-group input, .form-group select { padding: 0.5rem; font-size: 14px; }
  .modal-footer { flex-direction: column; gap: 0.5rem; }
  .order-details { padding: 0.75rem; }
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }
  .detail-label { font-size: 12px; }
  .detail-value { font-size: 14px; }
  .btn { padding: 0.75rem; font-size: 14px; }
}
</style>
