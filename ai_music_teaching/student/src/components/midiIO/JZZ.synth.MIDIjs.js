export default function (JZZ) {
  if (!JZZ) return;
  if (!JZZ.synth) JZZ.synth = {};

  function _name(name) { return name ? name : 'JZZ.synth.MIDIjs'; }

  let _waiting = false;
  let _running = false;
  let _bad = false;
  let _error;

  function _receive(a) {
    let s = a[0] >> 4;
    let c = a[0] & 0xf;
    if (s == 0x8) {
      MIDI.noteOff(c, a[1]);
    }
    else if (s == 0x9) {
      MIDI.noteOn(c, a[1], a[2]);
    }
  }

  let _ports = [];
  function _release(port, name) {
    port._info = _engine._info(name);
    port._receive = _receive;
    port._resume();
  }

  function _onsuccess() {
    _running = true;
    _waiting = false;
    for (let i = 0; i < _ports.length; i++) _release(_ports[i][0], _ports[i][1]);
  }

  function _onerror(evt) {
    _bad = true;
    _error = evt;
    for (let i = 0; i < _ports.length; i++) _ports[i][0]._crash(_error);
  }

  let _engine = {};

  _engine._info = function (name) {
    return {
      type: 'MIDI.js',
      name: _name(name),
      manufacturer: 'virtual',
      version: '0.3.2'
    };
  }

  _engine._openOut = function (port, name) {
    if (_running) {
      _release(port, name);
      return;
    }
    if (_bad) {
      port._crash(_error);
      return;
    }
    port._pause();
    _ports.push([port, name]);
    if (_waiting) return;
    _waiting = true;
    let arg = _engine._arg;
    if (!arg) arg = {};
    arg.onsuccess = _onsuccess;
    arg.onerror = _onerror;
    try {
      MIDI.loadPlugin(arg);
    }
    catch (e) {
      _error = e.message;
      _onerror(_error);
    }
  }

  JZZ.synth.MIDIjs = function (name) {
    let arg;
    if (arguments.length == 1) arg = arguments[0];
    else { name = arguments[0]; arg = arguments[1]; }
    name = _name(name);
    if (!_running && !_waiting) _engine._arg = arg;
    return JZZ.lib.openMidiOut(name, _engine);
  }

  JZZ.synth.MIDIjs.register = function (name) {
    let arg;
    if (arguments.length == 1) arg = arguments[0];
    else { name = arguments[0]; arg = arguments[1]; }
    name = _name(name);
    if (!_running && !_waiting) _engine._arg = arg;
    return JZZ.lib.registerMidiOut(name, _engine);
  }
};
