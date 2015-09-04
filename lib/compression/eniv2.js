"use strict";

var compression = (function(compression) {
  var grow = compression.grow;

  function combineFlags(flags, data) {
    // 0bPCCV HAAA AAAA AAAA
    // TODO check this
    var pal = flags & 0x6000;
    var mode = flags & 0x9800;
    return (data | mode) + pal;
  }

  function getFlags(input, flags) {
    var out = 0;
    for (var i = 0x10; i > 0; i >>= 1) {
      if ((flags & i) && input.getUnsigned(1)) out |= i;
    }
    return out << 11;;
  }

  compression.enidec = function(input) {
    var out = new jDataView(16);

    var inb = input.getInt8();
    var flags = input.getUint8() & 0x1F; // 0b00011111
    var icw = input.getUint16();
    var lcw = input.getUint16();

    for (;;) {
      var typeId = input.getUnsigned(1) ? 2 + input.getUnsigned(2) : input.getUnsigned(1);
      var l = input.getUnsigned(4);
      switch (typeId) {
        case 0:
          for (var i = 0; i <= l; i++) {
            out = grow(out, out.tell() + 2);
            out.writeUint16(icw++);
            icw &= 0xFFFF;
          }
          break;
        case 1:
          for (var i = 0; i <= l; i++) {
            out = grow(out, out.tell() + 2);
            out.writeUint16(lcw);
          }
          break;
        case 2:
          var inflags = getFlags(input, flags);
          var indata = input.getUnsigned(inb);
          var combined = combineFlags(inflags, indata);
          for (var i = 0; i <= l; i++) {
            out = grow(out, out.tell() + 2);
            out.writeUint16(combined);
          }
          break;
        case 3:
          var inflags = getFlags(input, flags);
          var indata = input.getUnsigned(inb);
          var combined = combineFlags(inflags, indata);
          for (var i = 0; i <= l; i++) {
            out = grow(out, out.tell() + 2);
            out.writeUint16(combined++);
            combined &= 0xFFFF;
          }
          break;
        case 4:
          var inflags = getFlags(input, flags);
          var indata = input.getUnsigned(inb);
          var combined = combineFlags(inflags, indata);
          for (var i = 0; i <= l; i++) {
            out = grow(out, out.tell() + 2);
            out.writeUint16(combined--);
            combined &= 0xFFFF;
          }
          break;
        case 5:
          if (l === 15) return out.slice(0, out.tell(), true);
          for (var i = 0; i <= l; i++) {
            var inflags = getFlags(input, flags);
            var indata = input.getUnsigned(inb);
            var combined = combineFlags(inflags, indata);
            out = grow(out, out.tell() + 2);
            out.writeUint16(combined);
          }
          break;
      }
    }
  }

  return compression;
})(compression || {});
