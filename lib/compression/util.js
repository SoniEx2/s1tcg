"use strict";

var compression = (function(compression) {
  compression.grow = function grow(buffer, size) {
    if (buffer.byteLength >= size) return buffer;
    var l = buffer.byteLength;
    while (l < size) {
      l *= 2;
    }
    var nb = new jDataView(l);
    var pos = buffer.tell(); // loop below changes internal position
    for (var i = 0; i < buffer.byteLength; i++) {
      nb.setUint8(i, buffer.getUint8(i));
    }
    nb.seek(pos);
    return nb;
  };

  return compression;
})(compression || {});
