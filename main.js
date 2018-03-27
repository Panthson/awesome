$(document).ready(function(){
  $(".newspaper").click(function() {
    // createiFrame("http://www.google.com");
    createiFrame("http://www.sdsc.edu");
  });
})

function createiFrame(url){
  var frameWrapper = $("<div id='frame-wrapper'></div>")
    .click(removeiFrame)
    .appendTo("body");

  var defaultCannotLoad = $("<div></div>")
    .attr("id", "cannot-load")
    .addClass("frame")
    .addClass("cannot-load")
    .appendTo(frameWrapper)

  var loaderWrapper = $("<div>Loading...</div>")
    .addClass("loader-wrapper")
    .appendTo(defaultCannotLoad)

  var loader = $("<div></div>")
    .addClass("loader")
    .appendTo(loaderWrapper)

  var frame = $("<iframe id='frame' src=" + url + "></iframe>")
    .addClass("frame")
    .appendTo(frameWrapper);

  setTimeout(function(){
    createPopup(frameWrapper, url);
  }, 5000);
}

function createPopup(frameWrapper, url){
  var popup = $("<div></div>")
    .addClass("popup")
    .attr("title", url)
    .click(function(){
      window.open(url);
    })
    .appendTo(frameWrapper);

  //Create close button with bootstrap X icon.
  var closePopup = $("<button></button>")
    .addClass("close-button")
    .addClass("glyphicon glyphicon-remove")
    .attr("title", "Close Popup")
    .click(function(){
      event.stopPropagation();
      popup.remove()
    })
    .appendTo(popup);

  var popupText = $("<h5>If webpage doesn't load, click this popup to open the webpage in a new window</h5>")
    .attr("id", "popup-text")
    .appendTo(popup)
}

function removeiFrame(){
  $("#frame-wrapper").remove();
}
