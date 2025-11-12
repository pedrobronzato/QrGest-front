type BadgeClasses = {
  container: string;
  text: string;
};

type BadgeColors = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

type LookupConfig = {
  label: string;
  synonyms?: string[];
  badgeClasses?: BadgeClasses;
  badgeColors?: BadgeColors;
};

const normalizeValue = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const createResolver = <K extends string>(
  dictionary: Record<K, LookupConfig>,
  defaults: {
    label: string;
    badgeClasses: BadgeClasses;
    badgeColors: BadgeColors;
  },
) => {
  const index = new Map<string, K>();

  const registerKey = (raw: string, key: K) => {
    const normalized = normalizeValue(raw);
    if (normalized && !index.has(normalized)) {
      index.set(normalized, key);
    }
  };

  Object.entries(dictionary).forEach(([key, config]) => {
    const canonicalKey = key as K;
    registerKey(key, canonicalKey);
    (config.synonyms ?? []).forEach((synonym) => registerKey(synonym, canonicalKey));
  });

  return (value?: string | null) => {
    if (!value) {
      return {
        canonical: null as K | null,
        label: defaults.label,
        badgeClasses: defaults.badgeClasses,
        badgeColors: defaults.badgeColors,
      };
    }

    const normalized = normalizeValue(value);
    const canonical = normalized ? index.get(normalized) ?? null : null;
    const entry = canonical ? dictionary[canonical] : undefined;

    return {
      canonical: canonical ?? null,
      label: entry?.label ?? value,
      badgeClasses: entry?.badgeClasses ?? defaults.badgeClasses,
      badgeColors: entry?.badgeColors ?? defaults.badgeColors,
    };
  };
};

const STATUS_DEFAULT_BADGE_CLASSES: BadgeClasses = {
  container: 'bg-gray-100 border border-gray-200',
  text: 'text-gray-700',
};

const STATUS_DEFAULT_BADGE_COLORS: BadgeColors = {
  backgroundColor: '#E2E8F0',
  borderColor: '#CBD5E1',
  textColor: '#1F2937',
};

const TYPE_DEFAULT_BADGE_CLASSES: BadgeClasses = {
  container: 'bg-neutral-100 border border-neutral-200',
  text: 'text-neutral-700',
};

const TYPE_DEFAULT_BADGE_COLORS: BadgeColors = {
  backgroundColor: '#F1F5F9',
  borderColor: '#E2E8F0',
  textColor: '#334155',
};

export type EquipmentStatusKey = 'active' | 'maintenance' | 'maintenance_pending' | 'inactive' | 'out_of_order';

const EQUIPMENT_STATUS_DICTIONARY: Record<EquipmentStatusKey, LookupConfig> = {
  active: {
    label: 'Ativo',
    synonyms: ['ativo', 'em_operacao', 'operando', 'funcionando'],
    badgeClasses: {
      container: 'bg-green-100 border border-green-200',
      text: 'text-green-800',
    },
    badgeColors: {
      backgroundColor: '#DCFCE7',
      borderColor: '#86EFAC',
      textColor: '#166534',
    },
  },
  maintenance: {
    label: 'Em manutenção',
    synonyms: ['maintenance', 'manutencao', 'em_manutencao', 'maintenance_in_progress', 'manutencao_em_andamento'],
    badgeClasses: {
      container: 'bg-yellow-100 border border-yellow-200',
      text: 'text-yellow-800',
    },
    badgeColors: {
      backgroundColor: '#FEF3C7',
      borderColor: '#FDE68A',
      textColor: '#92400E',
    },
  },
  maintenance_pending: {
    label: 'Manutenção Pendente',
    synonyms: ['maintenance_pending', 'manutencao_pendente', 'pendente_manutencao'],
    badgeClasses: {
      container: 'bg-amber-100 border border-amber-200',
      text: 'text-amber-800',
    },
    badgeColors: {
      backgroundColor: '#FEF7CD',
      borderColor: '#FCD34D',
      textColor: '#92400E',
    },
  },
  inactive: {
    label: 'Inativo',
    synonyms: ['inactive', 'inativo', 'desativado', 'fora_de_servico'],
    badgeClasses: {
      container: 'bg-slate-200 border border-slate-300',
      text: 'text-slate-700',
    },
    badgeColors: {
      backgroundColor: '#E2E8F0',
      borderColor: '#CBD5E1',
      textColor: '#334155',
    },
  },
  out_of_order: {
    label: 'Fora de operação',
    synonyms: ['out_of_order', 'fora_de_operacao', 'fora_operacao', 'fora_de_funcionamento', 'quebrado', 'avariado'],
    badgeClasses: {
      container: 'bg-rose-100 border border-rose-200',
      text: 'text-rose-700',
    },
    badgeColors: {
      backgroundColor: '#FFE4E6',
      borderColor: '#FECDD3',
      textColor: '#BE123C',
    },
  },
};

export type EquipmentTypeKey = 'electrical' | 'hydraulic' | 'mechanical' | 'pneumatic' | 'other' | 'none';

const EQUIPMENT_TYPE_DICTIONARY: Record<EquipmentTypeKey, LookupConfig> = {
  electrical: {
    label: 'Elétrico',
    synonyms: ['electrical', 'eletrico', 'eletrica', 'electric'],
    badgeClasses: {
      container: 'bg-blue-100 border border-blue-200',
      text: 'text-blue-700',
    },
    badgeColors: {
      backgroundColor: '#DBEAFE',
      borderColor: '#BFDBFE',
      textColor: '#1D4ED8',
    },
  },
  hydraulic: {
    label: 'Hidráulico',
    synonyms: ['hydraulic', 'hidraulico', 'hidraulica'],
    badgeClasses: {
      container: 'bg-sky-100 border border-sky-200',
      text: 'text-sky-700',
    },
    badgeColors: {
      backgroundColor: '#E0F2FE',
      borderColor: '#BAE6FD',
      textColor: '#0369A1',
    },
  },
  mechanical: {
    label: 'Mecânico',
    synonyms: ['mechanical', 'mecanico', 'mecanica'],
    badgeClasses: {
      container: 'bg-orange-100 border border-orange-200',
      text: 'text-orange-700',
    },
    badgeColors: {
      backgroundColor: '#FFEDD5',
      borderColor: '#FED7AA',
      textColor: '#C2410C',
    },
  },
  pneumatic: {
    label: 'Pneumático',
    synonyms: ['pneumatic', 'pneumatico', 'pneumatica'],
    badgeClasses: {
      container: 'bg-purple-100 border border-purple-200',
      text: 'text-purple-700',
    },
    badgeColors: {
      backgroundColor: '#EDE9FE',
      borderColor: '#DDD6FE',
      textColor: '#6D28D9',
    },
  },
  other: {
    label: 'Outro',
    synonyms: ['outro', 'outros', 'diverso', 'other'],
    badgeClasses: {
      container: 'bg-gray-100 border border-gray-200',
      text: 'text-gray-700',
    },
    badgeColors: {
      backgroundColor: '#F3F4F6',
      borderColor: '#E5E7EB',
      textColor: '#4B5563',
    },
  },
  none: {
    label: 'Não especificado',
    synonyms: ['none', 'nao_informado', 'nao_especificado', 'desconhecido', 'unknown'],
    badgeClasses: {
      container: 'bg-neutral-100 border border-neutral-200',
      text: 'text-neutral-600',
    },
    badgeColors: {
      backgroundColor: '#F1F5F9',
      borderColor: '#E2E8F0',
      textColor: '#475569',
    },
  },
};

const resolveStatus = createResolver(EQUIPMENT_STATUS_DICTIONARY, {
  label: 'Sem status',
  badgeClasses: STATUS_DEFAULT_BADGE_CLASSES,
  badgeColors: STATUS_DEFAULT_BADGE_COLORS,
});

const resolveType = createResolver(EQUIPMENT_TYPE_DICTIONARY, {
  label: 'Tipo não informado',
  badgeClasses: TYPE_DEFAULT_BADGE_CLASSES,
  badgeColors: TYPE_DEFAULT_BADGE_COLORS,
});

export const EQUIPMENT_STATUS_ORDER: EquipmentStatusKey[] = ['active', 'maintenance', 'maintenance_pending', 'inactive', 'out_of_order'];

export const EQUIPMENT_TYPE_ORDER: EquipmentTypeKey[] = ['electrical', 'hydraulic', 'mechanical', 'pneumatic', 'other', 'none'];

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatusKey, string> = EQUIPMENT_STATUS_ORDER
  .reduce((acc, key) => {
    acc[key] = EQUIPMENT_STATUS_DICTIONARY[key].label;
    return acc;
  }, {} as Record<EquipmentStatusKey, string>);

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentTypeKey, string> = EQUIPMENT_TYPE_ORDER
  .reduce((acc, key) => {
    acc[key] = EQUIPMENT_TYPE_DICTIONARY[key].label;
    return acc;
  }, {} as Record<EquipmentTypeKey, string>);

export const resolveEquipmentStatus = (status?: string | null) => resolveStatus(status);

export const resolveEquipmentType = (type?: string | null) => resolveType(type);

export const getEquipmentStatusLabel = (status?: string | null) => resolveEquipmentStatus(status).label;

export const getEquipmentTypeLabel = (type?: string | null) => resolveEquipmentType(type).label;

export const getEquipmentStatusKey = (status?: string | null) => resolveEquipmentStatus(status).canonical;

export const getEquipmentTypeKey = (type?: string | null) => resolveEquipmentType(type).canonical;

type StatusOption = {
  id: EquipmentStatusKey;
  value: EquipmentStatusKey;
  name: string;
  label: string;
};

type TypeOption = {
  id: EquipmentTypeKey;
  value: EquipmentTypeKey;
  name: string;
  label: string;
};

export const getEquipmentStatusOptions = (keys?: EquipmentStatusKey[]): StatusOption[] => {
  const source = keys ?? EQUIPMENT_STATUS_ORDER;
  return source.map((key) => {
    const label = EQUIPMENT_STATUS_DICTIONARY[key].label;
    return {
      id: key,
      value: key,
      name: label,
      label,
    };
  });
};

export const getEquipmentTypeOptions = (keys?: EquipmentTypeKey[]): TypeOption[] => {
  const source = keys ?? EQUIPMENT_TYPE_ORDER;
  return source.map((key) => {
    const label = EQUIPMENT_TYPE_DICTIONARY[key].label;
    return {
      id: key,
      value: key,
      name: label,
      label,
    };
  });
};

export const normalizeEquipmentValue = normalizeValue;

