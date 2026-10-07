import {L} from './i18n.js';

// Input and appearance labels live separately from the story copy so the
// settings screen can stay lightweight and every control remains localised.
export const INPUT={
 inputMode:L('حالت کنترل','Input mode','控制方式','وضع التحكم','Modo de control','नियंत्रण मोड','Mode de contrôle','Modo de controlo'),
 inputHelp:L('روش حرکت را برای صفحه و موبایل انتخاب کن.','Choose how Vlad moves on this device.','选择本设备上的移动方式。','اختر طريقة حركة فلاد على هذا الجهاز.','Elige cómo se mueve Vlad en este dispositivo.','इस डिवाइस पर व्लाद की चाल चुनें।','Choisissez le déplacement de Vlad sur cet appareil.','Escolha como Vlad se move neste dispositivo.'),
 hybrid:L('ترکیبی','Hybrid','混合','مختلط','Híbrido','हाइब्रिड','Hybride','Híbrido'),
 click:L('کلیک برای حرکت','Click to move','点击移动','النقر للتحرك','Clic para mover','क्लिक से चलें','Cliquer pour déplacer','Clique para mover'),
 joystick:L('جوی‌استیک داینامیک','Dynamic joystick','动态摇杆','عصا تحكم ديناميكية','Joystick dinámico','डायनेमिक जॉयस्टिक','Joystick dynamique','Joystick dinâmico'),
 clickHelp:L('روی زمین بزن تا ولاد مسیر امن را پیدا کند.','Tap or click the ground and Vlad will follow the safest path.','点击地面，弗拉德会沿安全路线前进。','المس الأرض ليتبع فلاد المسار الآمن.','Toca el suelo y Vlad seguirá la ruta segura.','ज़मीन पर टैप करें और व्लाद सुरक्षित रास्ता अपनाएगा।','Touchez le sol pour que Vlad suive le chemin sûr.','Toque no chão e Vlad seguirá a rota segura.'),
 joystickHelp:L('انگشتت را روی صفحه بگذار و مثل پابجی حرکت بده.','Place your thumb on the scene and steer like a twin-stick game.','把拇指放在场景上，像双摇杆游戏一样操控。','ضع إصبعك على المشهد وتحكم مثل ألعاب العصا المزدوجة.','Pon el pulgar sobre la escena y conduce como en un juego de doble joystick.','दृश्य पर अंगूठा रखकर ट्विन-स्टिक की तरह चलें।','Posez le pouce sur la scène et dirigez comme dans un jeu à double joystick.','Pouse o polegar na cena e conduza como num jogo de dois analógicos.'),
 avatarTone:L('پوستهٔ ولاد','Vlad palette','弗拉德配色','لوحة فلاد','Paleta de Vlad','व्लाद पैलेट','Palette de Vlad','Paleta de Vlad'),
 avatarHelp:L('رنگ لباس و نور همراه ولاد را عوض کن.','Change Vlad’s coat, scarf and signal colors.','更换弗拉德的外套、围巾和信号颜色。','غيّر ألوان معطف فلاد ووشاحه والإشارة.','Cambia los colores del abrigo, la bufanda y la señal de Vlad.','व्लाद के कोट, स्कार्फ और सिग्नल रंग बदलें।','Changez les couleurs du manteau, de l’écharpe et du signal de Vlad.','Mude as cores do casaco, cachecol e sinal de Vlad.'),
 classic:L('کلاسیک','Classic','经典','كلاسيكي','Clásico','क्लासिक','Classique','Clássico'),
 ember:L('اخگر','Ember','余烬','جمرة','Ascua','अंगारा','Braise','Brasa'),
 ocean:L('اقیانوس','Ocean','海洋','محيط','Océano','समुद्र','Océan','Oceano'),
 mono:L('تک‌رنگ','Monochrome','单色','أحادي اللون','Monocromo','मोनोक्रोम','Monochrome','Monocromático'),
 accent:L('رنگ رابط','Interface accent','界面强调色','لون الواجهة','Color de interfaz','इंटरफ़ेस रंग','Accent de l’interface','Cor da interface'),
 accentHelp:L('رنگ نشانه‌ها، مسیر و رابط را انتخاب کن.','Choose the color of trails, hints and interface signals.','选择路径、提示和界面信号的颜色。','اختر لون المسارات والتلميحات وإشارات الواجهة.','Elige el color de las rutas, pistas y señales.','रास्तों, संकेतों और इंटरफ़ेस संकेतों का रंग चुनें।','Choisissez la couleur des pistes, indices et signaux.','Escolha a cor das rotas, dicas e sinais.'),
 green:L('سبز آرشیو','Archive green','档案绿','أخضر الأرشيف','Verde de archivo','आर्काइव हरा','Vert archive','Verde de arquivo'),
 amber:L('کهربایی','Amber','琥珀','كهرماني','Ámbar','ऐंबर','Ambre','Âmbar'),
 blue:L('آبی سیگنال','Signal blue','信号蓝','أزرق الإشارة','Azul señal','सिग्नल नीला','Bleu signal','Azul de sinal'),
 violet:L('بنفش گلیچ','Glitch violet','故障紫','بنفسجي الخلل','Violeta glitch','ग्लिच बैंगनी','Violet glitch','Violeta glitch'),
 joystickSize:L('اندازهٔ جوی‌استیک','Joystick size','摇杆大小','حجم عصا التحكم','Tamaño del joystick','जॉयस्टिक आकार','Taille du joystick','Tamanho do joystick'),
 joystickSizeHelp:L('اندازهٔ کنترل لمسی را با صفحه‌ات هماهنگ کن.','Scale the touch control to fit your hand and screen.','调整触控摇杆大小以适应你的手和屏幕。','اضبط حجم التحكم اللمسي ليناسب يدك وشاشتك.','Ajusta el control táctil a tu mano y pantalla.','टच कंट्रोल को अपने हाथ और स्क्रीन के अनुसार बदलें।','Adaptez le contrôle tactile à votre main et votre écran.','Ajuste o controle tátil à sua mão e tela.')
};
