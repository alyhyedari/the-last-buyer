import test from 'node:test';
import assert from 'node:assert/strict';
import {phoneDisplay} from '../src/mobile.js';
import {defaultSettings,readSettings} from '../src/state.js';
import {ORDER,setLanguage,getLanguage,direction} from '../src/i18n.js';
import {MOBILE} from '../src/mobile-text.js';
test('English is the fresh and corrupt-settings fallback; chosen languages survive',()=>{
 assert.equal(defaultSettings().language,'en');assert.equal(readSettings({getItem:()=>null}).language,'en');
 assert.equal(readSettings({getItem:()=>'{bad'}).language,'en');
 assert.equal(readSettings({getItem:()=>JSON.stringify({language:'unknown'})}).language,'en');
 for(const language of ORDER)assert.equal(readSettings({getItem:()=>JSON.stringify({language})}).language,language);
 setLanguage('invalid');assert.equal(getLanguage(),'en');assert.equal(direction(),'ltr');setLanguage('fa');assert.equal(direction(),'rtl');
});
test('compact touch detection follows the viewport and does not classify a narrow desktop as a phone',()=>{
 assert.deepEqual(phoneDisplay({width:390,height:844,touchPoints:5,coarse:true}),{phone:true,landscape:false});
 assert.deepEqual(phoneDisplay({width:844,height:390,touchPoints:5,coarse:true}),{phone:true,landscape:true});
 assert.equal(phoneDisplay({width:390,height:844,touchPoints:0,coarse:false}).phone,false);
 assert.equal(phoneDisplay({width:1366,height:768,touchPoints:10,coarse:false}).phone,false);
 for(const locale of ORDER)for(const value of Object.values(MOBILE))assert.ok(value[locale]?.trim(),locale);
});
