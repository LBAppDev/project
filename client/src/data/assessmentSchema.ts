export type Language = 'fr' | 'en' | 'ar';

export type LocalizedText = Record<Language, string>;
export type AssessmentValue = string | string[];
export type FieldType = 'number' | 'text' | 'textarea' | 'yesno' | 'single' | 'multi';

export interface FieldOption {
  value: string;
  label: LocalizedText;
}

export interface FieldSchema {
  key: string;
  type: FieldType;
  label: LocalizedText;
  unit?: string;
  options?: FieldOption[];
  dependsOn?: string;
  dependsValue?: string;
}

export interface SectionSchema {
  key: string;
  title: LocalizedText;
  description: LocalizedText;
  fields: FieldSchema[];
}

const yesNoField = (key: string, label: LocalizedText): FieldSchema => ({
  key,
  type: 'yesno',
  label,
});

export const assessmentSchema: SectionSchema[] = [
  {
    key: 'breathing',
    title: {
      fr: 'Besoin de respirer',
      en: 'Need to breathe',
      ar: 'الحاجة إلى التنفس',
    },
    description: {
      fr: 'Mesures respiratoires, ventilation et signes cliniques.',
      en: 'Respiratory measurements, ventilation and clinical signs.',
      ar: 'القياسات التنفسية ونوع التهوية والعلامات السريرية.',
    },
    fields: [
      { key: 'spo2', type: 'number', label: { fr: 'SpO2', en: 'SpO2', ar: 'تشبع الاكسجين' }, unit: '%' },
      { key: 'respiratoryRate', type: 'number', label: { fr: 'Frequence respiratoire', en: 'Respiratory rate', ar: 'معدل التنفس' } },
      {
        key: 'ventilationType',
        type: 'single',
        label: { fr: 'Type de ventilation', en: 'Ventilation type', ar: 'نوع التهوية' },
        options: [
          { value: 'spontaneous', label: { fr: 'Ventilation spontanee', en: 'Spontaneous breathing', ar: 'تنفس تلقائي' } },
          { value: 'oxygenTherapy', label: { fr: 'Oxygenotherapie', en: 'Oxygen therapy', ar: 'علاج بالاكسجين' } },
          { value: 'nonInvasive', label: { fr: 'Ventilation non invasive (VNI)', en: 'Non-invasive ventilation', ar: 'تهوية غير غازية' } },
          { value: 'invasive', label: { fr: 'Ventilation invasive', en: 'Invasive ventilation', ar: 'تهوية غازية' } },
          { value: 'assistedSpontaneous', label: { fr: 'Ventilation spontanee assistee (VS / PSV)', en: 'Assisted spontaneous ventilation', ar: 'تهوية تلقائية مساعدة' } },
        ],
      },
      {
        key: 'oxygenTherapyType',
        type: 'single',
        label: { fr: "Type d'oxygenotherapie", en: 'Oxygen therapy subtype', ar: 'نوع العلاج بالاكسجين' },
        dependsOn: 'ventilationType',
        dependsValue: 'oxygenTherapy',
        options: [
          { value: 'nasalCannula', label: { fr: 'Lunette', en: 'Nasal cannula', ar: 'قنية انفية' } },
          { value: 'mask', label: { fr: 'Masque', en: 'Mask', ar: 'قناع' } },
          { value: 'highConcentrationMask', label: { fr: 'Masque a haute concentration', en: 'High concentration mask', ar: 'قناع عالي التركيز' } },
        ],
      },
      {
        key: 'nonInvasiveType',
        type: 'single',
        label: { fr: 'Type de VNI', en: 'NIV subtype', ar: 'نوع التهوية غير الغازية' },
        dependsOn: 'ventilationType',
        dependsValue: 'nonInvasive',
        options: [
          { value: 'cpap', label: { fr: 'CPAP', en: 'CPAP', ar: 'سيباب' } },
          { value: 'bipap', label: { fr: 'BiPAP', en: 'BiPAP', ar: 'بايباب' } },
        ],
      },
      yesNoField('isIntubated', { fr: 'Intube', en: 'Intubated', ar: 'منبوب' }),
      {
        key: 'ventilatorSettings',
        type: 'textarea',
        label: { fr: 'Parametres du respirateur', en: 'Ventilator settings', ar: 'اعدادات جهاز التنفس' },
        dependsOn: 'isIntubated',
        dependsValue: 'yes',
      },
      yesNoField('isTracheostomized', { fr: 'Tracheotomise', en: 'Tracheostomized', ar: 'فغر الرغامى' }),
      yesNoField('dyspnea', { fr: 'Dyspnee', en: 'Dyspnea', ar: 'ضيق التنفس' }),
      {
        key: 'breathingRateState',
        type: 'single',
        label: { fr: 'Tachypnee / Bradypnee', en: 'Tachypnea / Bradypnea', ar: 'تسرع او بطء التنفس' },
        options: [
          { value: 'tachypnea', label: { fr: 'Tachypnee', en: 'Tachypnea', ar: 'تسرع التنفس' } },
          { value: 'bradypnea', label: { fr: 'Bradypnee', en: 'Bradypnea', ar: 'بطء التنفس' } },
        ],
      },
      yesNoField('tirage', { fr: 'Tirage', en: 'Retractions', ar: 'سحب تنفسي' }),
      yesNoField('cyanosis', { fr: 'Cyanose', en: 'Cyanosis', ar: 'زرقة' }),
      {
        key: 'cyanosisLocation',
        type: 'multi',
        label: { fr: 'Localisation de la cyanose', en: 'Cyanosis location', ar: 'مكان الزرقة' },
        dependsOn: 'cyanosis',
        dependsValue: 'yes',
        options: [
          { value: 'lips', label: { fr: 'Levres', en: 'Lips', ar: 'الشفاه' } },
          { value: 'extremities', label: { fr: 'Extremites', en: 'Extremities', ar: 'الاطراف' } },
        ],
      },
      yesNoField('apnea', { fr: 'Apnee', en: 'Apnea', ar: 'انقطاع النفس' }),
      yesNoField('dyspneaAgitation', { fr: 'Agitation liee a la dyspnee', en: 'Dyspnea-related agitation', ar: 'هيجان مرتبط بضيق التنفس' }),
      yesNoField('tachycardia', { fr: 'Tachycardie', en: 'Tachycardia', ar: 'تسرع القلب' }),
      yesNoField('respiratoryFatigue', { fr: 'Fatigue respiratoire', en: 'Respiratory fatigue', ar: 'تعب تنفسي' }),
      yesNoField('sweating', { fr: 'Sueur', en: 'Sweating', ar: 'تعرق' }),
      yesNoField('cough', { fr: 'Toux', en: 'Cough', ar: 'سعال' }),
      {
        key: 'coughTypes',
        type: 'multi',
        label: { fr: 'Type de toux', en: 'Cough type', ar: 'نوع السعال' },
        dependsOn: 'cough',
        dependsValue: 'yes',
        options: [
          { value: 'dry', label: { fr: 'Toux seche', en: 'Dry cough', ar: 'سعال جاف' } },
          { value: 'wet', label: { fr: 'Toux grasse', en: 'Wet cough', ar: 'سعال رطب' } },
          { value: 'productive', label: { fr: 'Toux productive', en: 'Productive cough', ar: 'سعال منتج' } },
          { value: 'paroxysmal', label: { fr: 'Toux quinteuse', en: 'Paroxysmal cough', ar: 'سعال نوبات' } },
          { value: 'barking', label: { fr: 'Toux aboyante', en: 'Barking cough', ar: 'سعال نباحي' } },
          { value: 'wheezing', label: { fr: 'Toux sifflante', en: 'Wheezing cough', ar: 'سعال صفيري' } },
          { value: 'night', label: { fr: 'Toux nocturne', en: 'Night cough', ar: 'سعال ليلي' } },
          { value: 'hemoptysis', label: { fr: 'Toux hemoptoique', en: 'Hemoptysis-related cough', ar: 'سعال دموي' } },
        ],
      },
      { key: 'expectorationQuantity', type: 'text', label: { fr: 'Expectoration - quantite', en: 'Sputum quantity', ar: 'كمية البلغم' } },
      { key: 'expectorationAspect', type: 'text', label: { fr: 'Expectoration - aspect', en: 'Sputum appearance', ar: 'مظهر البلغم' } },
      { key: 'expectorationOdor', type: 'text', label: { fr: 'Expectoration - odeur', en: 'Sputum odor', ar: 'رائحة البلغم' } },
      yesNoField('bronchialCongestion', { fr: 'Encombrement bronchique', en: 'Bronchial congestion', ar: 'احتقان قصبي' }),
      { key: 'actionsNotes', type: 'textarea', label: { fr: 'Actes faits / remarques', en: 'Actions performed / notes', ar: 'الاجراءات والملاحظات' } },
    ],
  },
  {
    key: 'nutrition',
    title: { fr: 'Besoin de boire et manger', en: 'Need to drink and eat', ar: 'الحاجة الى الشرب والاكل' },
    description: { fr: "Type d'alimentation, glycemie et signes digestifs.", en: 'Feeding type, glycemia and digestive signs.', ar: 'نوع التغذية وسكر الدم والعلامات الهضمية.' },
    fields: [
      {
        key: 'feedingType',
        type: 'single',
        label: { fr: "Type d'alimentation", en: 'Feeding type', ar: 'نوع التغذية' },
        options: [
          { value: 'oral', label: { fr: 'Alimentation orale', en: 'Oral feeding', ar: 'تغذية فموية' } },
          { value: 'sng', label: { fr: 'Sonde nasogastrique (SNG)', en: 'Nasogastric tube', ar: 'انبوب انفي معدي' } },
          { value: 'enteral', label: { fr: 'Nutrition enterale', en: 'Enteral nutrition', ar: 'تغذية معوية' } },
          { value: 'parenteral', label: { fr: 'Nutrition parenterale', en: 'Parenteral nutrition', ar: 'تغذية وريدية' } },
          { value: 'refusal', label: { fr: "Refus de s'alimenter", en: 'Refusal to eat', ar: 'رفض الاكل' } },
        ],
      },
      { key: 'glycemia', type: 'number', label: { fr: 'Glycemie', en: 'Blood glucose', ar: 'سكر الدم' }, unit: 'g/L' },
      yesNoField('weightLoss', { fr: 'Perte de poids / denutrition', en: 'Weight loss / malnutrition', ar: 'نقص الوزن او سوء التغذية' }),
      yesNoField('dryMucosa', { fr: 'Secheresse des muqueuses', en: 'Dry mucous membranes', ar: 'جفاف الاغشية المخاطية' }),
      yesNoField('thirst', { fr: 'Soif ou incapacite a exprimer la soif', en: 'Thirst or inability to express it', ar: 'عطش او عدم القدرة على التعبير عنه' }),
      yesNoField('edema', { fr: 'Oedemes', en: 'Edema', ar: 'وذمات' }),
      yesNoField('skinFold', { fr: 'Pli cutane (deshydratation)', en: 'Skin fold sign', ar: 'علامة الطية الجلدية' }),
      {
        key: 'digestiveSymptoms',
        type: 'multi',
        label: { fr: 'Signes digestifs', en: 'Digestive symptoms', ar: 'الاعراض الهضمية' },
        options: [
          { value: 'nausea', label: { fr: 'Nausees', en: 'Nausea', ar: 'غثيان' } },
          { value: 'vomiting', label: { fr: 'Vomissements', en: 'Vomiting', ar: 'قيء' } },
          { value: 'bloating', label: { fr: 'Ballonnements abdominaux', en: 'Abdominal bloating', ar: 'انتفاخ البطن' } },
          { value: 'abdominalPain', label: { fr: 'Douleurs abdominales', en: 'Abdominal pain', ar: 'الم بطني' } },
          { value: 'diarrhea', label: { fr: 'Diarrhee', en: 'Diarrhea', ar: 'اسهال' } },
          { value: 'constipation', label: { fr: 'Constipation', en: 'Constipation', ar: 'امساك' } },
        ],
      },
      { key: 'notes', type: 'textarea', label: { fr: 'Remarques', en: 'Notes', ar: 'ملاحظات' } },
    ],
  },
  {
    key: 'elimination',
    title: { fr: "Besoin d'eliminer", en: 'Need to eliminate', ar: 'الحاجة الى الاخراج' },
    description: { fr: 'Elimination urinaire et intestinale.', en: 'Urinary and bowel elimination.', ar: 'الاخراج البولي والمعوي.' },
    fields: [
      yesNoField('urinaryCatheter', { fr: 'Presence de sonde urinaire', en: 'Urinary catheter present', ar: 'وجود قسطرة بولية' }),
      { key: 'diuresis', type: 'text', label: { fr: 'Diurese', en: 'Urine output', ar: 'ادرار البول' } },
      { key: 'urineColor', type: 'text', label: { fr: 'Couleur des urines', en: 'Urine color', ar: 'لون البول' } },
      { key: 'urineOdor', type: 'text', label: { fr: 'Odeur des urines', en: 'Urine odor', ar: 'رائحة البول' } },
      {
        key: 'urineFlowState',
        type: 'single',
        label: { fr: 'Anurie / Oligurie / Polyurie', en: 'Anuria / Oliguria / Polyuria', ar: 'انعدام او قلة او كثرة البول' },
        options: [
          { value: 'anuria', label: { fr: 'Anurie', en: 'Anuria', ar: 'انعدام البول' } },
          { value: 'oliguria', label: { fr: 'Oligurie', en: 'Oliguria', ar: 'قلة البول' } },
          { value: 'polyuria', label: { fr: 'Polyurie', en: 'Polyuria', ar: 'كثرة البول' } },
        ],
      },
      yesNoField('painOrDiscomfort', { fr: 'Douleur ou inconfort', en: 'Pain or discomfort', ar: 'الم او انزعاج' }),
      yesNoField('urinaryIncontinence', { fr: 'Incontinence urinaire', en: 'Urinary incontinence', ar: 'سلس بولي' }),
      yesNoField('urinaryRetention', { fr: 'Retention urinaire', en: 'Urinary retention', ar: 'احتباس بولي' }),
      {
        key: 'bowelSigns',
        type: 'multi',
        label: { fr: 'Elimination intestinale', en: 'Bowel elimination', ar: 'الاخراج المعوي' },
        options: [
          { value: 'constipation', label: { fr: 'Constipation', en: 'Constipation', ar: 'امساك' } },
          { value: 'diarrhea', label: { fr: 'Diarrhee', en: 'Diarrhea', ar: 'اسهال' } },
          { value: 'noStool', label: { fr: 'Absence de selles', en: 'No stool', ar: 'غياب البراز' } },
          { value: 'bloating', label: { fr: 'Ballonnements abdominaux', en: 'Abdominal bloating', ar: 'انتفاخ البطن' } },
          { value: 'blackStools', label: { fr: 'Presence de selles noires', en: 'Black stools', ar: 'براز اسود' } },
          { value: 'bloodyStools', label: { fr: 'Presence de selles sanglantes', en: 'Bloody stools', ar: 'براز دموي' } },
        ],
      },
      { key: 'notes', type: 'textarea', label: { fr: 'Remarques', en: 'Notes', ar: 'ملاحظات' } },
    ],
  },
  {
    key: 'mobility',
    title: { fr: 'Besoin de mouvoir et maintenir une bonne posture', en: 'Need to move and maintain good posture', ar: 'الحاجة الى الحركة والحفاظ على وضعية جيدة' },
    description: { fr: 'Autonomie, posture et risque d escarres.', en: 'Mobility, posture and pressure sore risk.', ar: 'الاستقلالية والوضعية وخطر قرحات الفراش.' },
    fields: [
      {
        key: 'mobilityLevel',
        type: 'single',
        label: { fr: 'Etat de mobilite', en: 'Mobility level', ar: 'مستوى الحركة' },
        options: [
          { value: 'independent', label: { fr: 'Patient autonome', en: 'Independent', ar: 'مريض مستقل' } },
          { value: 'dependent', label: { fr: 'Patient dependant', en: 'Dependent', ar: 'مريض معتمد' } },
          { value: 'immobilized', label: { fr: 'Totalement immobilise', en: 'Totally immobilized', ar: 'غير متحرك تماما' } },
        ],
      },
      yesNoField('moveLimbs', { fr: 'Capacite a bouger les membres', en: 'Ability to move limbs', ar: 'القدرة على تحريك الاطراف' }),
      yesNoField('bedridden', { fr: 'Patient cloue au lit', en: 'Bedridden', ar: 'ملازم للفراش' }),
      yesNoField('jointStiffness', { fr: 'Raideur articulaire', en: 'Joint stiffness', ar: 'تيبس مفصلي' }),
      yesNoField('muscleWeakness', { fr: 'Faiblesse musculaire', en: 'Muscle weakness', ar: 'ضعف عضلي' }),
      yesNoField('pain', { fr: 'Douleur', en: 'Pain', ar: 'الم' }),
      yesNoField('paralysis', { fr: 'Paralysie', en: 'Paralysis', ar: 'شلل' }),
      yesNoField('stroke', { fr: 'AVC', en: 'Stroke', ar: 'سكتة دماغية' }),
      { key: 'bedPosition', type: 'text', label: { fr: 'Position au lit', en: 'Position in bed', ar: 'وضعية المريض في السرير' } },
      yesNoField('pressureSores', { fr: 'Escarres', en: 'Pressure sores', ar: 'قرحات الفراش' }),
      {
        key: 'pressureSoreStage',
        type: 'single',
        label: { fr: "Stade d'escarre", en: 'Pressure sore stage', ar: 'مرحلة قرحة الفراش' },
        dependsOn: 'pressureSores',
        dependsValue: 'yes',
        options: [
          { value: 'stage1', label: { fr: 'Stade 1', en: 'Stage 1', ar: 'المرحلة 1' } },
          { value: 'stage2', label: { fr: 'Stade 2', en: 'Stage 2', ar: 'المرحلة 2' } },
          { value: 'stage3', label: { fr: 'Stade 3', en: 'Stage 3', ar: 'المرحلة 3' } },
          { value: 'stage4', label: { fr: 'Stade 4', en: 'Stage 4', ar: 'المرحلة 4' } },
        ],
      },
      { key: 'notes', type: 'textarea', label: { fr: 'Remarques', en: 'Notes', ar: 'ملاحظات' } },
    ],
  },
  {
    key: 'temperature',
    title: { fr: 'Maintenir la temperature corporelle', en: 'Maintain body temperature', ar: 'الحفاظ على درجة حرارة الجسم' },
    description: { fr: 'Temperature et signes associes.', en: 'Temperature and associated signs.', ar: 'درجة الحرارة والعلامات المرتبطة بها.' },
    fields: [
      { key: 'temperature', type: 'number', label: { fr: 'Temperature', en: 'Temperature', ar: 'درجة الحرارة' }, unit: 'deg C' },
      {
        key: 'temperatureSigns',
        type: 'multi',
        label: { fr: 'Signes observes', en: 'Observed signs', ar: 'العلامات الملاحظة' },
        options: [
          { value: 'hypothermia', label: { fr: 'Hypothermie', en: 'Hypothermia', ar: 'انخفاض الحرارة' } },
          { value: 'hyperthermia', label: { fr: 'Hyperthermie', en: 'Hyperthermia', ar: 'ارتفاع الحرارة' } },
          { value: 'stable', label: { fr: 'Temperature stable', en: 'Stable temperature', ar: 'حرارة مستقرة' } },
          { value: 'unstable', label: { fr: 'Temperature instable', en: 'Unstable temperature', ar: 'حرارة غير مستقرة' } },
          { value: 'chills', label: { fr: 'Frissons', en: 'Chills', ar: 'قشعريرة' } },
          { value: 'heavySweating', label: { fr: 'Sueurs abondantes', en: 'Excessive sweating', ar: 'تعرق غزير' } },
          { value: 'warmSkin', label: { fr: 'Peau chaude', en: 'Warm skin', ar: 'جلد دافئ' } },
          { value: 'coldSkin', label: { fr: 'Peau froide', en: 'Cold skin', ar: 'جلد بارد' } },
          { value: 'tremors', label: { fr: 'Tremblements', en: 'Tremors', ar: 'رجفان' } },
          { value: 'asthenia', label: { fr: 'Asthenie', en: 'Weakness', ar: 'وهن' } },
        ],
      },
      { key: 'notes', type: 'textarea', label: { fr: 'Remarques', en: 'Notes', ar: 'ملاحظات' } },
    ],
  },
];

export function buildInitialAssessment() {
  return assessmentSchema.reduce<Record<string, Record<string, AssessmentValue>>>((sectionAcc, section) => {
    sectionAcc[section.key] = section.fields.reduce<Record<string, AssessmentValue>>((fieldAcc, field) => {
      fieldAcc[field.key] = field.type === 'multi' ? [] : '';
      return fieldAcc;
    }, {});
    return sectionAcc;
  }, {});
}

export function localizeText(text: LocalizedText, language: Language) {
  return text[language];
}
