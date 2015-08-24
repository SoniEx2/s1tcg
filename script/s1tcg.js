"use strict";

function s1tcg_sprite_size(width, height) {
  return ((width & 3) << 2) | (height & 3); // 00,00 is 1x1. 11,11 is 4x4, this goes from 0 to 15 aka 0x0 to 0xF
}

function make_letter(sprite_index, width, height, l) {
  var proper_width = (((width | 0) / 8) | 0) & 3;
  var proper_height = (((height | 0) / 8) | 0) & 3;
  return {
    "width": proper_width - 1,
    "height": proper_height - 1,
    "pixwidth": proper_width * 8,
    "pixheight": proper_height * 8,
    "sprite": sprite_index,
    "spritecount": proper_width * proper_height,
    "letter": l
  };
}

var titlecard_data = {
  "names": {
    "GREEN HILL": "byte_C9FE",
    "LABYRINTH": "byte_CA2C",
    "MARBLE": "byte_CA5A",
    "STAR LIGHT": "byte_CA7A",
    "SPRING YARD": "byte_CAA8",
    "SCRAP BRAIN": "byte_CADC",
    "ZONE": "byte_CB10",
    "FINAL": "byte_CB8A"
  },
  "letters": {
    "A": make_letter( 0, 16, 16, "A"),
    "B": make_letter( 4, 16, 16, "B"),
    "C": make_letter( 8, 16, 16, "C"),
    "D": make_letter(12, 16, 16, "D"),
    "E": make_letter(16, 16, 16, "E"),
    "F": make_letter(20, 16, 16, "F"),
    "G": make_letter(24, 16, 16, "G"),
    "H": make_letter(28, 16, 16, "H"),
    "I": make_letter(32,  8, 16, "I"), // I is only 8x16
    // unknown: sprite index 34[+4] ($22)
    "L": make_letter(38, 16, 16, "L"),
    "M": make_letter(42, 16, 16, "M"),
    "N": make_letter(46, 16, 16, "N"),
    "O": make_letter(50, 16, 16, "O"),
    "P": make_letter(54, 16, 16, "P"),
    // missing Q
    "R": make_letter(58, 16, 16, "R"),
    "S": make_letter(62, 16, 16, "S"),
    "T": make_letter(66, 16, 16, "T"),
    // unknown: sprite number 70[+4] ($46)
    "Y": make_letter(74, 16, 16, "Y"),
    "Z": make_letter(78, 16, 16, "Z")
  }
}

function make_titlecard_start(name, count, description) {
  var strcount = String(count & 255);
  var pad = strcount.length < 3 ? strcount.length < 2 ? "  " : " " : "";
  return name + ":\tdc.b " + strcount + pad + "\t\t; " + description;
}

// argument order as seen on the disassembly (except for split width+height)
function make_titlecard_line(vertical_position, width, height, flags, sprite_index, horizontal_position, letter) {
  var vpos = "$" + (vertical_position & 255).toString(16);
  // sprite size. not to be confused with special stage.
  var ss = String(s1tcg_sprite_size(width | 0, height | 0));
  var spi = "$" + (sprite_index & 255).toString(16);
  var hpos = "$" + (horizontal_position & 255).toString(16);
  if (vpos.length < 3) vpos = " " + vpos;
  if (spi.length < 3) spi = " " + spi;
  if (hpos.length < 3) hpos = " " + hpos;
  return "\t\tdc.b " + vpos + ", " + ss + ", " + String(flags & 255) + ", " + spi + ", " + hpos + "\t; " + letter;
}

function make_titlecard_end() {
  return "\t\teven";
}

function make_titlecard(name, text, xpos, ypos) {
  var letters = [];
  var sprites = 0;
  for (var i in text) {
    var c = text[i];
    if (titlecard_data.letters[c] != null) {
      letters.push(titlecard_data.letters[c]);
      sprites++;
    } else {
      letters.push(null);
    }
  }
  var out = [];
  out.push(make_titlecard_start(titlecard_data.names[name], sprites, name + " | " + text));
  for (var i in letters) {
    var l = letters[i];
    if (l != null) {
      out.push(make_titlecard_line(ypos, l.width, l.height, 0, l.sprite, xpos, l.letter));
      xpos += l.pixwidth;
    } else {
      out.push("\t\t; Space");
      xpos += 16;
    }
  }
  out.push(make_titlecard_end());
  return out;
}

function update_code() {
  $("#out").html(make_titlecard($("#names").val(), $("#text").val(), parseInt($("#xpos").val(), 16), parseInt($("#ypos").val(), 16)).join("\n"));
}

$("document").ready(function() {
  var dropdown = $('<select id="names" name="names"></select>');
  for (var n in titlecard_data.names) {
    var opt = $('<option>', {"value": n});
    opt.html(n + " (" + titlecard_data.names[n] + ")");
    dropdown.append(opt);
  }
  $("#selection").append(dropdown);
  dropdown.change(update_code);
  $("#text").change(update_code);
  $("#xpos").change(update_code);
  $("#ypos").change(update_code);
  update_code();
});
