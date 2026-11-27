export const MATRIX_OPTIONS = [
  { value: 'LP_GRADE', label: 'Visão Simples', unitPrice: 33.5 },
  { value: 'GRADE_167', label: '1.67', unitPrice: 55.0 },
  { value: 'MF_ACB', label: 'Multifocal Acabado', unitPrice: 42.5 },
  { value: 'MF_BLOCO', label: 'Multifocal', unitPrice: 47.5 },
  { value: 'BLOCO_VS', label: 'Bloco Visão Simples', unitPrice: 37.5 },
  { value: 'SOMENTE_SERVICO', label: 'Somente Serviço (Sem Lente)', unitPrice: 0.0 },
];

export const EYE_TARGET_OPTIONS = [
  { value: 'OD_OE', label: 'Ambos (Par)', short: 'OD + OE' },
  { value: 'OD', label: 'Direito (OD)', short: 'OD' },
  { value: 'OE', label: 'Esquerdo (OE)', short: 'OE' },
];

export const SERVICE_OPTIONS = [
  { value: 'Montagem Padrão', label: 'Montagem Padrão', price: 13.0 },
  { value: 'Aro Fechado (Acetato/Metal)', label: 'Aro Fechado', price: 13.0 },
  { value: 'Fio de Nylon (Semi-Aro)', label: 'Fio de Nylon', price: 18.0 },
  { value: 'Parafuso / Balgriff (Três Peças)', label: 'Parafuso / Balgriff', price: 25.0 },
  { value: 'Coloração Solar / Filtro Especial', label: 'Coloração Solar', price: 20.0 },
  { value: 'Sem Montagem (Apenas Lentes)', label: 'Sem Montagem', price: 0.0 },
];

export const parseDiopter = (val) => {
  if (val === null || val === undefined || val === '') return 0.0;
  const normalized = String(val).trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0.0 : parsed;
};

export const sanitizeDiopterInput = (raw, allowNegative = true) => {
  return String(raw).replace(allowNegative ? /[^0-9.,+-]/g : /[^0-9.,+]/g, '');
};

export const formatDiopterOnBlur = (val, { allowNegative = true, emptyIfBlank = false } = {}) => {
  if (emptyIfBlank && String(val ?? '').trim() === '') return '';
  let num = parseDiopter(val);
  if (!allowNegative && num < 0) num = Math.abs(num);
  return num.toFixed(2);
};

export const createEmptyRow = (index = 1) => ({
  id: Date.now() + Math.random(),
  client_order_number: '',
  tray_number: String(index).padStart(2, '0'),
  matrix_type: 'LP_GRADE',
  lens_model_id: '',
  eye_target: 'OD_OE',
  has_prescription: true,
  od_spherical: '0.00',
  od_cylindrical: '0.00',
  od_axis: '0',
  od_addition: '0.00',
  od_base_curve: '',
  oe_spherical: '0.00',
  oe_cylindrical: '0.00',
  oe_axis: '0',
  oe_addition: '0.00',
  oe_base_curve: '',
  service_type: 'Montagem Padrão',
  treatment: 'Incolor / Sem Tratamento',
  lens_unit_price: 0,
  lens_price: 0,
  service_price: 13.0,
  treatment_price: 0.0,
  total_amount: '',
  is_manual_total: false,
  special_instructions: ''
});

/**
 * Calcula o saldo livre disponível na grade carregada para um olho (OD ou OE),
 * replicando a lógica de matching do backend (transposição de cilíndrico, base e adição).
 */
export const checkEyeInventoryBalance = (gridItems, matrixType, eyeSide, rx) => {
  if (!Array.isArray(gridItems) || gridItems.length === 0) {
    return { status: 'unknown', available: 0 };
  }
  const mt = String(matrixType || 'LP_GRADE').toUpperCase();
  const freeQty = (it) => Math.max(0, (parseInt(it.quantity_available, 10) || 0) - (parseInt(it.reserved_quantity, 10) || 0));

  let matched = [];

  if (mt === 'LP_GRADE' || mt === 'GRADE_167') {
    let sph = parseDiopter(rx.spherical);
    let cyl = parseDiopter(rx.cylindrical);
    if (cyl > 0) {
      sph = sph + cyl;
      cyl = -cyl;
    }
    matched = gridItems.filter(
      (it) =>
        it.spherical !== null &&
        it.cylindrical !== null &&
        Math.abs(parseFloat(it.spherical) - sph) < 0.01 &&
        Math.abs(parseFloat(it.cylindrical) - cyl) < 0.01
    );
  } else if (mt === 'MF_ACB' || mt === 'MF_BLOCO') {
    const add = Math.abs(parseDiopter(rx.addition));
    const base = Math.abs(parseDiopter(rx.baseCurve));
    const sideAliases = eyeSide === 'OD' ? ['OD', 'D', 'AMB', 'OD_OE'] : ['OE', 'E', 'AMB', 'OD_OE'];
    matched = gridItems.filter((it) => {
      const addOk = it.addition !== null && Math.abs(parseFloat(it.addition) - add) < 0.01;
      const baseOk = base <= 0 || (it.base_curve !== null && Math.abs(parseFloat(it.base_curve) - base) < 0.01);
      const eyeOk = !it.eye || sideAliases.includes(String(it.eye).toUpperCase());
      return addOk && baseOk && eyeOk;
    });
  } else if (mt === 'BLOCO_VS') {
    const base = Math.abs(parseDiopter(rx.baseCurve));
    if (base > 0) {
      matched = gridItems.filter(
        (it) => it.base_curve !== null && Math.abs(parseFloat(it.base_curve) - base) < 0.01
      );
    } else {
      matched = gridItems;
    }
  }

  if (matched.length === 0) {
    return { status: 'missing', available: 0 };
  }
  const totalAvailable = matched.reduce((acc, it) => acc + freeQty(it), 0);
  return {
    status: totalAvailable > 0 ? 'ok' : 'empty',
    available: totalAvailable,
  };
};
