export function splitAdmissionDateTime(value: string) {
  if (!value) {
    return { date: '', time: '' };
  }

  const normalized = value.replace(' ', 'T');
  const [datePart = '', timePart = ''] = normalized.split('T');

  return {
    date: datePart,
    time: timePart.slice(0, 5),
  };
}

export function buildAdmissionDateTime(date: string, time: string) {
  if (!date) {
    return '';
  }

  return time ? `${date} ${time}` : date;
}

export function formatAdmissionDateTime(value: string) {
  if (!value) {
    return '-';
  }

  return value.replace('T', ' ');
}
