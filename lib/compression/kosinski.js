var compression = (function(compression) {
  var grow = compression.grow;

  compression.kosdec = function kosdec(a0) {
    // TODO rewrite this so it's less ASM-y
    
    var x = 0; // eXtend flag
    var c = 0; // Carry flag
    // data registers
    var d0 = 0, d1 = 0, d2 = 0, d3 = 0, d4 = 0, d5 = 0;
    var a1 = new jDataView(16);
    // KosDec:
    d5 = a0.getUint16(undefined, true);
    d4 = 15;
    for (;;) { // Kos_Loop:
      c = d5 & 1; d5 >>= 1;
      if (--d4 === -1) {
        d5 = a0.getUint16(undefined, true);
        d4 = 15;
      }
      if (c) { // $$chkbit:
        a1 = grow(a1, a1.tell() + 1);
        a1.writeUint8(a0.getUint8());
      } else { // Kos_RLE:
        d3 = 0;
        c = d5 & 1; d5 >>= 1;
        if (--d4 === -1) {
          d5 = a0.getUint16(undefined, true);
          d4 = 15;
        }
        if (!c) { // $$chkbit:
          x = d5 & 1; d5 >>= 1;
          if (--d4 === -1) {
            d5 = a0.getUint16(undefined, true);
            d4 = 15;
          }
          // $$loop1:
          var _x = x; x = (d3 >> 15) & 1; d3 = (d3 << 1) | _x;
          x = d5 & 1; d5 >>= 1;
          if (--d4 === -1) {
            d5 = a0.getUint16(undefined, true);
            d4 = 15;
          }
          // $$loop2:
          var _x = x; x = (d3 >> 15) & 1; d3 = (d3 << 1) | _x;
          d3 += 1;
          d2 = -1;
          d2 =  (d2 & ~0xFF) | (a0.getUint8() & 0xFF);
        } else { // Kos_SeparateRLE:
          d0 = a0.getUint8();
          d1 = a0.getUint8();
          d2 = -1;
          d2 = (d2 & ~0xFF) | (d1 & 0xFF);
          d2 <<= 5;
          d2 = (d2 & ~0xFF) | (d0 & 0xFF);
          d1 &= 7;
          if (d1 !== 0) {
            d3 = (d3 & ~0xFF) | (d1 & 0xFF);
            d3++;
          } else { // Kos_SeparateRLE2:
            if ((d1 = a0.getUint8()) === 0)
              return a1;
            if (d1 === 1)
              continue;
            d3 &= ~0xFF; d3 |= d1;
          }
        }
        a1 = grow(a1, a1.tell() + 1 + d3);
        for (;;) { // Kos_RLELoop:
          var pos = a1.tell(); // getUint8 changes internal pos
          d0 = a1.getUint8(pos + (d2 << 16 >> 16)); // sign extend d2
          a1.setUint8(pos, d0);
          if (--d3 === -1)
            break;
        }
      }
    }
    return a1;
  };

  return compression;
})(compression || {});
