import test from 'node:test';
import assert from 'node:assert/strict';
import {captureKey} from '../site/key-capture.js';
import {keyName} from '../site/key-names.js';
test('direct input captures characters, symbols, navigation and keypad keys', () => {
  assert.equal(captureKey({key:'a',code:'KeyA'}),4);
  assert.equal(captureKey({key:'@',code:'BracketLeft'}),0x21f);
  assert.equal(captureKey({key:'?',shiftKey:true}),0x238);
  assert.equal(captureKey({key:'Tab'}),43);
  assert.equal(captureKey({key:'Escape'}),41);
  assert.equal(captureKey({key:'1',code:'Numpad1'}),89);
  assert.equal(captureKey({key:'F24'}),115);
});
test('direct input captures shortcuts and Hold modifier combinations', () => {
  assert.equal(captureKey({key:'c',ctrlKey:true}),0x106);
  const chord=captureKey({key:'C',ctrlKey:true,shiftKey:true});
  assert.equal(chord,0x306);
  assert.equal(keyName(chord,'0x0306').label,'Left Ctrl + Left Shift + C');
  assert.equal(captureKey({key:'Alt',code:'AltLeft',ctrlKey:true,altKey:true},{hold:true}),0x500);
  assert.equal(captureKey({key:'Alt',code:'AltRight',altKey:true},{hold:true}),0xe6);
  assert.throws(()=>captureKey({key:'c',ctrlKey:true},{hold:true}),/長押し/);
  assert.throws(()=>captureKey({key:'a',ctrlKey:true,altKey:true},{modifierCodes:['ControlLeft','AltRight']}),/左右/);
  assert.throws(()=>captureKey({key:'Process',isComposing:true}),/IME/);
});

test('Mac shortcuts preserve the host meaning through the firmware modifier swap', () => {
  assert.equal(captureKey({key:'c',metaKey:true},{mac:true}),0x106);
  assert.equal(captureKey({key:'c',ctrlKey:true},{mac:true}),0x806);
});
