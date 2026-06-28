import type { Messages } from './en';

// العربية (الفصحى) — typed against en.ts. Keep keys in the same order as the source.
// RTL layout is handled separately; only the text is provided here.
export const ar: Messages = {
  // Brand
  'brand.tagline': 'Just Ryo it.',

  // Primary navigation / tabs
  'nav.explore': 'استكشاف',
  'nav.stays': 'أماكن الإقامة',
  'nav.discover': 'اكتشاف',
  'nav.stories': 'قصص',
  'nav.trips': 'الرحلات',
  'nav.wishlists': 'المفضّلة',
  'nav.profile': 'الملف الشخصي',
  'nav.concierge': 'الكونسيرج',
  'nav.account': 'الحساب',
  'nav.notifications': 'الإشعارات',
  'nav.help': 'الحصول على مساعدة',
  'nav.signIn': 'تسجيل الدخول',
  'nav.signOut': 'تسجيل الخروج',

  // Search / filters
  'search.where': 'إلى أين',
  'search.placeholder': 'ابحث عن الدول والمدن',
  'search.anywhere': 'أي مكان',
  'search.popular': 'الوجهات الشائعة',
  'search.guests': 'الضيوف',
  'search.guestsPlaceholder': 'عدد الضيوف',
  'search.pricePerNight': 'السعر لكل ليلة',
  'search.min': 'الأدنى',
  'search.max': 'الأعلى',
  'search.propertyType': 'نوع العقار',
  'search.amenities': 'وسائل الراحة',
  'search.filters': 'عوامل التصفية',
  'search.clearAll': 'مسح الكل',
  'search.showStays': 'عرض أماكن الإقامة',

  // Common actions
  'common.search': 'بحث',
  'common.apply': 'تطبيق',
  'common.cancel': 'إلغاء',
  'common.save': 'حفظ',
  'common.close': 'إغلاق',
  'common.next': 'التالي',
  'common.back': 'رجوع',
  'common.done': 'تم',
  'common.learnMore': 'معرفة المزيد',
  'common.getStarted': 'ابدأ الآن',
  'common.skip': 'تخطٍّ',

  // Language switcher
  'language.title': 'اللغة',
  'language.choose': 'اختر لغتك',
  'language.subtitle': 'يؤدي هذا إلى تغيير لغة واجهة التطبيق.',

  // Footer
  'footer.company': 'Ryo',
  'footer.tagline': 'أقِم في أي مكان واشعر بحفاوة الاستقبال.',
  'footer.explore': 'استكشاف',
  'footer.support': 'الدعم',
  'footer.legal': 'الشؤون القانونية',
  'footer.help': 'مركز المساعدة',
  'footer.faq': 'الأسئلة الشائعة',
  'footer.concierge': 'الكونسيرج',
  'footer.privacy': 'سياسة الخصوصية',
  'footer.terms': 'شروط الخدمة',
  'footer.cookies': 'سياسة ملفات تعريف الارتباط',
  'footer.security': 'الأمان والثقة',
  'footer.rights': 'جميع الحقوق محفوظة.',
  'footer.madeWith': 'استقبالٌ بروح أوموتيناشي.',

  // Cookie consent
  'cookies.title': 'نحن نقدّر خصوصيتك',
  'cookies.body':
    'نستخدم ملفات تعريف الارتباط لإبقائك مسجّل الدخول، وتذكّر تفضيلاتك، وفهم كيفية استخدام Ryo. أنت من يقرّر ما يمكننا استخدامه.',
  'cookies.acceptAll': 'قبول الكل',
  'cookies.rejectAll': 'رفض غير الأساسية',
  'cookies.customize': 'تخصيص',
  'cookies.savePrefs': 'حفظ التفضيلات',
  'cookies.necessary': 'ضرورية تمامًا',
  'cookies.necessaryDesc': 'لازمة لتسجيل الدخول والأمان والوظائف الأساسية. مُفعّلة دائمًا.',
  'cookies.functional': 'وظيفية',
  'cookies.functionalDesc': 'تتذكّر لغتك وتفضيلاتك.',
  'cookies.analytics': 'التحليلات',
  'cookies.analyticsDesc': 'تساعدنا على فهم الاستخدام لتحسين Ryo.',
  'cookies.learnMore': 'اقرأ سياسة ملفات تعريف الارتباط',
  'cookies.preferences': 'تفضيلات ملفات تعريف الارتباط',

  // Onboarding (first-run guidance)
  'onboarding.welcomeTitle': 'مرحبًا بك في Ryo',
  'onboarding.welcomeBody':
    'مضيفون موثوقون، وكونسيرج على مدار الساعة طوال أيام الأسبوع، وأسعار صادقة — أماكن إقامة تبدو وكأنها أُعِدّت من أجلك وحدك.',
  'onboarding.searchTitle': 'ابحث في العالم كله',
  'onboarding.searchBody':
    'اعثر على أماكن إقامة في كل دولة وفي آلاف المدن. صفِّ النتائج حسب السعر وعدد الضيوف ووسائل الراحة التي تهمّك.',
  'onboarding.conciergeTitle': 'كونسيرج في أي وقت، ليلًا أو نهارًا',
  'onboarding.conciergeBody':
    'اسأل عمّا تشاء قبل إقامتك أو خلالها أو بعدها — بلغتك، على مدار الساعة طوال أيام الأسبوع.',
  'onboarding.trustTitle': 'أقِم بكل ثقة',
  'onboarding.trustBody':
    'مضيفون موثوقون، ومراسلات ومدفوعات آمنة، وضمانات حقيقية خلف كل حجز.',
};
