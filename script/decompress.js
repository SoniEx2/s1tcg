"use strict";

var ntos_map = "";

for (var i = 0; i < 256; i++) {
  ntos_map += String.fromCharCode(i);
}

function ntos(n) {
  return ntos_map[n];
}

var decompressors = {
  "Kosinski": compression.kosdec
}

$("document").ready(function() {
  var tag = $("#decompressors");
  for (var d in decompressors) {
    var p = $("<p></p>");
    var i = $("<input>", {"type": "file", "id": d});
    p.append(i);
    var b = $("<a></a>");
    b.append(d);
    var f = decompressors[d];
    b.click(function() {
      var selectedFile = document.getElementById(d).files[0];
      var fr = new FileReader();
      fr.onload = function(fd) {
        var dataView = new jDataView(fd.target.result);
        var out = f(dataView);
        $("#out").html(btoa(out.getBytes(out.tell(), 0, true, true).map(ntos).join("")));
      };
      fr.readAsArrayBuffer(selectedFile);
    });
    p.append(b);
    tag.append(p);
  }
});
