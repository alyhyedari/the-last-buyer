export const cr=(en,fa)=>({en,fa,zh:en,ar:en,es:en,hi:en,fr:en,pt:en});
export const CYBER_SPOTS=[
 {id:'coast-garage',x:420.5,y:176.5,name:cr('Afterburn Customs','گاراژ افتر‌برن'),body:cr('Engines, grip, armor and brakes. Every upgrade changes how the vehicle handles.','موتور، چسبندگی، زره و ترمز؛ هر ارتقا روی رانندگی اثر دارد.')},
 {id:'coast-start',x:404.5,y:196.5,name:cr('Midnight Express / circuit','بزرگراه نیمه‌شب / پیست'),body:cr('Four ordered checkpoints. Stay on the road; speed without control loses the run.','چهار ایست با ترتیب مشخص؛ روی جاده بمان. سرعت بدون کنترل مسابقه را خراب می‌کند.')},
 {id:'coast-beach',x:466.5,y:260.5,name:cr('Glasswater Beach','ساحل شیشه‌آب'),body:cr('White sand, palms, a promenade and open water. Follow the blue line to the shore.','ماسهٔ روشن، نخل، پیاده‌راه و آب آزاد؛ خط آبی را تا ساحل دنبال کن.')},
 {id:'coast-club',x:438.5,y:164.5,name:cr('Velvet Circuit / night lounge','ولوت سیرکیت / پاتوق شب'),body:cr('Meet adult racers, engineers and performers. Friendship and private dates depend on mutual interest.','با راننده‌ها، مهندس‌ها و هنرمندان بزرگسال آشنا شو؛ دوستی و قرار خصوصی به علاقهٔ دوطرفه بستگی دارد.')},
 {id:'coast-dealer',x:434.5,y:176.5,name:cr('The Mirage vendor','فروشندهٔ میراژ'),body:cr('Fictional sensory blends: temporary visual effects, reduced control and a recovery period. No real substances or recipes.','ترکیب‌های حسی خیالی: تغییر موقت تصویر، افت کنترل و دورهٔ بازیابی؛ بدون ماده یا دستور ساخت واقعی.')},
 {id:'coast-bat',x:420.5,y:154.5,name:cr('Batman / rooftop signal','بتمن / سیگنال پشت‌بام'),body:cr('A fictional guest in this city. His emergency relay can shield you, repair a vehicle or send supplies.','مهمان داستانی این شهر؛ رلهٔ اضطراری او گاهی سپر می‌دهد، گاهی ماشین را تعمیر می‌کند و گاهی تدارکات می‌رساند.')}
];
export const CIRCUIT=[{x:404.5,y:406.5},{x:454.5,y:406.5},{x:454.5,y:196.5},{x:404.5,y:196.5}];
export const MOTOR_MODELS=[
 {id:'needle',speed:16,accel:6.2,grip:1.1,offroad:.55,climb:.5,cost:480,color:'#68e4ec'},
 {id:'ronin',speed:21,accel:7.4,grip:.9,offroad:.4,climb:.4,cost:980,color:'#ff638e'},
 {id:'nomad',speed:12,accel:4.8,grip:1.35,offroad:1.3,climb:1.5,cost:620,color:'#d8bc7b'},
 {id:'spectre',speed:18,accel:8.2,grip:1.2,offroad:.6,climb:.6,cost:1250,color:'#ae8eff',electric:true}
];
export const CYBER_ARMS=[
 {id:'arc',cost:450,name:cr('ARC / chain shock','آرک / شوک زنجیره‌ای'),body:cr('Short range; jumps to two nearby enemies and briefly interrupts pursuit. Uses shared rounds.','برد کوتاه؛ به دو دشمن نزدیک سرایت می‌کند و تعقیب را موقتاً قطع می‌کند. مهمات مشترک.')},
 {id:'rail',cost:720,name:cr('RAIL / precision lance','ریل / نیزهٔ دقیق'),body:cr('Slow, powerful precision fire. Pierces up to three aligned targets, never walls. Uses shared rounds.','شلیک دقیق، قوی و کند؛ تا سه هدف هم‌راستا را می‌زند، از دیوار عبور نمی‌کند. مهمات مشترک.')},
 {id:'pulse',cost:560,name:cr('PULSE / burst repeater','پالس / رگبار انرژی'),body:cr('Rapid automatic fire with a small magazine; best at medium range. Uses shared rounds.','رگبار سریع با خشاب کوچک؛ مناسب برد متوسط. مهمات مشترک.')},
 {id:'monoblade',cost:320,name:cr('MONO / silent blade','مونو / تیغهٔ بی‌صدا'),body:cr('Fast melee, no ammunition, very short reach.','ضربهٔ نزدیک و سریع، بدون مهمات و با برد بسیار کوتاه.')}
];
export const ABILITIES=[
 {id:'overdrive',cost:360,name:cr('Overdrive','اوردرایو'),body:cr('8 game minutes of engine boost; costs 12 fuel. Cooldown: 55 minutes.','۸ دقیقهٔ بازی تقویت سرعت؛ هزینهٔ ۱۲ سوخت. بازیابی: ۵۵ دقیقه.'),duration:8,cooldown:55},
 {id:'aegis',cost:480,name:cr('Aegis shield','سپر ایجیس'),body:cr('12 game minutes of reduced incoming damage; costs 18 energy. Cooldown: 80 minutes.','۱۲ دقیقهٔ بازی کاهش آسیب؛ هزینهٔ ۱۸ انرژی. بازیابی: ۸۰ دقیقه.'),duration:12,cooldown:80},
 {id:'ghost',cost:620,name:cr('Ghost veil','پردهٔ شبح'),body:cr('15 game minutes hidden from normal visual pursuit; noise still reveals you. Costs 22 energy. Cooldown: 100 minutes.','۱۵ دقیقهٔ بازی پنهان از دید تعقیب‌کننده‌های معمولی؛ صدا هنوز لو می‌دهد. هزینهٔ ۲۲ انرژی. بازیابی: ۱۰۰ دقیقه.'),duration:15,cooldown:100}
];
export const BLENDS=[
 {id:'prism',cost:28,name:cr('Prism','منشور'),body:cr('Cyan-magenta split; reduced steering and walking control.','تفکیک فیروزه‌ای و ارغوانی؛ افت کنترل حرکت و فرمان.'),tint:'#b94a9655'},
 {id:'velvet',cost:24,name:cr('Velvet','مخمل'),body:cr('Warm tunnel vision; lower energy and slower travel.','دید تونلی گرم؛ کاهش انرژی و کندی حرکت.'),tint:'#d6a34f66'},
 {id:'static',cost:32,name:cr('Static','برفک'),body:cr('Cool scanlines and visual grain; reduced speed.','خطوط سرد و نویز تصویر؛ افت سرعت حرکت.'),tint:'#729ab766'}
];
export const COAST_CAST=[
 {id:'batman',x:420.5,y:154.5,variant:4,name:cr('Batman / the night relay','بتمن / رلهٔ شب'),body:cr('“A fast car is useful. A working brake is a plan.” Ask the relay for emergency assistance in the coast panel. Guest fiction.','«ماشین سریع به درد می‌خورد؛ ترمز سالم یعنی نقشه داری.» از پنل ساحل درخواست کمک اضطراری کن. حضور داستانی.')},
 {id:'trump',x:432.5,y:154.5,variant:5,name:cr('Trump / satirical hologram','ترامپ / هولوگرام طنز'),body:cr('The fictional hologram unveils a “tremendous” toll booth. The crowd asks whether the exit costs extra. He starts selling a premium exit. This is an invented scene, not a real quotation.','هولوگرام خیالی از عوارضی «فوق‌العاده» رونمایی می‌کند. مردم می‌پرسند خروج هم پولی است؟ فروش خروج ویژه را شروع می‌کند. صحنه و دیالوگ ساختگی‌اند.')},
 ...[
 ['nova',27,'Nova / racing engineer','نوا / مهندس مسابقه','My kind of chemistry? Brakes that work.','شیمی مورد علاقه‌م؟ ترمزی که بگیره.',426.5,164.5],
 ['roxie',31,'Roxie / DJ','روکسی / دی‌جی','The beat drops. My standards do not.','بیس می‌افته؛ استانداردهای من نه.',430.5,164.5],
 ['leila',29,'Leila / marine biologist','لیلا / زیست‌شناس دریا','Meet me where the city stops charging for the view.','جایی ببینمت که شهر بابت منظره پول نمی‌گیره.',466.5,268.5],
 ['jade',26,'Jade / courier','جید / پیک','Keep up on the road. Slow down when I am talking.','توی جاده پا‌به‌پام بیا؛ وقتی حرف می‌زنم آروم برو.',442.5,164.5],
 ['selene',34,'Selene / lighting artist','سلین / هنرمند نور','Neon looks better when someone knows when to switch it off.','نئون وقتی قشنگ‌تره که یکی بدونه کی خاموشش کنه.',446.5,164.5],
 ['yasmin',28,'Yasmin / motorcycle builder','یاسمین / سازندهٔ موتور','I tune engines, not personalities. Bring your own.','موتور تیون می‌کنم، شخصیت نه؛ مال خودتو بیار.',424.5,176.5]
 ].map(([id,age,en,fa,body,bodyFa,x,y],i)=>({id,age,x,y,variant:6+i,name:cr(en+' / '+age,fa+' / '+age+' ساله'),body:cr(body,bodyFa)}))
].map(c=>({...c,kind:'neonEcho'}));
export const CYBER_TEXT={
 cyberTitle:cr('NEON COAST / AFTERBURN','ساحل نئون / افتر‌برن'),cyberIntro:cr('A new coast, a midnight expressway, custom engines and strange allies. Routes lead into the actual world.','ساحل تازه، بزرگراه نیمه‌شب، موتورهای تیون‌شده و همراهان عجیب؛ مسیرها وارد دنیای واقعی بازی می‌شوند.'),
 cyberGarage:cr('Custom garage','گاراژ تیونینگ'),cyberArms:cr('Specialist weapons','سلاح‌های تخصصی'),cyberAbilities:cr('Cyber abilities','توانایی‌های سایبری'),cyberBlends:cr('Mirage vendor','فروشندهٔ میراژ'),cyberRace:cr('Start circuit here','شروع مسابقه از اینجا'),cyberHelper:cr('Call the night relay','تماس با رلهٔ شب'),cyberVisuals:cr('Sensory effects','جلوه‌های حسی'),cyberVisualHelp:cr('Disable visual distortion; gameplay penalties still apply.','اعوجاج تصویر را خاموش کن؛ عوارض گیم‌پلی همچنان اعمال می‌شوند.'),
 engine:cr('Engine','موتور'),grip:cr('Tires / grip','لاستیک / چسبندگی'),armor:cr('Armor','زره'),brakes:cr('Brakes','ترمز'),cyberOwned:cr('Owned / select','خریداری‌شده / انتخاب'),cyberTune:cr('Tune selected vehicle','تیون وسیلهٔ انتخاب‌شده'),cyberUse:cr('Activate','فعال کن'),cyberBuy:cr('Buy','خرید'),cyberUnavailable:cr('Unavailable: check location, funds, fuel, energy or cooldown.','فعلاً در دسترس نیست؛ موقعیت، پول، سوخت، انرژی یا زمان بازیابی را بررسی کن.'),cyberRaceStart:cr('Circuit live. Pass the four markers in order.','مسابقه شروع شد؛ چهار نشان را به ترتیب رد کن.'),cyberRaceDone:cr('Circuit completed / reward $180','مسابقه تمام شد / پاداش ۱۸۰'),cyberRaceCancel:cr('Circuit cancelled: return to the road with a vehicle.','مسابقه لغو شد؛ با وسیله به جاده برگرد.'),cyberCancel:cr('Cancel circuit','لغو مسابقه'),cyberHelpFuel:cr('The relay sent fuel. “A dramatic exit needs a full tank.”','رله سوخت فرستاد: «خروج باشکوه، باک پُر می‌خواد.»'),cyberHelpShield:cr('A shield drops into place. “Your plot armor finally has a warranty.”','سپر فعال شد: «زره داستانیت بالاخره گارانتی گرفت.»'),cyberHelpRepair:cr('Repair drones arrive. “They fixed the car. Your parking is still a crime.”','پهپادهای تعمیر رسیدند: «ماشین درست شد؛ پارک کردنت هنوز جرمه.»'),cyberHelpEnergy:cr('A supply drone restores energy. “Even revenge needs a lunch break.”','پهپاد تدارکات انرژی آورد: «حتی انتقام هم زنگ ناهار می‌خواد.»'),
 arc:cr('Arc','آرک'),rail:cr('Rail','ریل'),pulse:cr('Pulse','پالس'),monoblade:cr('Monoblade','تیغهٔ مونو')
};
