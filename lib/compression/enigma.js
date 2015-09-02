"use strict";

var compression = (function(compression) {
  var grow = compression.grow;

  // table of 2^n-1's used by enigma decompressor
  var lookup_table = [
    0x0001, 0x0003, 0x0007, 0x000F,
    0x001F, 0x003F, 0x007F, 0x00FF,
    0x01FF, 0x03FF, 0x07FF, 0x0FFF,
    0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF
  ]

  function enidec_internal(input, base_tile, out) {

    var inline_bits = input.getInt8() & 0xFFFF;
    var bitfield = (input.getUint8() << 3) & 0xFF;
    var inc_copy_w = (base_tile + input.getUint16()) & 0xFFFF;
    var lit_copy_w = (base_tile + input.getUint16()) & 0xFFFF;

    var data = input.getUint16();
    var shift = 16;

    // EniDec_Loop:
    for (;;) {
      var at_once = 7; // ???
      var adjusted_shift = shift - at_once;
      var shifted_data = (data >> adjusted_shift) & 0x7F; // TODO m68k vs JS
      var loop = shifted_data;
      if (shifted_data < 0x40) {
        at_once = 6;
        loop >>= 1;
      }
      // inlined EniDec_ChkGetNextByte:
      shift -= at_once;
      if (shift < 9) {
        shift += 8;
        data = ((data << 8) | input.getUint8()) & 0xFFFF;
      }
      // loc_1758:
      loop &= 0xF;
      shifted_data >>= 4;
      //shifted_data += shifted_data;
      // we don't need the above if we don't use offsets of 2
      switch (shifted_data) {
        case 0:
        case 1:
          // EniDec_Sub0:
          for (;;) {
            out = grow(out, out.tell() + 2); // make sure we have space
            out.writeUint16(inc_copy_w++); // write, then increment
            inc_copy_w &= 0xFFFF;
            if (--loop === -1) break; // repeat
          }
          break;
        case 2:
        case 3:
          // EniDec_Sub4:
          for (;;) {
            out = grow(out, out.tell() + 2);
            out.writeUint16(lit_copy_w);
            if (--loop === -1) break;
          }
          break;
        case 7:
          // EniDec_SubE: (tweaked)
          if (loop == 0xF) {
            // inlined loc_17C4:
            // aka EniDec_End:
            return out;
          }
        case 4:
          // EniDec_Sub8:
        case 5:
          // EniDec_SubA:
        case 6:
          // EniDec_SubC:
          // we did this ^ so we could inline below
          for (;;) { // only loops if case = 7
            // inlined EniDec_GetInlineCopyVal:
            var tile = base_tile;
            if (bitfield & 0x80) {
              if (data & (1 << (--shift & 0x1F))) {
                tile |= 0x8000; // hipriority
              }
            }
            if (bitfield & 0x40) {
              if (data & (1 << (--shift & 0x1F))) {
                tile += 0x4000; // palline2
              }
            }
            if (bitfield & 0x20) {
              if (data & (1 << (--shift & 0x1F))) {
                tile += 0x2000; // palline1
              }
            }
            if (bitfield & 0x10) {
              if (data & (1 << (--shift & 0x1F))) {
                tile |= 0x1000; // yflip
              }
            }
            if (bitfield & 0x8) {
              if (data & (1 << (--shift & 0x1F))) {
                tile |= 0x800; // xflip
              }
            }
            tile &= 0xFFFF;
            var d1 = data;
            var d7 = shift;
            d7 -= inline_bits;
            if (d7 < 0) {
              shift = d7;
              shift += 0x10;
              shift &= 0xFFFF;
              d7 = -d7;
              d1 <<= d7; // TODO fix this (modulo 64 (68k) vs modulo 32 (JS))
              d1 &= 0xFFFF;
              var pos = input.tell();
              var byte = input.getUint8();
              input.seek(pos);
              // TODO rotate left data by d7
              //data = (data & 0xFF00) | ((data << d7) | (data >> d7))
              byte = (byte << (d7 & 7)) | (byte >> ((-d7) & 7));
              // TODO test this
              data = (data & 0xFF00) | (byte & 0xFF);
              d7 &= 0x7FFF;
              data &= lookup_table[d7-1];
              d1 += data;
              // not needed because we use the lookup table below
              // d1 &= 0xFFFF;
              // loc_1844:
              d1 &= lookup_table[(inline_bits & 0x7FFF) - 1];
              d1 += tile;
              d1 &= 0xFFFF;
              data = input.getUint16();
            } else {
              // loc_1856:
              if (d7) {
                d1 >>= d7 & 63;
                d1 &= lookup_table[(inline_bits & 0x7FFF) - 1];
                d1 += tile;
                d1 &= 0xFFFF;
                // inlined sub_188C:
                shift -= inline_bits;
                if (shift < 9) {
                  shift += 8;
                  data = ((data << 8) | input.getUint8()) & 0xFFFF;
                }
              } else {
                // loc_1868:
                shift = 0x10;
                // inlined loc_1844:
                d1 &= lookup_table[(inline_bits & 0x7FFF) - 1];
                d1 += tile;
                d1 &= 0xFFFF;
                data = input.getUint16();
              }
            }
            // end of inlined loc_17DC
            switch (shifted_data) {
              case 4:
                // EniDec_Sub8:
                for (;;) {
                  out = grow(out, out.tell() + 2);
                  out.writeUint16(d1);
                  if (--loop === -1) break;
                }
                break;
              case 5:
                // EniDec_SubA:
                for (;;) {
                  out = grow(out, out.tell() + 2);
                  out.writeUint16(d1++);
                  d1 &= 0xFFFF;
                  if (--loop === -1) break;
                }
                break;
              case 6:
                // EniDec_SubC:
                for (;;) {
                  out = grow(out, out.tell() + 2);
                  out.writeUint16(d1--);
                  d1 &= 0xFFFF;
                  if (--loop === -1) break;
                }
                break;
              case 7:
                // EniDec_SubE:
                out = grow(out, out.tell() + 2);
                out.writeUint16(d1);
                loop--;
                break;
              default:
                return null;
            }
            if (shifted_data !== 7 || loop === -1) break;
          }
          break;
        default:
          return null; // crash
      }
    }
  }

  compression.enidec = function(input) {
    input = grow(input, input.byteLength + 1); // hack??? pad input file to avoid overrun
    var out = enidec_internal(input, 0, new jDataView(16));
    return out.slice(0, out.tell(), true);
  }

  return compression;
})(compression || {});
