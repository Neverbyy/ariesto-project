import { computed, type ComputedRef, type Ref } from 'vue';
import type { GridItem } from '../utils/tableItems';

interface BaseFields {
  title: string;
  badge: string;
  time: string;
  people: string;
}

export interface OrderFields extends BaseFields {
  type: 'order';
  customer: string;
  phone: string;
}

export interface ReservationFields extends BaseFields {
  type: 'reservation';
  phone: string;
}

export type CardFields = OrderFields | ReservationFields;

export interface CardDisplay {
  showExtra: boolean;
  showCustomer: boolean;
  showPhone: boolean;
  showPeople: boolean;
}

interface UseCardFieldsParams {
  item: Ref<GridItem>;
  isOrder: Ref<boolean>;
  statusLabel: Ref<string>;
  timeText: Ref<string>;
  itemHeightPx: Ref<number>;
  hasOverflow: Ref<boolean>;
}

interface UseCardFieldsReturn {
  fields: ComputedRef<CardFields>;
  display: ComputedRef<CardDisplay>;
  customerLine: ComputedRef<string>;
  tooltipLines: ComputedRef<string[]>;
}

export function useCardFields(params: UseCardFieldsParams): UseCardFieldsReturn {
  const { item, isOrder, statusLabel, timeText, itemHeightPx, hasOverflow } = params;

  const display = computed<CardDisplay>(() => {
    const h = itemHeightPx.value;
    return {
      showExtra: h >= 60,
      showCustomer: h >= 75,
      showPhone: h >= 70,
      showPeople: h >= 65,
    };
  });

  const fields = computed<CardFields>(() => {
    const people = item.value.num_people ? `${item.value.num_people} чел` : '';
    if (isOrder.value) {
      return {
        type: 'order',
        title: 'Заказ',
        badge: statusLabel.value,
        time: timeText.value,
        people,
        customer: item.value.customer_name || '',
        phone: item.value.customer_phone || '',
      };
    }
    const phone = item.value.phone_number ? String(item.value.phone_number) : '';
    return {
      type: 'reservation',
      title: item.value.name_for_reservation ?? '',
      badge: statusLabel.value,
      time: timeText.value,
      people,
      phone,
    };
  });

  const customerLine = computed(() => {
    const f = fields.value;
    if (f.type !== 'order') return '';
    const d = display.value;
    const name = d.showCustomer ? f.customer : '';
    const people = d.showPeople ? f.people : '';
    return [name, people].filter(Boolean).join('; ');
  });

  const tooltipLines = computed<string[]>(() => {
    const d = display.value;
    const f = fields.value;
    const customer = f.type === 'order' ? f.customer : '';

    const hiddenByThresholds = !d.showExtra
      || (!!customer && !d.showCustomer)
      || (!!f.phone && !d.showPhone)
      || (!!f.people && !d.showPeople);

    if (!hiddenByThresholds && !hasOverflow.value) return [];

    const lines = [`${f.title} · ${f.badge}`, f.time];
    if (customer) lines.push(customer);
    if (f.people) lines.push(f.people);
    if (f.phone) lines.push(`📞 ${f.phone}`);
    return lines;
  });

  return { fields, display, customerLine, tooltipLines };
}
