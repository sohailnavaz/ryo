import type { Messages } from './en';

// 日本語 — typed against en.ts. Keep keys in the same order as the source.
export const ja: Messages = {
  // Brand
  'brand.tagline': 'Just Ryo it.',

  // Primary navigation / tabs
  'nav.explore': '探す',
  'nav.stays': '宿泊先',
  'nav.discover': '見つける',
  'nav.stories': 'ストーリー',
  'nav.trips': '旅程',
  'nav.wishlists': 'お気に入り',
  'nav.profile': 'プロフィール',
  'nav.concierge': 'コンシェルジュ',
  'nav.account': 'アカウント',
  'nav.notifications': 'お知らせ',
  'nav.help': 'ヘルプを見る',
  'nav.signIn': 'ログイン',
  'nav.signOut': 'ログアウト',
  'nav.helpCenter': 'ヘルプセンターとFAQ',
  'nav.offlinePack': 'オフラインパック',
  'nav.phrasebook': 'フレーズ集',
  'nav.hostDashboard': 'ホストダッシュボード',
  'nav.adminConsole': '管理コンソール',

  // Home / explore
  'home.heroTitle': 'どこに泊まっても、おもてなしを感じて。',
  'home.heroSubtitle': '審査を通過した宿泊先、24時間365日のコンシェルジュ、そして正直な総額表示の料金。',
  'home.anyWeek': 'いつでも · ゲストを追加',
  'home.guestsCount': 'ゲスト{count}名',
  'home.loading': '読み込み中…',
  'home.homeCount': '{count}件の宿泊先',
  'home.homesCount': '{count}件の宿泊先',
  'home.emptyTitle': '今のところ条件に合う宿泊先はありません',
  'home.emptyBody':
    '日程を広げるか、絞り込み条件を解除してみてください。きっとあなたのために用意された宿が見つかります。',

  // Sort options
  'sort.recommended': 'おすすめ',
  'sort.priceAsc': '料金 ↑',
  'sort.priceDesc': '料金 ↓',
  'sort.topRated': '高評価順',
  'sort.newest': '新着順',

  // Search / filters
  'search.where': 'どこへ',
  'search.placeholder': '国や都市を検索',
  'search.anywhere': 'どこでも',
  'search.popular': '人気の旅先',
  'search.guests': 'ゲスト',
  'search.guestsPlaceholder': 'ゲストの人数',
  'search.pricePerNight': '1泊あたりの料金',
  'search.min': '最低',
  'search.max': '最高',
  'search.propertyType': '宿泊施設のタイプ',
  'search.amenities': '設備・アメニティ',
  'search.filters': '絞り込み',
  'search.clearAll': 'すべてクリア',
  'search.showStays': '宿泊先を表示',

  // Common actions
  'common.search': '検索',
  'common.apply': '適用',
  'common.cancel': 'キャンセル',
  'common.save': '保存',
  'common.close': '閉じる',
  'common.next': '次へ',
  'common.back': '戻る',
  'common.done': '完了',
  'common.learnMore': '詳しく見る',
  'common.getStarted': 'はじめる',
  'common.skip': 'スキップ',

  // Language switcher
  'language.title': '言語',
  'language.choose': '言語を選択',
  'language.subtitle': 'アプリのインターフェースの表示言語が変わります。',

  // Footer
  'footer.company': 'Ryo',
  'footer.tagline': 'どこに泊まっても、おもてなしを感じて。',
  'footer.explore': '探す',
  'footer.support': 'サポート',
  'footer.legal': '法的事項',
  'footer.help': 'ヘルプセンター',
  'footer.faq': 'よくある質問',
  'footer.concierge': 'コンシェルジュ',
  'footer.privacy': 'プライバシーポリシー',
  'footer.terms': '利用規約',
  'footer.cookies': 'Cookieポリシー',
  'footer.security': '安全と信頼',
  'footer.rights': 'All rights reserved.',
  'footer.madeWith': 'おもてなしの心を込めて。',

  // Cookie consent
  'cookies.title': 'あなたのプライバシーを大切にします',
  'cookies.body':
    'ログイン状態の維持、設定の記憶、Ryoの利用状況の把握のためにCookieを使用しています。何を使用してよいかは、あなたが選べます。',
  'cookies.acceptAll': 'すべて許可',
  'cookies.rejectAll': '必須以外を拒否',
  'cookies.customize': 'カスタマイズ',
  'cookies.savePrefs': '設定を保存',
  'cookies.necessary': '必須',
  'cookies.necessaryDesc': 'ログイン、セキュリティ、主要な機能に必要です。常に有効です。',
  'cookies.functional': '機能性',
  'cookies.functionalDesc': '言語や各種設定を記憶します。',
  'cookies.analytics': '分析',
  'cookies.analyticsDesc': '利用状況を把握し、Ryoの改善に役立てます。',
  'cookies.learnMore': 'Cookieポリシーを読む',
  'cookies.preferences': 'Cookieの設定',

  // Onboarding (first-run guidance)
  'onboarding.welcomeTitle': 'Ryoへようこそ',
  'onboarding.welcomeBody':
    '審査を通過したホスト、24時間365日のコンシェルジュ、そして正直な料金。あなたのために用意されたような宿泊先を。',
  'onboarding.searchTitle': '世界中から探す',
  'onboarding.searchBody':
    'あらゆる国、数千もの都市で宿泊先を見つけましょう。料金、ゲストの人数、あなたが重視する設備で絞り込めます。',
  'onboarding.conciergeTitle': '昼も夜も、コンシェルジュがそばに',
  'onboarding.conciergeBody':
    '滞在の前も、滞在中も、滞在後も、あなたの言語で何でもお尋ねください。24時間365日対応します。',
  'onboarding.trustTitle': '安心して滞在',
  'onboarding.trustBody':
    '本人確認済みのホスト、安全なメッセージと決済、そしてすべての予約を支える確かな保証。',
};
