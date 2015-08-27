"use strict";

var compression = (function (compression) {
  function build_code_table(input) {
    var code_table = new jDataView(0x200);
    var data = input.getUint8();

    for (;;) {
      if (data === 0xFF) return code_table;
      var pindex = data;

      for (;;) {
        data = input.getUint8();
        if (data >= 0x80) break;
        var repcount = data;
        pindex &= 0xF;
        repcount &= 0x70;
        pindex |= repcount;
        var codelen = (data &= 0xF);
        pindex |= codelen << 8;
        var code = input.getUint8();
        if (8 === data) {
          code += code;
          code_table.setUint16(code, pindex);
          continue;
        } else {
          code <<= 8-data;
          code += code;
          var count = (1 << (8-data)) - 1;
          for (;;) {
            code_table.setUint16(code, pindex);
            code += 2;
            if (--count === -1) break;
          }
        }
      }
    }
    return code_table;
  }

  function process_compressed_data(input, ct, rows) {
    var xor = false;
    var last = 0; // used when xor is true
    if (rows < 0) { xor = true; rows = rows & 0x7FFF;}
    rows <<= 1;
    var out = new jDataView(rows * 0x20);
    rows <<= 2;
    var rn = 8; // nybble counter
    var ac = 0; // accumulator
    var shift = 0x10;
    var data = input.getUint8();
    data <<= 8;
    data |= input.getUint8();
    var shifted_data = data;
    for (;;) {
      shifted_data >>>= shift-8;
      if (shifted_data >= 0xFC) { // 0b11111100
        // Nem_PCD_InlineData:
        shift -= 6;
        if (shift < 9) {
          shift += 8;
          data <<= 8;
          data |= input.getUint8();
        }
        shift -= 7;
        shifted_data = data;
        shifted_data >>>= shift;
        var lo = shifted_data & 0xF;
        var hi = shifted_data & 0xF0;
        if (shift < 9) {
          shift += 8;
          data <<= 8;
          data |= input.getUint8();
        }
      } else {
        shifted_data &= 0xFF;
        shifted_data += shifted_data;
        var len = ct.getInt8(shifted_data);
        shift -= len;
        if (shift < 9) {
          shift += 8;
          data <<= 8;
          data |= input.getUint8();
        }
        shifted_data = (shifted_data & ~0xFF) | ct.getUint8(shifted_data + 1);
        var lo = shifted_data & 0xF;
        var hi = shifted_data & 0xF0;
      }
      // Nem_PCD_GetRepeatCount:
      hi >>>= 4;
      for (;;) {
        ac <<= 4;
        ac |= lo;
        if (--rn === 0) {
          if (xor) {
            out.writeUint32(last ^= ac);
          } else {
            out.writeUint32(ac);
          }
          if (!--rows) return out;
          ac = 0;
          rn = 8;
        }
        if (--hi === -1) {
          //return process_compressed_data(input, data, shift, ct, ac, rn, xor);
          break;
        }
      } // WritePixel loop
    } // PCD loop
  }

  compression.nemdec = function nemdec(input) {
    var rows = input.getInt16();
    var code_table = build_code_table(input);
    return process_compressed_data(input, code_table, rows);
  }

  return compression;
})(compression)
