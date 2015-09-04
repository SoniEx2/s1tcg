"use strict";

/*
Kosinski Decompressor v2
*/

var compression = (function(compression) {
  var grow = compression.grow;

  function descriptionReader(input) {
    var desc = input.getUint16(undefined, true);
    var i = 1;
    return function(bits) {
      var ac = 0;
      for (var j = 0; j < bits; j++) {
        ac |= (+!!(desc & i)) << j;
        if ((i <<= 1) === 0x10000) {
          desc = input.getUint16(undefined, true)
          i = 1;
        }
      }
      return ac;
    }
  }

  compression.kosdec = function kosdec(input) {
    var out = new jDataView(16);
    var getDesc = descriptionReader(input);
    for (;;) {
      for (var i = 0; i < 0x8000; i <<= 1) {
        if (getDesc(1)) { // 0b1
          out = grow(out, out.tell() + 1);
          out.writeUint8(input.getUint8());
          continue;
        } else if (getDesc(1)) { // 0b01
          var lo = input.getUint8();
          var hi = input.getUnsigned(5);
          var off = (~0x1FFF) | (hi << 8) | lo;
          var count = input.getUnsigned(3) + 2;
          if (count === 2) {
            count = input.getUint8() + 1;
            if (count === 1) {
              return out.slice(0, out.tell(), true);
            } else if (count === 2) {
              getDesc = descriptionReader(input);
            }
          }
        } else { // 0b00
          var count = getDesc(2) + 2;
          var off = (~0xFF) | input.getUint8();
        }
        var pos = out.tell();
        var max = pos + count;
        out = grow(out, max);
        for (; pos < max; pos++) {
          out.setUint8(pos, out.getUint8(pos + off));
        }
      }
    }
  };

  return compression;
})(compression || {});
