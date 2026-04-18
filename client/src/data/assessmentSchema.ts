export type Language = 'fr' | 'en' | 'ar';

export type LocalizedText = Record<Language, string>;
export type AssessmentValue = string | string[];
export type FieldType = 'heading' | 'number' | 'text' | 'textarea' | 'yesno' | 'single' | 'multi';

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

const headingField = (key: string, label: LocalizedText): FieldSchema => ({
  key,
  type: 'heading',
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
      { key: 'spo2', type: 'number', label: { fr: 'SpO2', en: 'SpO2', ar: 'تشبع الأكسجين' }, unit: '%' },
      { key: 'respiratoryRate', type: 'number', label: { fr: 'Frequence respiratoire', en: 'Respiratory rate', ar: 'معدل التنفس' } },
      {
        key: 'ventilationType',
        type: 'single',
        label: { fr: 'Type de ventilation', en: 'Ventilation type', ar: 'نوع التهوية' },
        options: [
          { value: 'spontaneous', label: { fr: 'Ventilation spontanee', en: 'Spontaneous breathing', ar: 'تنفس تلقائي' } },
          { value: 'oxygenTherapy', label: { fr: 'Oxygenotherapie', en: 'Oxygen therapy', ar: 'علاج بالأكسجين' } },
          { value: 'nonInvasive', label: { fr: 'Ventilation non invasive (VNI)', en: 'Non-invasive ventilation', ar: 'تهوية غير غازية' } },
          { value: 'invasive', label: { fr: 'Ventilation invasive', en: 'Invasive ventilation', ar: 'تهوية غازية' } },
          { value: 'assistedSpontaneous', label: { fr: 'Ventilation spontanee assistee (VS / PSV)', en: 'Assisted spontaneous ventilation', ar: 'تهوية تلقائية مساعدة' } },
        ],
      },
      {
        key: 'oxygenTherapyType',
        type: 'single',
        label: { fr: "Type d'oxygenotherapie", en: 'Oxygen therapy subtype', ar: 'نوع العلاج بالأكسجين' },
        dependsOn: 'ventilationType',
        dependsValue: 'oxygenTherapy',
        options: [
          { value: 'nasalCannula', label: { fr: 'Lunette', en: 'Nasal cannula', ar: 'قنية أنفية' } },
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
        label: { fr: 'Tachypnee / Bradypnee', en: 'Tachypnea / Bradypnea', ar: 'تسرع أو بطء التنفس' },
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
          { value: 'extremities', label: { fr: 'Extremites', en: 'Extremities', ar: 'الأطراف' } },
        ],
      },
      yesNoField('apnea', { fr: 'Apnee', en: 'Apnea', ar: 'انقطاع النفس' }),
      yesNoField('polypnea', { fr: 'Polypnee', en: 'Polypnea', ar: 'تعدد التنفس' }),
      yesNoField('orthopnea', { fr: 'Orthopnee', en: 'Orthopnea', ar: 'ضيق النفس الاضطجاعي' }),
      yesNoField('dyspneaAgitation', { fr: 'Agitation liee a la dyspnee', en: 'Dyspnea-related agitation', ar: 'هيجان مرتبط بضيق التنفس' }),
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
          { value: 'paroxysmal', label: { fr: 'Toux quinteuse', en: 'Paroxysmal cough', ar: 'سعال نوباتي' } },
          { value: 'barking', label: { fr: 'Toux aboyante', en: 'Barking cough', ar: 'سعال نباحي' } },
          { value: 'wheezing', label: { fr: 'Toux sifflante', en: 'Wheezing cough', ar: 'سعال صفيري' } },
          { value: 'night', label: { fr: 'Toux nocturne', en: 'Night cough', ar: 'سعال ليلي' } },
          { value: 'hemoptysis', label: { fr: 'Toux hemoptoique', en: 'Hemoptysis-related cough', ar: 'سعال دموي' } },
        ],
      },
      yesNoField('expectoration', { fr: 'Expectoration', en: 'Expectoration', ar: 'البلغم' }),
      {
        key: 'expectorationQuantity',
        type: 'text',
        label: { fr: 'Expectoration - quantite', en: 'Sputum quantity', ar: 'كمية البلغم' },
        dependsOn: 'expectoration',
        dependsValue: 'yes',
      },
      {
        key: 'expectorationAspect',
        type: 'text',
        label: { fr: 'Expectoration - aspect', en: 'Sputum appearance', ar: 'مظهر البلغم' },
        dependsOn: 'expectoration',
        dependsValue: 'yes',
      },
      {
        key: 'expectorationOdor',
        type: 'text',
        label: { fr: 'Expectoration - odeur', en: 'Sputum odor', ar: 'رائحة البلغم' },
        dependsOn: 'expectoration',
        dependsValue: 'yes',
      },
      yesNoField('bronchialCongestion', { fr: 'Encombrement bronchique', en: 'Bronchial congestion', ar: 'احتقان قصبي' }),
      headingField('hemodynamicHeading', {
        fr: 'Les signes clinique cardiaque / hemodynamique',
        en: 'Cardiac / hemodynamic clinical signs',
        ar: 'العلامات السريرية القلبية والديناميكية الدموية',
      }),
      { key: 'heartRate', type: 'number', label: { fr: 'FC', en: 'Heart rate', ar: 'النبض' }, unit: 'bpm' },
      { key: 'systolicBloodPressure', type: 'number', label: { fr: 'TA systolique', en: 'Systolic BP', ar: 'الضغط الانقباضي' }, unit: 'mmHg' },
      { key: 'diastolicBloodPressure', type: 'number', label: { fr: 'TA diastolique', en: 'Diastolic BP', ar: 'الضغط الانبساطي' }, unit: 'mmHg' },
      {
        key: 'pulsePressureState',
        type: 'single',
        label: { fr: 'Differentielle tensionnelle', en: 'Pulse pressure change', ar: 'الفرق الضغطي' },
        options: [
          { value: 'widened', label: { fr: 'Elargissement de la differentielle', en: 'Widened differential', ar: 'اتساع الفرق الضغطي' } },
          { value: 'narrowed', label: { fr: 'Pincement de la differentielle', en: 'Narrowed differential', ar: 'تضيق الفرق الضغطي' } },
        ],
      },
      {
        key: 'rhythmState',
        type: 'multi',
        label: { fr: 'Rythme cardiaque', en: 'Cardiac rhythm', ar: 'نظم القلب' },
        options: [
          { value: 'tachycardia', label: { fr: 'Tachycardie', en: 'Tachycardia', ar: 'تسرع القلب' } },
          { value: 'bradycardia', label: { fr: 'Bradycardie', en: 'Bradycardia', ar: 'بطء القلب' } },
          { value: 'arrhythmia', label: { fr: 'Arythmie', en: 'Arrhythmia', ar: 'اضطراب النظم' } },
        ],
      },
      yesNoField('palpitation', { fr: 'Palpitation', en: 'Palpitations', ar: 'خفقان' }),
      yesNoField('mottling', { fr: 'Marbrure', en: 'Mottling', ar: 'تبقع جلدي' }),
      yesNoField('pallor', { fr: 'Paleur', en: 'Pallor', ar: 'شحوب' }),
      {
        key: 'syncopeLipothymia',
        type: 'single',
        label: { fr: 'Syncope / lipothymie', en: 'Syncope / lipothymia', ar: 'إغماء / ما قبل الإغماء' },
        options: [
          { value: 'syncope', label: { fr: 'Syncope', en: 'Syncope', ar: 'إغماء' } },
          { value: 'lipothymia', label: { fr: 'Lipothymie', en: 'Lipothymia', ar: 'ما قبل الإغماء' } },
        ],
      },
      yesNoField('jugularVeinDistension', { fr: 'Turgescence des veines jugulaire', en: 'Jugular vein distension', ar: 'احتقان أوردة الرقبة' }),
      yesNoField('lowerLimbEdemaCardiac', { fr: 'Oedeme des membres inferieur', en: 'Lower limb edema', ar: 'وذمة الأطراف السفلية' }),
      {
        key: 'consciousnessState',
        type: 'single',
        label: { fr: 'Etat de conscience', en: 'Consciousness state', ar: 'حالة الوعي' },
        options: [
          { value: 'conscious', label: { fr: 'Conscient', en: 'Conscious', ar: 'واع' } },
          { value: 'unconscious', label: { fr: 'Inconscient', en: 'Unconscious', ar: 'فاقد الوعي' } },
        ],
      },
      yesNoField('somnolence', { fr: 'Somnolence', en: 'Somnolence', ar: 'نعاس' }),
      yesNoField('anxiety', { fr: 'Anxiete', en: 'Anxiety', ar: 'قلق' }),
      {
        key: 'glasgowScore',
        type: 'text',
        label: { fr: 'Score de Glasgow', en: 'Glasgow score', ar: 'مقياس غلاسكو' },
        unit: '/15',
        dependsOn: 'consciousnessState',
        dependsValue: 'unconscious',
      },
      { key: 'actionsNotes', type: 'textarea', label: { fr: 'Actes faits / remarques', en: 'Actions performed / notes', ar: 'الاجراءات والملاحظات' } },
    ],
  },
  {
    key: 'nutrition',
    title: { fr: 'Besoin de boire et manger', en: 'Need to drink and eat', ar: 'الحاجة إلى الشرب والأكل' },
    description: { fr: "Type d'alimentation, glycemie et signes digestifs.", en: 'Feeding type, glycemia and digestive signs.', ar: 'نوع التغذية وسكر الدم والعلامات الهضمية.' },
    fields: [
      {
        key: 'feedingType',
        type: 'single',
        label: { fr: "Type d'alimentation", en: 'Feeding type', ar: 'نوع التغذية' },
        options: [
          { value: 'oral', label: { fr: 'Alimentation orale', en: 'Oral feeding', ar: 'تغذية فموية' } },
          { value: 'sng', label: { fr: 'Sonde nasogastrique (SNG)', en: 'Nasogastric tube', ar: 'أنبوب أنفي معدي' } },
          { value: 'enteral', label: { fr: 'Nutrition enterale', en: 'Enteral nutrition', ar: 'تغذية معوية' } },
          { value: 'parenteral', label: { fr: 'Nutrition parenterale', en: 'Parenteral nutrition', ar: 'تغذية وريدية' } },
          { value: 'refusal', label: { fr: "Refus de s'alimenter", en: 'Refusal to eat', ar: 'رفض الأكل' } },
        ],
      },
      { key: 'glycemia', type: 'number', label: { fr: 'Glycemie', en: 'Blood glucose', ar: 'سكر الدم' }, unit: 'g/L' },
      yesNoField('weightLoss', { fr: 'Perte de poids / denutrition', en: 'Weight loss / malnutrition', ar: 'نقص الوزن أو سوء التغذية' }),
      yesNoField('anorexia', { fr: "Perte d'appetit (anorexie)", en: 'Loss of appetite (anorexia)', ar: 'فقدان الشهية (أنوركسيا)' }),
      yesNoField('dryMucosa', { fr: 'Secheresse des muqueuses', en: 'Dry mucous membranes', ar: 'جفاف الأغشية المخاطية' }),
      yesNoField('thirst', { fr: 'Soif ou incapacite a exprimer la soif', en: 'Thirst or inability to express it', ar: 'عطش أو عدم القدرة على التعبير عنه' }),
      yesNoField('skinFold', { fr: 'Pli cutane (deshydratation)', en: 'Skin fold sign', ar: 'علامة الطية الجلدية' }),
      {
        key: 'digestiveSymptoms',
        type: 'multi',
        label: { fr: 'Signes digestifs', en: 'Digestive symptoms', ar: 'الأعراض الهضمية' },
        options: [
          { value: 'nausea', label: { fr: 'Nausees', en: 'Nausea', ar: 'غثيان' } },
          { value: 'vomiting', label: { fr: 'Vomissements', en: 'Vomiting', ar: 'قيء' } },
          { value: 'abdominalPain', label: { fr: 'Douleurs abdominales', en: 'Abdominal pain', ar: 'ألم بطني' } },
        ],
      },
      { key: 'notes', type: 'textarea', label: { fr: 'Remarques', en: 'Notes', ar: 'ملاحظات' } },
    ],
  },
  {
    key: 'elimination',
    title: { fr: "Besoin d'eliminer", en: 'Need to eliminate', ar: 'الحاجة إلى الإخراج' },
    description: { fr: 'Elimination urinaire et intestinale.', en: 'Urinary and bowel elimination.', ar: 'الإخراج البولي والمعوي.' },
    fields: [
      yesNoField('urinaryCatheter', { fr: 'Presence de sonde urinaire', en: 'Urinary catheter present', ar: 'وجود قسطرة بولية' }),
      { key: 'diuresis', type: 'text', label: { fr: 'Diurese', en: 'Urine output', ar: 'إدرار البول' } },
      { key: 'urineColor', type: 'text', label: { fr: 'Couleur des urines', en: 'Urine color', ar: 'لون البول' } },
      { key: 'urineOdor', type: 'text', label: { fr: 'Odeur des urines', en: 'Urine odor', ar: 'رائحة البول' } },
      {
        key: 'urineFlowState',
        type: 'multi',
        label: { fr: 'Troubles urinaires', en: 'Urinary disorders', ar: 'اضطرابات البول' },
        options: [
          { value: 'anuria', label: { fr: 'Anurie', en: 'Anuria', ar: 'انعدام البول' } },
          { value: 'oliguria', label: { fr: 'Oligurie', en: 'Oliguria', ar: 'قلة البول' } },
          { value: 'oligoanuria', label: { fr: 'Oligoanurie', en: 'Oligoanuria', ar: 'قلة شديدة في البول' } },
          { value: 'polyuria', label: { fr: 'Polyurie', en: 'Polyuria', ar: 'كثرة البول' } },
          { value: 'dysuria', label: { fr: 'Dysurie', en: 'Dysuria', ar: 'عسر البول' } },
          { value: 'pollakiuria', label: { fr: 'Pollakiurie', en: 'Pollakiuria', ar: 'تكرار البول' } },
          { value: 'nycturia', label: { fr: 'Nycturie', en: 'Nycturia', ar: 'تبول ليلي' } },
        ],
      },
      yesNoField('painOrDiscomfort', { fr: 'Douleur ou inconfort', en: 'Pain or discomfort', ar: 'ألم أو انزعاج' }),
      yesNoField('urinaryIncontinence', { fr: 'Incontinence urinaire', en: 'Urinary incontinence', ar: 'سلس بولي' }),
      yesNoField('urinaryRetention', { fr: 'Retention urinaire', en: 'Urinary retention', ar: 'احتباس بولي' }),
      yesNoField('labstix', { fr: 'Labstix', en: 'Labstix', ar: 'لابستيكس' }),
      {
        key: 'labstixResult',
        type: 'text',
        label: { fr: 'Resultat du Labstix', en: 'Labstix result', ar: 'نتيجة اللابستيكس' },
        dependsOn: 'labstix',
        dependsValue: 'yes',
      },
      yesNoField('lowerLimbEdemaUrinary', { fr: 'Oedeme des membres inferieurs', en: 'Lower limb edema', ar: 'وذمة الأطراف السفلية' }),
      yesNoField('upperLimbEdemaUrinary', { fr: 'Oedeme des membres superieurs', en: 'Upper limb edema', ar: 'وذمة الأطراف العلوية' }),
      headingField('bowelHeading', { fr: 'Elimination intestinale', en: 'Bowel elimination', ar: 'الإخراج المعوي' }),
      { key: 'stoolFrequency', type: 'text', label: { fr: 'Frequence des selles', en: 'Stool frequency', ar: 'تواتر البراز' } },
      { key: 'stoolAspect', type: 'text', label: { fr: 'Aspect des selles', en: 'Stool appearance', ar: 'مظهر البراز' } },
      {
        key: 'stoolConsistency',
        type: 'single',
        label: { fr: 'Consistence des selles (selon l echelle de Bristol)', en: 'Stool consistency (Bristol scale)', ar: 'قوام البراز (حسب مقياس بريستول)' },
        options: [
          { value: 'soft', label: { fr: 'Molles', en: 'Soft', ar: 'لينة' } },
          { value: 'hard', label: { fr: 'Dures', en: 'Hard', ar: 'صلبة' } },
          { value: 'pasty', label: { fr: 'Pateuses', en: 'Pasty', ar: 'عجينية' } },
        ],
      },
      {
        key: 'bowelTransit',
        type: 'single',
        label: { fr: 'Transit intestinale', en: 'Bowel transit', ar: 'العبور المعوي' },
        options: [
          { value: 'diarrhea', label: { fr: 'Diarrhee', en: 'Diarrhea', ar: 'إسهال' } },
          { value: 'constipation', label: { fr: 'Constipation', en: 'Constipation', ar: 'إمساك' } },
        ],
      },
      yesNoField('abdominalBloating', { fr: 'Ballonnement abdominale (les gazes)', en: 'Abdominal bloating (gas)', ar: 'انتفاخ البطن (الغازات)' }),
      yesNoField('abdominalPainElimination', { fr: 'Douleur abdominale', en: 'Abdominal pain', ar: 'ألم بطني' }),
      { key: 'notes', type: 'textarea', label: { fr: 'Remarques', en: 'Notes', ar: 'ملاحظات' } },
    ],
  },
  {
    key: 'mobility',
    title: { fr: 'Besoin de mouvoir et maintenir une bonne posture', en: 'Need to move and maintain good posture', ar: 'الحاجة إلى الحركة والحفاظ على وضعية جيدة' },
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
      yesNoField('moveUpperLimbs', { fr: 'Capacite a bouger les membres superieur', en: 'Ability to move upper limbs', ar: 'القدرة على تحريك الأطراف العلوية' }),
      yesNoField('moveLowerLimbs', { fr: 'Capacite a bouger les membres inferieur', en: 'Ability to move lower limbs', ar: 'القدرة على تحريك الأطراف السفلية' }),
      yesNoField('bedridden', { fr: 'Patient cloue au lit', en: 'Bedridden', ar: 'ملازم للفراش' }),
      yesNoField('jointStiffness', { fr: 'Raideur articulaire', en: 'Joint stiffness', ar: 'تيبس مفصلي' }),
      yesNoField('muscleWeakness', { fr: 'Faiblesse musculaire', en: 'Muscle weakness', ar: 'ضعف عضلي' }),
      yesNoField('musclePain', { fr: 'Douleur musculaire', en: 'Muscle pain', ar: 'ألم عضلي' }),
      yesNoField('jointPain', { fr: 'Douleur articulaire', en: 'Joint pain', ar: 'ألم مفصلي' }),
      yesNoField('fracture', { fr: 'Fracture', en: 'Fracture', ar: 'كسر' }),
      {
        key: 'fractureLocation',
        type: 'text',
        label: { fr: 'Fracture - au niveau de', en: 'Fracture location', ar: 'مكان الكسر' },
        dependsOn: 'fracture',
        dependsValue: 'yes',
      },
      yesNoField('sprain', { fr: 'Entorse', en: 'Sprain', ar: 'التواء' }),
      {
        key: 'sprainLocation',
        type: 'text',
        label: { fr: 'Entorse - au niveau de', en: 'Sprain location', ar: 'مكان الالتواء' },
        dependsOn: 'sprain',
        dependsValue: 'yes',
      },
      yesNoField('dislocation', { fr: 'Luxation', en: 'Dislocation', ar: 'خلع' }),
      {
        key: 'dislocationLocation',
        type: 'text',
        label: { fr: 'Luxation - au niveau de', en: 'Dislocation location', ar: 'مكان الخلع' },
        dependsOn: 'dislocation',
        dependsValue: 'yes',
      },
      yesNoField('paralysis', { fr: 'Paralysie', en: 'Paralysis', ar: 'شلل' }),
      {
        key: 'paralysisType',
        type: 'single',
        label: { fr: 'Type de paralysie', en: 'Type of paralysis', ar: 'نوع الشلل' },
        dependsOn: 'paralysis',
        dependsValue: 'yes',
        options: [
          { value: 'monoplegia', label: { fr: 'Monoplegie', en: 'Monoplegia', ar: 'شلل أحادي' } },
          { value: 'hemiplegia', label: { fr: 'Hemiplegie', en: 'Hemiplegia', ar: 'شلل نصفي' } },
          { value: 'paraplegia', label: { fr: 'Paraplegie', en: 'Paraplegia', ar: 'شلل سفلي' } },
          { value: 'tetraplegia', label: { fr: 'Tetraplegie', en: 'Tetraplegia', ar: 'شلل رباعي' } },
        ],
      },
      {
        key: 'paralysisCause',
        type: 'text',
        label: { fr: 'Due a', en: 'Due to', ar: 'بسبب' },
        dependsOn: 'paralysis',
        dependsValue: 'yes',
      },
      { key: 'bedPosition', type: 'text', label: { fr: 'Position au lit', en: 'Position in bed', ar: 'وضعية المريض في السرير' } },
      yesNoField('pressureSores', { fr: 'Escarres', en: 'Pressure sores', ar: 'قرحات الفراش' }),
      {
        key: 'pressureSoreLocation',
        type: 'text',
        label: { fr: 'Escarre - au niveau de', en: 'Pressure sore location', ar: 'مكان القرحة' },
        dependsOn: 'pressureSores',
        dependsValue: 'yes',
      },
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

const breathingSection = assessmentSchema.find((section) => section.key === 'breathing');
if (breathingSection) {
  const respiratoryRhythmField: FieldSchema = {
    key: 'respiratoryRhythm',
    type: 'multi',
    label: { fr: 'Rythme respiratoire', en: 'Respiratory rhythm', ar: 'النمط التنفسي' },
    options: [
      { value: 'dyspnea', label: { fr: 'Dyspnee', en: 'Dyspnea', ar: 'ضيق التنفس' } },
      { value: 'tachypnea', label: { fr: 'Tachypnee', en: 'Tachypnea', ar: 'تسرع التنفس' } },
      { value: 'bradypnea', label: { fr: 'Bradypnee', en: 'Bradypnea', ar: 'بطء التنفس' } },
      { value: 'apnea', label: { fr: 'Apnee', en: 'Apnea', ar: 'انقطاع النفس' } },
      { value: 'polypnea', label: { fr: 'Polypnee', en: 'Polypnea', ar: 'تعدد التنفس' } },
      { value: 'orthopnea', label: { fr: 'Orthopnee', en: 'Orthopnea', ar: 'ضيق النفس الاضطجاعي' } },
    ],
  };

  const dyspneaIndex = breathingSection.fields.findIndex((field) => field.key === 'dyspnea');
  if (dyspneaIndex >= 0) {
    breathingSection.fields.splice(dyspneaIndex, 0, respiratoryRhythmField);
  }

  breathingSection.fields = breathingSection.fields.filter((field) => ![
    'dyspnea',
    'breathingRateState',
    'apnea',
    'polypnea',
    'orthopnea',
  ].includes(field.key));
}

for (const section of assessmentSchema) {
  const edemaKeys = ['lowerLimbEdemaCardiac', 'lowerLimbEdemaUrinary', 'upperLimbEdemaUrinary'];

  for (const edemaKey of edemaKeys) {
    const edemaIndex = section.fields.findIndex((field) => field.key === edemaKey);
    if (edemaIndex < 0) {
      continue;
    }

    const godetKey = `${edemaKey}Godet`;
    if (section.fields.some((field) => field.key === godetKey)) {
      continue;
    }

    section.fields.splice(edemaIndex + 1, 0, {
      key: godetKey,
      type: 'yesno',
      label: { fr: 'Signe de godet', en: 'Pitting edema sign', ar: 'علامة الانطباع' },
      dependsOn: edemaKey,
      dependsValue: 'yes',
    });
  }
}

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
