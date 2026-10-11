import {tr} from './i18n.js';
const ENTRY={
 "travel": {
  "en": "Beyond the village",
  "fa": "آن‌سوی روستا",
  "zh": "驶出村庄",
  "ar": "ما وراء القرية",
  "es": "Más allá del pueblo",
  "hi": "गाँव के पार",
  "fr": "Au-delà du village",
  "pt": "Além da vila"
 },
 "mount": {
  "en": "Mount / dismount",
  "fa": "سوار / پیاده",
  "zh": "上车／下车",
  "ar": "اركب / انزل",
  "es": "Subir / bajar",
  "hi": "चढ़ें / उतरें",
  "fr": "Monter / descendre",
  "pt": "Entrar / sair"
 },
 "mountBlocked": {
  "en": "Rest until sober, refuel, or select an owned vehicle. You can always walk.",
  "fa": "استراحت کن، سوخت بزن یا وسیلهٔ خودت را انتخاب کن. همیشه می‌توانی پیاده بروی.",
  "zh": "请先休息醒酒、加油或选择已购车辆。随时可步行。",
  "ar": "استرح أو تزود بالوقود أو اختر مركبة تملكها. يمكنك المشي دائماً.",
  "es": "Descansa, reposta o elige tu vehículo. Siempre puedes caminar.",
  "hi": "आराम करें, ईंधन लें या अपना वाहन चुनें। पैदल चल सकते हैं।",
  "fr": "Reposez-vous, faites le plein ou choisissez un véhicule. La marche reste possible.",
  "pt": "Descanse, abasteça ou escolha seu veículo. Sempre pode caminhar."
 },
 "repairHelp": {
  "en": "Connect left to right. No timer.",
  "fa": "از چپ به راست وصل کن؛ بدون زمان‌سنج.",
  "zh": "从左到右连接，无时间限制。",
  "ar": "صل من اليسار لليمين؛ بلا مؤقت.",
  "es": "Conecta de izquierda a derecha, sin reloj.",
  "hi": "बाएँ से दाएँ जोड़ें। समय सीमा नहीं।",
  "fr": "Reliez de gauche à droite, sans chrono.",
  "pt": "Ligue da esquerda à direita, sem cronômetro."
 },
 "retry": {
  "en": "Try again",
  "fa": "دوباره امتحان کن",
  "zh": "重试",
  "ar": "حاول مجدداً",
  "es": "Intentar otra vez",
  "hi": "फिर प्रयास करें",
  "fr": "Réessayer",
  "pt": "Tentar novamente"
 },
 "complete": {
  "en": "Complete",
  "fa": "انجام شد",
  "zh": "完成",
  "ar": "تم",
  "es": "Completado",
  "hi": "पूरा हुआ",
  "fr": "Terminé",
  "pt": "Concluído"
 },
 "title": {
  "en": "Afterlight County",
  "fa": "شهرستان پس‌تاب",
  "zh": "余晖郡",
  "ar": "مقاطعة الشفق",
  "es": "Condado del Ocaso",
  "hi": "साँझ का इलाका",
  "fr": "Comté du Crépuscule",
  "pt": "Condado do Poente"
 },
 "travelHelp": {
  "en": "Own a bicycle, motorcycle or car. Follow the village gate; your belongings travel with you.",
  "fa": "دوچرخه، موتور یا ماشین بخر و به دروازه برو؛ دارایی‌هایت همراهت می‌آیند.",
  "zh": "购买自行车、摩托或汽车，前往村口。物品随身携带。",
  "ar": "اشتر مركبة واتبع بوابة القرية؛ أغراضك ترافقك.",
  "es": "Compra un vehículo y ve a la puerta; llevas tus pertenencias.",
  "hi": "वाहन खरीदें और गाँव के द्वार तक जाएँ; सामान साथ रहेगा।",
  "fr": "Achetez un véhicule et rejoignez la porte ; vos objets suivent.",
  "pt": "Compre um veículo e siga ao portão; seus itens vão junto."
 },
 "needVehicle": {
  "en": "Visit the vehicle yard first",
  "fa": "اول به حیاط وسایل نقلیه برو",
  "zh": "先到车辆场",
  "ar": "زر ساحة المركبات أولاً",
  "es": "Ve al patio de vehículos",
  "hi": "पहले वाहन आँगन जाएँ",
  "fr": "Passez au garage",
  "pt": "Visite o pátio de veículos"
 },
 "enter": {
  "en": "Take the road",
  "fa": "بزن به جاده",
  "zh": "上路",
  "ar": "انطلق",
  "es": "Salir a la carretera",
  "hi": "सफ़र शुरू करें",
  "fr": "Prendre la route",
  "pt": "Pegar a estrada"
 },
 "loading": {
  "en": "Opening the road…",
  "fa": "جاده باز می‌شود…",
  "zh": "正在开辟道路…",
  "ar": "يفتح الطريق…",
  "es": "Abriendo el camino…",
  "hi": "रास्ता खुल रहा है…",
  "fr": "La route s’ouvre…",
  "pt": "Abrindo a estrada…"
 },
 "failed": {
  "en": "The road could not load. Your save is safe; try again.",
  "fa": "جاده بارگیری نشد؛ ذخیره‌ات محفوظ است. دوباره تلاش کن.",
  "zh": "道路加载失败，存档安全，请重试。",
  "ar": "تعذر تحميل الطريق؛ حفظك آمن. حاول مجدداً.",
  "es": "No cargó el camino; partida a salvo. Reintenta.",
  "hi": "रास्ता लोड नहीं हुआ; सेव सुरक्षित है। फिर कोशिश करें।",
  "fr": "Chargement impossible ; sauvegarde intacte. Réessayez.",
  "pt": "Falha ao carregar; jogo salvo. Tente de novo."
 }
};
export const ft=key=>tr(ENTRY[key]||key);
