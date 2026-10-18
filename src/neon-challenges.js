import {neonRow as row} from './neon-text.js';
// Small authored deductions give individual stories different interactions.
export const NEON_CHALLENGES={
 'halt-0':{answer:0,prompt:row('Which system imposed this restriction?','کدام سامانه این محدودیت را اعمال کرد؟','哪个系统施加了限制？'),options:[row('The brokerage','کارگزاری','券商'),row('Bitcoin consensus','اجماع بیت‌کوین','比特币共识'),row('The entire Internet','تمام اینترنت','整个互联网')]},
 'relativity-1':{answer:1,prompt:row('Both clocks show 08:00. Which record needs repair?','هر دو ساعت 08:00 را نشان می‌دهند. کدام سند باید اصلاح شود؟','两座钟均显示08:00，哪项记录需要修复？'),options:[row('Change the worker’s clock','ساعت کارگر را عوض کن','改工人的时钟'),row('Correct the payroll price feed','دادهٔ قیمت در حقوق را اصلاح کن','修正工资价格数据'),row('Charge a late fee','جریمهٔ دیرکرد بگیر','收取迟到罚款')]},
 'silentfilm-1':{answer:1,prompt:row('What belongs in the missing final frame?','جای قاب آخر چه چیزی باید باشد؟','最后一帧应该是什么？'),options:[row('A bigger portrait of the star','تصویری بزرگ‌تر از ستاره','更大的明星肖像'),row('The audience he made laugh','تماشاگرهایی که خندانده','被逗笑的观众'),row('A BUY advertisement','تبلیغ BUY','BUY广告')]},
 'merge-1':{answer:'132',pattern:true,prompt:row('Synchronize the relay: north I, canal III, tower II. Rotate each node, then confirm.','رله را هم‌فاز کن: شمال I، کانال III، برج II. هر گره را بچرخان، سپس تأیید کن.','同步中继：北方I、运河III、高塔II。旋转各节点后确认。'),options:[row('North','شمال','北'),row('Canal','کانال','运河'),row('Tower','برج','塔')]},
 'blackout-1':{answer:0,prompt:row('What should this exhibit preserve?','این نمایشگاه چه چیزی را باید حفظ کند؟','展览应保留什么？'),options:[row('The witnesses and their names','شاهدها و نام‌هایشان','证人与姓名'),row('The dictator’s sales slogan','شعار فروش دیکتاتور','独裁者的推销口号')]}
};
export const challengeFor=(id,step)=>NEON_CHALLENGES[id+'-'+step];
