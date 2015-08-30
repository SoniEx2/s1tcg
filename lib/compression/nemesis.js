"use strict";

var compression = (function (compression) {
  function build_code_table(input) {
    var code_table = new jDataView(0x200);
    var data = input.getUint8();

    while (data !== 0xFF) {
      var pindex = data;

      while ((data = input.getUint8()) < 0x80) {
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
        } else {
          var shift = 8-data;
          code <<= shift;
          code += code;
          for (var count = (1 << shift) - 1; count !== -1; --count) {
            code_table.setUint16(code, pindex);
            code += 2;
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
    var out = new jDataView(rows * 0x20);
    rows <<= 3;
    rows &= 0xFFFF;
    var rn = 8; // nybble counter
    var ac = 0; // accumulator
    var shift = 0x10;
    var data = input.getUint16();
    for (;;) { // Nem_Process_Compressed_Data:
      var shifted_data = data >>> shift-8;
      var lo = 0;
      var hi = 0;
      if ((shifted_data & 0xFF) < 0xFC) { // 0b11111100
        shifted_data &= 0xFF;
        shifted_data += shifted_data;
        /*
        TODO check:
        move.b	(CODE_TABLE,SHIFTED_DATA.w),LEN	; get the length of the code in bits
    		ext.w	LEN
    		sub.w	LEN,SHIFT	; subtract from shift value so that the next code is read next time around
        */
        var len = ct.getInt8(shifted_data);
        shift -= len;
        if (shift < 9) {
          shift += 8;
          data <<= 8;
          data |= input.getUint8();
        }
        // +
        hi = lo = ct.getUint8(shifted_data + 1);
        lo &= 0xF;
        hi &= 0xF0;
      } else {
        // Nem_PCD_InlineData:
        shift -= 6;
        if (shift < 9) {
          shift += 8;
          data <<= 8;
          data |= input.getUint8();
        }
        // +
        shift -= 7;
        shifted_data = data;
        shifted_data >>>= shift;
        hi = lo = shifted_data;
        lo &= 0xF;
        hi &= 0x70;
        if (shift < 9) {
          shift += 8;
          data <<= 8;
          data |= input.getUint8();
        }
      }
      // Nem_PCD_GetRepeatCount:
      hi >>>= 4;
      // Nem_PCD_WritePixel:
      for (;;) {
        ac <<= 4;
        ac |= lo;
        if (--rn === 0) {
          // Nem_PCD_WriteRowToRAM:/Nem_PCD_WriteRowToRAM_XOR:
          if (xor) {
            out.writeUint32(last ^= ac);
          } else {
            out.writeUint32(ac);
          }
          if (!--rows) return out;
          // Nem_PCD_NewRow:
          ac = 0;
          rn = 8;
        }
        // Nem_PCD_WritePixel_Loop:
        if (--hi === -1) {
          //return process_compressed_data(input, data, shift, ct, ac, rn, xor);
          break; // breaks WritePixel loop and goes into PCD loop
        }
      } // WritePixel loop
    } // PCD loop
    return out;
  }

  compression.nemdec = function nemdec(input) {
    var rows = input.getInt16();
    var code_table = build_code_table(input);
    return process_compressed_data(input, code_table, rows);
  }

  return compression;
})(compression)
