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

    var inline_bits = input.getInt8();
    var bitfield = (input.getUint8() << 3) % 0xFF;
    var inc_copy_w = base_tile + input.getUint16();
    var lit_copy_w = base_tile + input.getUint16();

    var data = input.getUint16();
    var shift = 0x10;

    // loc_173E:
    for (;;) {
      var hint = 7; // ???
      var adjusted_shift = shift - hint;
      var shifted_data = (data >> adjusted_shift) & 0x7F;
      var loop = shifted_data
      if (shifted_data < 64) {
        hint = 6;
        loop >>= 1;
      }
      // inlined sub_188C:
      shift -= hint;
      if (shift < 9) {
        shift += 8;
        data = (data << 8) | input.getUint8();
      }
      // loc_1758:
      loop &= 0xF;
      shifted_data >>= 4;
      //shifted_data += shifted_data;
      // we don't need the above if we don't use offsets of 2
      switch (shifted_data) {
        case 0:
        case 1:
          // loc_1768:
          for (;;) {
            out = grow(out, out.tell() + 2);
            out.writeUint16(inc_copy_w++);
            if (--loop === -1) break;
          }
          break;
        case 2:
        case 3:
          // loc_1772:
          for (;;) {
            out = grow(out, out.tell() + 2);
            out.writeUint16(lit_copy_w);
            if (--loop === -1) break;
          }
          break;
        case 7:
          // loc_17A2:
          if (loop == 0xF) {
            // inlined loc_17C4:
            input.skip(-1); // ?
            if (shift === 0x10) {
              input.skip(-1);
            }
            // loc_17CE:
            hint = input.tell();
            var c = hint & 1;
            hint >>= 1;
            if (c) {
              input.skip(1);
            }
            // loc_17D6:
            return out;
          }
        case 4:
          // loc_177A:
        case 5:
          // loc_1786:
        case 6:
          // loc_1794:
          // we did this ^ so we could inline below
          for (;;) {
            // inlined loc_17DC:
            var d3 = base_tile;
            var d1 = bitfield;
            d1 <<= 1;
            if (d1 & 0x100) {
              shift--;
              if (data & (1 << (shift & 0x1F))) {
                d3 |= 0x8000;
              }
            }
            // loc_17EE:
            d1 <<= 1;
            if (d1 & 0x100) {
              shift--;
              if (data & (1 << (shift & 0x1F))) {
                d3 += 0x4000;
              }
            }
            // loc_17FC:
            d1 <<= 1;
            if (d1 & 0x100) {
              shift--;
              if (data & (1 << (shift & 0x1F))) {
                d3 += 0x2000;
              }
            }
            // loc_180A:
            d1 <<= 1;
            if (d1 & 0x100) {
              shift--;
              if (data & (1 << (shift & 0x1F))) {
                d3 |= 0x1000;
              }
            }
            // loc_1818:
            d1 <<= 1;
            if (d1 & 0x100) {
              shift--;
              if (data & (1 << (shift & 0x1F))) {
                d3 |= 0x800;
              }
            }
            // loc_1826:
            var d1 = data;
            var d7 = shift;
            d7 -= inline_bits;
            if (d7 < 0) {
              shift = d7;
              shift += 0x10;
              d7 = -d7;
              d1 <<= d7 & 63;
              var pos = input.tell();
              data = (data & ~0xFF) | input.getUint8();
              input.seek(pos);
              // TODO rotate left data by d7
              d7 &= 0x7FFF;
              data &= lookup_table[d7-1];
              d1 += data;
              // loc_1844:
              hint = inline_bits;
              hint &= 0x7FFF;
              d1 &= lookup_table[hint - 1];
              d1 += d3;
              data = input.getUint16();
            } else {
              // loc_1856:
              if (d7) {
                d1 >>= d7 & 63;
                hint = inline_bits;
                hint &= 0x7FFF;
                d1 &= lookup_table[hint - 1];
                d1 += d3;
                hint = inline_bits;
                // inlined sub_188C:
                shift -= hint;
                if (shift < 9) {
                  shift += 8;
                  data = (data << 8) | input.getUint8();
                }
              } else {
                // loc_1868:
                shift = 0x10;
                // inlined loc_1844:
                hint = inline_bits;
                hint &= 0x7FFF;
                d1 &= lookup_table[hint - 1];
                d1 += d3;
                data = input.getUint16();
              }
            }
            // end of inlined loc_17DC
            switch (shifted_data) {
              case 4:
                // loc_177E:
                for (;;) {
                  out = grow(out, out.tell() + 2);
                  out.writeUint16(d1);
                  if (--loop === -1) break;
                }
                break;
              case 5:
                // loc_178A:
                for (;;) {
                  out = grow(out, out.tell() + 2);
                  out.writeUint16(d1++);
                  if (--loop === -1) break;
                }
                break;
              case 6:
                // loc_1798:
                for (;;) {
                  out = grow(out, out.tell() + 2);
                  out.writeUint16(d1--);
                  if (--loop === -1) break;
                }
                break;
              case 7:
                // loc_17A8:
                out = grow(out, out.tell() + 2);
                out.writeUint16(d1);
                if (--loop === -1) break;
              default:
                return null;
            }
            if (shifted_data != 7 || loop === -1) break;
          }
        default:
          return null; // crash
      }
    }
  }

  compression.enidec = function(input) {
    var out = new jDataView(16);
    enidec_internal(input, 0, out);
    return out;
  }

  return compression;
})(compression || {});
