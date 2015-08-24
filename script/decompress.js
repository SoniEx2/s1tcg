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
  var liveDownload;
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
        var s = out.getBytes(out.byteLength, 0, true, true).map(ntos).join("");
        var b64 = btoa(s);
        $("#out").html(b64);
        if (liveDownload) {
          (URL || webkitURL).revokeObjectURL(liveDownload);
        }
        liveDownload = (URL || webkitURL).createObjectURL(new Blob([s]));
        var download = $("<a></a>", {
          "href": liveDownload,
          "download": selectedFile.name + ".bin",
        });
        download.append("Output (download - may not work on all browsers)");
        $("#downout").html(download);
      };
      fr.readAsArrayBuffer(selectedFile);
    });
    p.append(b);
    tag.append(p);
  }
});
