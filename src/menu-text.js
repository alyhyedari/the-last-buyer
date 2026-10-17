const langs=['en','fa','zh','ar','es','hi','fr','pt'];
const rows={
 savedWorld:['Your saved world','جهان ذخیره‌شدهٔ تو','你保存的世界','عالمك المحفوظ','Tu mundo guardado','आपकी सहेजी दुनिया','Votre monde sauvegardé','Seu mundo salvo'],
 wildEndings:['archive endings','پایان آرشیو','档案结局','نهايات الأرشيف','finales del archivo','अभिलेख के अंत','fins des archives','finais do arquivo'],
 wildEdition:['CITIES OF TOMORROW / EXPANSION 11','شهرهای فردا / گسترش ۱۱','明日之城 / 扩展 11','مدن الغد / التوسعة 11','CIUDADES DEL MAÑANA / EXPANSIÓN 11','कल के शहर / विस्तार 11','VILLES DE DEMAIN / EXTENSION 11','CIDADES DO AMANHÃ / EXPANSÃO 11'],
 wildLead:['A village to save. A city to lose yourself in. And lights in the forest that nobody can explain. Every BUY leaves a trace.','روستایی برای نجات. شهری برای گم شدن. و نورهایی در جنگل که هیچ‌کس توضیحی برایشان ندارد. هر BUY ردّی به جا می‌گذارد.','一个等待拯救的村庄，一座让人迷失的城市，还有森林里无人能解释的光。每次 BUY 都留下痕迹。','قرية لإنقاذها ومدينة لتضيع فيها وأضواء في الغابة لا يفسرها أحد. كل BUY يترك أثرًا.','Un pueblo por salvar. Una ciudad donde perderte. Luces inexplicables en el bosque. Cada BUY deja huella.','बचाने के लिए एक गाँव। खो जाने के लिए एक शहर। और वन में रहस्यमय रोशनियाँ। हर BUY निशान छोड़ता है।','Un village à sauver. Une ville où se perdre. Et des lumières inexplicables dans la forêt. Chaque BUY laisse une trace.','Uma vila para salvar. Uma cidade para se perder. E luzes inexplicáveis na floresta. Cada BUY deixa uma marca.'],
 wildCity:['01 / CITY','۰۱ / شهر','01 / 城市','01 / المدينة','01 / CIUDAD','01 / शहर','01 / VILLE','01 / CIDADE'],
 wildForest:['02 / WILDERNESS','۰۲ / جنگل','02 / 荒野','02 / البرية','02 / BOSQUE','02 / वन','02 / FORÊT','02 / FLORESTA'],
 wildWater:['03 / BELOW','۰۳ / زیر آب','03 / 水下','03 / الأعماق','03 / PROFUNDIDAD','03 / गहराई','03 / PROFONDEURS','03 / PROFUNDEZA'],
 wildCaption:['Your next life starts with a choice.','زندگی بعدی تو با یک انتخاب شروع می‌شود.','你的下一段人生始于选择。','حياتك التالية تبدأ باختيار.','Tu próxima vida empieza con una decisión.','आपका अगला जीवन एक चुनाव से शुरू होता है।','Votre prochaine vie commence par un choix.','Sua próxima vida começa com uma escolha.']
};
export const MENU_TEXT=Object.fromEntries(Object.entries(rows).map(([k,a])=>[k,Object.fromEntries(langs.map((l,i)=>[l,a[i]]))]));
