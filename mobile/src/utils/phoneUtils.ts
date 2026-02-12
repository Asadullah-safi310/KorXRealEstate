const stripAfghanPrefixes = (digits: string) => {
  if (digits.startsWith('0093')) {
    return digits.slice(4);
  }
  if (digits.startsWith('93')) {
    return digits.slice(2);
  }
  return digits;
};

const stripLeadingZeros = (digits: string) => {
  let trimmed = digits;
  while (trimmed.startsWith('0')) {
    trimmed = trimmed.slice(1);
  }
  return trimmed;
};

export const normalizeAfghanPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  let core = stripAfghanPrefixes(digits);
  core = stripLeadingZeros(core);
  if (!core) return '';
  core = core.slice(0, 9);
  return `0${core}`;
};

export const isAfghanPhoneValid = (value: string) => {
  const normalized = normalizeAfghanPhone(value);
  return normalized.length === 10;
};
