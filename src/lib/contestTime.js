const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function parseDateOnlyEnd(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
}

export function getContestEndDate(value) {
  if (!value) return null;
  const date = parseDateOnlyEnd(value) || new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getContestRemainingTime(endDateValue, now = new Date()) {
  const endDate = getContestEndDate(endDateValue);
  if (!endDate) {
    return {
      isFinished: false,
      label: 'Fecha por confirmar',
      parts: null,
    };
  }

  const remainingMs = Math.max(0, endDate.getTime() - now.getTime());
  const days = Math.floor(remainingMs / MS_PER_DAY);
  const hours = Math.floor((remainingMs % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((remainingMs % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((remainingMs % MS_PER_MINUTE) / MS_PER_SECOND);

  if (remainingMs <= 0) {
    return {
      isFinished: true,
      label: 'Votación finalizada',
      parts: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    };
  }

  const dayLabel = days === 1 ? 'día' : 'días';
  const label = days > 0
    ? `${days} ${dayLabel} ${hours} h ${minutes} min`
    : `${hours} h ${minutes} min ${seconds} s`;

  return {
    isFinished: false,
    label,
    parts: { days, hours, minutes, seconds },
  };
}
