$(document).ready(function(){
  $(".newspaper").click(function() {
    createiFrame("http://www.google.com");
    // createiFrame("http://www.sdsc.edu");
  });
})

function createiFrame(url){
  var frameWrapper = $("<div id='frame-wrapper'></div>")
    .click(removeiFrame)
    .appendTo("body");

  var defaultCannotLoad = $("<div>Loading.</div>")
    .attr("id", "cannot-load")
    .addClass("frame")
    .addClass("cannot-load")
    .appendTo(frameWrapper)

  var frame = $("<iframe id='frame' src=" + url + "></iframe>")
    .addClass("frame")
    .appendTo(frameWrapper);

  defaultInterval();
}

function defaultInterval(){
  var interval = setInterval(changeDefaultHTML, 1000);
  setTimeout(function(){
    $("#cannot-load").html("Cannot Load");
    clearInterval(interval);
  }, 6000);
}

function changeDefaultHTML(){
  var defaultScreen = $("#cannot-load")
  if(defaultScreen.html() === "Loading..."){
    defaultScreen.html("Loading.")
    return;
  }

  var html = defaultScreen.html()
  defaultScreen.html(html + ".")
}

function removeiFrame(){
  $("#frame-wrapper").remove();
}
