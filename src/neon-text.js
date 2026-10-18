const langs=['en','fa','zh','ar','es','hi','fr','pt'];
export const neonRow=(en,fa,zh,ar,es,hi,fr,pt)=>Object.fromEntries(langs.map((l,i)=>[l,[en,fa,zh,ar,es,hi,fr,pt][i]||en]));
const row=neonRow;
export const NEON_TEXT={
 neonTitle:row('NEON / Living districts','نئون / محله‌های زنده','霓虹 / 活力街区','نيون / أحياء حية','NEÓN / Barrios vivos','निऑन / जीवंत इलाके','NÉON / Quartiers vivants','NÉON / Bairros vivos'),
 neonIntro:row('A city is a thousand unfinished stories. Meet its residents, follow a signal, and decide what deserves to survive.','یک شهر هزار داستان ناتمام است. با مردمش آشنا شو، رد یک نشانه را بگیر و تصمیم بگیر چه چیزی ارزش ماندن دارد.','城市有千个未完的故事。认识居民，追寻信号，决定值得保存的事物。'),
 auto:row('Living world','دنیای پویا','动态世界','عالم حي','Mundo vivo','जीवंत दुनिया','Monde vivant','Mundo vivo'),
 prosperity:row('Prosperity','رونق','繁荣','ازدهار','Prosperidad','समृद्धि','Prospérité','Prosperidade'),
 inflation:row('Inflation','تورم','通胀','تضخم','Inflación','महँगाई','Inflation','Inflação'),
 conflict:row('Network war','جنگ شبکه‌ها','网络战争','حرب الشبكات','Guerra de redes','नेटवर्क युद्ध','Guerre des réseaux','Guerra de redes'),
 neonEconomy:row('District conditions change supply prices, street crowds and patrols. These are fictional scenarios.','وضعیت محله قیمت تدارکات، جمعیت خیابان و گشت‌ها را تغییر می‌دهد. این سناریوها خیالی‌اند.','街区状况会改变补给价格、人流与巡逻。这些是虚构情景。'),
 neonMission:row('District stories','قصه‌های محله','街区故事','قصص الحي','Historias del barrio','इलाके की कहानियाँ','Histoires du quartier','Histórias do bairro'),
 neonAccept:row('Follow this story','دنبال‌کردن این قصه','追随故事','تتبع القصة','Seguir historia','कहानी का पीछा करें','Suivre cette histoire','Seguir história'),
 neonStage:row('Examine the signal','بررسی نشانه','检查信号','افحص الإشارة','Examinar la señal','संकेत जाँचें','Examiner le signal','Examinar o sinal'),
 neonDone:row('The city remembers','شهر یادش می‌ماند','城市会记住','المدينة تتذكر','La ciudad recuerda','शहर याद रखेगा','La ville se souvient','A cidade se lembra'),
 neonJournal:row('Story journal','دفتر قصه‌ها','故事日志','دفتر القصص','Diario de historias','कहानी डायरी','Journal des histoires','Diário de histórias'),
 neonTalk:row('Talk / historical echo','گفت‌وگو / پژواک تاریخ','交谈 / 历史回声','حديث / صدى التاريخ','Hablar / eco histórico','बात / इतिहास की गूँज','Parler / écho historique','Conversar / eco histórico'),
 neonFiction:row('Fictional dialogue. Historical echoes are interpretations, not real quotations or endorsements.','گفت‌وگوها داستانی‌اند؛ پژواک‌های تاریخی تفسیر هنری‌اند، نه نقل‌قول واقعی یا تأیید یک فرد.','对话为虚构。历史回声是艺术解读，并非真实引言或背书。'),
 neonDate:row('A quiet evening, together','یک عصر آرام، با هم','共度宁静夜晚','أمسية هادئة معاً','Una tarde juntos','साथ एक शांत शाम','Une soirée ensemble','Uma noite juntos'),
 neonConsent:row('Both companions are adults. An invitation can be declined. Intimacy is private and fades to black; meet sober and away from danger.','هر دو همراه بزرگسال‌اند. دعوت می‌تواند پذیرفته نشود. لحظهٔ خصوصی با محوشدن تصویر روایت می‌شود؛ هوشیار و دور از خطر ملاقات کنید.','两位同伴均为成年人。邀请可能被拒绝。私密时刻淡出画面；请保持清醒并远离危险。'),
 neonInvite:row('Invite for a walk','دعوت به قدم‌زدن','邀请散步','دعوة للمشي','Invitar a pasear','सैर का निमंत्रण','Inviter à marcher','Convidar para passear'),
 neonGoodnight:row('The city lights dim. You talk until the last train passes. Some memories need no audience.','چراغ‌های شهر کم‌نور می‌شوند. تا گذشتن آخرین قطار حرف می‌زنید. بعضی خاطره‌ها تماشاگر نمی‌خواهند.','城市灯光渐暗。你们聊到末班车驶过。有些回忆无需观众。'),
 neonUnavailable:row('Not now. Return sober, on foot, in daylight and without a pursuit.','الان نه. هوشیار، پیاده، روز و بدون تعقیب برگرد.','现在不行。白天清醒步行前来，先摆脱追捕。'),
 neonCars:row('Specialist garage','گاراژ تخصصی','专用车库','مرآب متخصص','Garaje especial','विशेष गैराज','Garage spécialisé','Garagem especial'),
 neonCarHelp:row('Vanta: fast roads. Ibex: steep trails. Citadel: armored cabin. Flux: rapid acceleration. A purchase replaces your current car.','وانتا: آزادراه. آی‌بکس: شیب و خاک. سیتادل: کابین زرهی. فلاکس: شتاب سریع. خرید، ماشین فعلی را جایگزین می‌کند.','Vanta适合高速，Ibex适合山路，Citadel有装甲，Flux加速快。购买会替换当前汽车。'),
 neonSpeed:row('Speed / grip / climb','سرعت / چسبندگی / صعود','速度 / 抓地 / 爬坡'),
 neonPantheon:row('GME / Seventeen gods','GME / هفده خدا','GME / 十七神','GME / سبعة عشر إلهاً','GME / Diecisiete dioses','GME / सत्रह देवता','GME / Dix-sept dieux','GME / Dezessete deuses'),
 standard:row('Three-phase duel','دوئل سه‌مرحله‌ای','三阶段决斗','مبارزة بثلاث مراحل','Duelo en tres fases','तीन चरणों का द्वंद्व','Duel en trois phases','Duelo em três fases'),
 endurance:row('Endurance siege','محاصرهٔ استقامت','耐力围攻','حصار التحمل','Asedio de resistencia','सहनशक्ति घेराबंदी','Siège d’endurance','Cerco de resistência'),
 enduranceHelp:row('Endurance is a long encounter with three acts, breakable seals and supplies every 45 active seconds. Pause any time; your current fight is saved. Duration depends on weapons and skill; 45–60 minutes is a tuning target, not a timer. Death resets the attempt.','استقامت نبردی طولانی با سه پرده، مهرهای شکستنی و تدارکات در هر ۴۵ ثانیهٔ فعال است. هر زمان توقف کن؛ مبارزه ذخیره می‌شود. زمان به سلاح و مهارت بستگی دارد؛ ۴۵ تا ۶۰ دقیقه هدف تنظیم است، نه زمان‌سنج اجباری. مرگ تلاش جاری را از نو آغاز می‌کند.','耐力模式有三幕、可破封印，每45秒补给。随时暂停，战斗保存。时长取决于装备与技巧，45–60分钟是平衡目标，并非强制计时；死亡重置本次挑战。'),
 trialSeals:row('Break the three floating seals to remove the shield','سه مهر شناور را بزن تا سپر شکسته شود','击破三个浮印以解除护盾'),
 trialClock:row('Active time','زمان فعال','战斗时间'),
 godPower:row('Invoke earned power','فراخواندن قدرت کسب‌شده','调用已获神力','استدعاء القوة المكتسبة','Invocar poder ganado','प्राप्त शक्ति बुलाएँ','Invoquer un pouvoir acquis','Invocar poder conquistado'),
 godReady:row('Power ready','قدرت آماده است','神力就绪'),
 godCooldown:row('Power is recovering','قدرت در حال بازیابی است','神力冷却中'),
 cross:row('CROSS — leave both axes; safe diagonals','صلیب — از هر دو محور دور شو؛ قطرها امن‌اند','交叉 — 避开两轴，斜角安全'),
 pincer:row('PINCER — leave the two flanking circles','گازانبری — از دو دایرهٔ طرفین دور شو','夹击 — 离开两侧圆圈'),
 iron:row('Ferrum, god of engines','فروم، خدای موتور‌ها','费鲁姆，引擎之神'),
 mirror:row('Vela, goddess of borrowed faces','ولا، خدای چهره‌های قرضی','维拉，借面之神'),
 gravity:row('Atlas, keeper of falling cities','اطلس، نگهبان شهرهای سقوط‌کرده','阿特拉斯，坠城守护者'),
 thorn:row('Briar, the unowned garden','بریار، باغ بی‌مالک','布莱尔，无主花园'),
 oracle:row('Sybil, the unsent prophecy','سیبیل، پیشگویی ارسال‌نشده','西比尔，未寄预言'),
 frost:row('Rime, the frozen exchange','رایم، صرافی منجمد','莱姆，冰封交易所'),
 plague:row('Morrow, eater of promises','مورو، وعده‌خوار','莫罗，承诺吞噬者'),
 sun:row('Sol, the purchased dawn','سول، سپیدهٔ خریداری‌شده','索尔，被买下的黎明'),
 moon:row('Lune, the hidden witness','لون، شاهد پنهان','露恩，隐秘见证者'),
 ledger:row('Tally, god of unpaid names','تالی، خدای نام‌های تسویه‌نشده','塔利，未清姓名之神'),
 genesis:row('Zero, the first permission','زیرو، نخستین اجازه','零，最初许可'),
 gme_iron:row('FORGE: repair 45% of your car hull.','کوره: تعمیر ۴۵ درصد بدنهٔ ماشین.','熔炉：修复45%车体。'),
 gme_mirror:row('REFLECTION: a short, five-minute game-time damage ward.','بازتاب: سپر آسیب برای پنج دقیقهٔ زمان بازی.','反射：获得五分钟游戏时间的护盾。'),
 gme_gravity:row('GRAVITY WELL: halve nearby hunters’ movement for 12 game minutes.','چاه گرانش: حرکت شکارچی‌ها برای ۱۲ دقیقهٔ بازی نصف می‌شود.','重力井：追猎者移速减半，持续12游戏分钟。'),
 gme_thorn:row('GREEN HEART: recover 45 health.','قلب سبز: بازیابی ۴۵ جان.','绿心：恢复45生命。'),
 gme_oracle:row('TRUE SIGHT: reveal hidden BUY signals around you.','دید راستین: آشکارکردن نشانه‌های مخفی BUY اطراف.','真视：揭示附近隐藏的BUY信号。'),
 gme_frost:row('FROZEN ROAD: slow hunters for 18 game minutes.','راه یخ‌زده: کندکردن شکارچی‌ها برای ۱۸ دقیقهٔ بازی.','冰路：减速追猎者18游戏分钟。'),
 gme_plague:row('ANTIDOTE: clear impairment and recover 20 health.','پادزهر: رفع اختلال و بازیابی ۲۰ جان.','解毒：清除不良状态并恢复20生命。'),
 gme_sun:row('BORROWED DAY: illuminate the night for 120 game minutes.','روز قرضی: روشنایی شب برای ۱۲۰ دقیقهٔ بازی.','借日：照亮夜晚120游戏分钟。'),
 gme_moon:row('UNSEEN: hunters cannot acquire you by sight for 18 game minutes; noise still betrays you.','نادیده: شکارچی‌ها ۱۸ دقیقهٔ بازی با دیدن پیدایت نمی‌کنند؛ صدا هنوز لو می‌دهد.','隐匿：追猎者18游戏分钟无法目视发现你；声音仍会暴露位置。'),
 gme_ledger:row('AMNESTY: erase 120 debt and reduce pursuit heat by 25.','عفو: حذف ۱۲۰ بدهی و کاهش ۲۵ درجهٔ تعقیب.','赦免：消除120债务并降低25通缉热度。'),
 gme_genesis:row('REWRITE: grant the city one peaceful game day.','بازنویسی: یک روز آرام به شهر هدیه بده.','重写：给予城市一个和平游戏日。')
};

NEON_TEXT.mythBook=NEON_TEXT.neonPantheon;
NEON_TEXT.mythIntro=neonRow('Seventeen gods, three phases each. The arena seals when you enter. Learn each warning; death resets the attempt. GME powers are permanent.','هفده خدا، هرکدام سه مرحله. با ورود، میدان بسته می‌شود. هشدارها را یاد بگیر؛ مرگ تلاش را از نو آغاز می‌کند. قدرت GME دائمی است.','十七位神明，每位三个阶段。进入后竞技场封闭。学习预警；死亡重置挑战，GME神力永久保留。');

NEON_TEXT.neonTryAgain=neonRow('Compare the clues again. No resources were spent.','نشانه‌ها را دوباره مقایسه کن. چیزی از دست ندادی.','再比较线索，没有消耗资源。');
NEON_TEXT.neonConfirm=neonRow('Confirm signal','تأیید سیگنال','确认信号');

NEON_TEXT.neonLeaveStory=neonRow('Leave this story for later · restart at step 1','این قصه برای بعد · شروع دوباره از گام اول','暂时离开故事 · 下次从第一步重来');

NEON_TEXT.neonPowerHelp=neonRow('Defeat a guardian and collect its GME coin first. Earned powers share a 90-minute game-time cooldown. They can be invoked outdoors; the first six also retain their permanent benefits.','اول نگهبان را شکست بده و سکهٔ GME او را بردار. قدرت‌های کسب‌شده زمان انتظار مشترکِ ۹۰ دقیقهٔ بازی دارند و در فضای باز فعال می‌شوند. شش قدرت اول مزیت دائمی خود را هم نگه می‌دارند.','先击败守护者并领取GME金币。已获神力共享90游戏分钟冷却，在室外使用；前六种仍保留永久增益。');
