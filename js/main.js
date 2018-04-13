const WORD_MAX = 10;
const RAND_DOC_LENGTH = 1000;

var docResults, docIndex = 0;
$(document).ready(function(){
  loadGrammar()
  .then(setupInputBarFiringMethods)

  $("#rarrow").click(function(){
    if(docIndex === docResults.length - 1)
      return;
    docIndex++;
    destroyDocumentPanel();
  });

  $("#larrow").click(function(){
    if(docIndex === 0)
      return;
    docIndex--;
    destroyDocumentPanel();
  });

  $(document).on('click', function(){
    $("#predictedSearchList").hide();
  })

  createChart();
  getInitialData()
  .then(loadData);
});

function loadGrammar(){
  return new Promise((resolve, reject) => {
    $.get( "data/grammar.pegjs", function( grammar ) {
      parser = peg.generate(grammar);
      resolve();
    });
  });
}

function setupInputBarFiringMethods(){
  $("#search-bar").focusin(function(e){
    $(this).parent().removeClass('searchNoFocus');
    $(this).parent().addClass('searchHasFocus');
    if($("#predictedSearchList").children().length)
      $("#predictedSearchList").show();
    e.stopPropagation();
  });

  $("#search-bar").click(function(e){
    e.stopPropagation();
    if($("#predictedSearchList").children().length)
      $("#predictedSearchList").show();
  });

  $("#search-bar").focusout(function(){
    $(this).parent().addClass('searchNoFocus');
    $(this).parent().removeClass('searchHasFocus');
  });

  $("#search-bar").keyup(function(e){
    $(this).parent().removeClass('searchHasError');
    if(e.which === 13)
      onSearch($(this).val().trim());
    else
      autoComplete($(this).val().trim());
  });
}


const SEARCHABLE_KEYS = ['title', 'text', 'newspaper'];

function isAlphaNumeric(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }
  return true;
};

function simpleSearch(text){
  text = text.replace(/,/g , "");
  text = text.split(/\s+/);
  if(!text)
    return false;

  if(!isAlphaNumeric(text.join('')))
    return false;



  text = SEARCHABLE_KEYS.map(function(kval, i){
    //all text pieces must be in at least one of these values
    var keyValue = text.map(function(vval, j){
      return "(" + kval + ":" + vval + ")";
    });

    return "(" + keyValue.join(" AND ") + ")";
  });

  text = text.join(" OR ");
  submitQuery(text);
  $("#predictedSearchList").hide();

  return true;
}

function onSearch(qString){
  if(!qString)
    return;

  if(simpleSearch(qString))
    return;

  var _text, text = '';
  try{
    pObj = parser.parse(qString);
    if(pObj['_text']){
      _text = pObj['_text'];
      delete pObj['_text'];
    }
    keys = Object.keys(pObj);
    

    for(var i = 0; i < keys.length; i++){
      if(SEARCHABLE_KEYS.indexOf(keys[i]) === -1)
          throw keys[i] + ' is not a searchable column';
    }

    for(var i = 0; i < keys.length; i++)
      text += keys[i] + ":" + pObj[keys[i]] + " ";

    var allSearchText = '';
    if(_text){
      $.each(SEARCHABLE_KEYS, function(i, key){
        if(allSearchText)
          allSearchText += "OR ";
        allSearchText += key + ":" + _text + " ";
        if(keys.indexOf(key) === -1)
          keys.push(key);
      });
    }
    
    if(text && allSearchText){
        text += ' (' + allSearchText + ')';
    }else if(allSearchText){
        text = allSearchText;
    }
  }catch(e){
      console.log(e);
      $("#search-bar").parent().addClass("searchHasError");
      return;
  }

  $("#predictedSearchList").hide();
  submitQuery(text);
}

var queryPending = false;
var queryHash = {};
function submitQuery(text){
  queryPending = true;
  $(".moduleLoader").show();
  var p;
  if(queryHash[text])
    p = Promise.resolve(queryHash[text]);
  else
    p = Promise.resolve(getRandomData());
  p.then(function(data){
    queryHash[text] = data;

    return new Promise(function(resolve, reject){
      setTimeout(resolve, 3000);
    })
    .then(function(){
      queryPending = false;
      loadData(data);
    });
  });
}

var predictedWordsHash = {};
function getPredictedWords(text){
  if(predictedWordsHash[text])
    return Promise.resolve(predictedWordsHash[text]);

  var list = [];
  var predicted_word, category, topics;
  for(var i = 0; i < 10; i++){
    predicted_word = text + gibberish(i);
    category = gibberish(10);
    topics = [gibberish(10), gibberish(10)]
    list.push({
      predicted_word: predicted_word,
      category: category,
      topics: topics
    });
  }

  predictedWordsHash[text] = list;
  return new Promise(function(resolve, reject){
    setTimeout(resolve, 700);
  }).then(function(){
    return list;
  })
}

function autoComplete(text){
  if(!text)
    return $("#predictedSearchList").hide();

  text = text.split(/\s+/);
  if(!text)
    return $("#predictedSearchList").hide();

  if(!isAlphaNumeric(text.join('')))
    return $("#predictedSearchList").hide();
  text = text.join('');

  getPredictedWords(text)
  .then(function(words){
    $("#predictedSearchList").empty();
    if($("#search-bar").is(":focus") && !queryPending)
      $("#predictedSearchList").show();

    var li, span;
    $.each(words, function(i, val){
      li = $("<li>");
      
      span = $("<span>");
      span.text(val.predicted_word);
      span.addClass('predicted_word');
      li.append(span);

      span = $("<span>");
      span.text(val.category);
      span.addClass('predicted_type');
      li.append(span);

      for(var i = 0; i < val.topics.length; i++){
        span = $("<span>");
        span.text(val.topics[i]);
        span.addClass('predicted_topic');
        li.append(span);
      }    

      li.click(function(e){
        e.stopPropagation();
        $("#search-bar").val(val.predicted_word);
        $("#predictedSearchList").hide();
        onSearch(val.predicted_word);
      });

      li.appendTo($("#predictedSearchList"));
    });
  }).catch(console.log);
}

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
    .addClass("frameLoader")
    .appendTo(loaderWrapper)

  var frame = $("<iframe id='frame' src=" + url + "></iframe>")
    .addClass("frame")
    .appendTo(frameWrapper);

  setTimeout(function(){
    createPopup(frameWrapper, url);
  }, 3000);
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


function color_generator(style,range,number) {
    var color = [];
    for(var i=0; i < number; i++){
        color.push(colorbrewer[style][range][i%range])
    }
    return color;
}

var histogramDataSet = {
    labels: [],
    datasets: [{
        label: 'words',
        backgroundColor: color_generator("Pastel2",8, WORD_MAX),
        //data: [{text: 'hi', size: 30}, {text: 'yo', size: 40}]
        data: []
    }]
};

var histogram;

function createChart(){
  histogram = new Chart('histogram', {
          responsive: true,
          maintainAspectRatio: false,
      type: 'horizontalBar',
      data: histogramDataSet,
      options: {
          // Elements options apply to all of the options unless overridden in a dataset
          // In this case, we are setting the border of each horizontal bar to be 2px wide
          elements: {
              rectangle: {
                  borderWidth: 2,
              }
          },
          events: ['mousemove','click'],
          responsive: true,
          maintainAspectRatio: false,
          legend: {
              display: false,
          },
          title: {
              display: true,
              text: 'Words Horizontal'
          },
          tooltips: {
              mode: 'point',
              intersect: true
          },
          hover:{
              mode: 'point',
              intersect: true
          },
          scales: {
              xAxes: [{
                  gridLines: {
                      display: true,
                  },
                  ticks: {
                      fontColor: "#000", // this here
                      beginAtZero : true
                  },
              }],
              yAxes: [{
                  //display: false,
                  gridLines: {
                      display: false,
                  },
                  ticks: {
                      fontColor : "#000", // this here
                  },
              }],
          },
          onClick : function (evt, item) {
              //var activePoints = myHorizontalBar.getElementsAtEvent(evt);
              if(item.length > 0)
              {
                  //get the internal index of slice in pie chart
                  var clickedElementindex = item[0]["_index"];
                  //get specific label by index
                  var bar_last_clicked = histogramDataSet.labels[clickedElementindex];

                  getAssociatedDocuments(bar_last_clicked)
                  .then(function(docs){
                    pushTerm(bar_last_clicked, docs);
                  }).catch(console.log);
              }
          }
      }
  });
}

var filterWords = {};

function pushTerm(word, docs){
  if(filterWords[word]){
    $("#filterWord" + word).click();
    return;
  }
  filterWords[word] = docs;

  var wrapper = $("<div>").addClass('filterWordWrapper');
  var text = $("<span>").addClass('filterWordText').text(word);
  var closeButtton = $("<i>").addClass('fas fa-times wordClose');

  wrapper.attr('id', "filterWord" + word);
  wrapper.append(text);
  wrapper.append(closeButtton);

  wrapper.click(function(){
    delete filterWords[word];
    $(this).remove();
    refreshDocuments();
  });

  $("#histograph-filter-wrapper").append(wrapper);
  refreshDocuments();
}

function slowShowDocuments(docList){
  var ret = '';
  $.each(docList, function(i, val){
    if(i)
      ret += ", ";
    ret += "#doc" + val;
  });
  $(ret).slideDown( "slow" );
}

function slowHideDocuments(docList){
  var ret = '';
  $.each(docList, function(i, val){
    if(i)
      ret += ", ";
    ret += "#doc" + val;
  });
  $(ret).slideUp( "slow" );
}

function updateHistogram(words){
  $("#histogramLoader").hide();
  var labels = Object.keys(words).sort(function(a, b){
    return words[b] - words[a];
  });
  var data = [];
  $.each(labels, function(i, val){
    data.push(words[val]);
  });
  histogramDataSet.labels = labels;
  histogramDataSet.datasets[0].data = data;
  histogram.update();
}

function gibberish(text_len){
  var text = "";

  var possible;
  for(var i = 0; i < text_len; i++){
    if(i === text_len - 1)
      possible = "abcdefghijklmnopqrstuvwxyz";
    else
      possible = "ABCD EFGHIJ KLMNOPQR STUVWXYZ abcdefghij klmnopqr stuvwxyz abcdefghij klmnopqr stuvwxyz ";
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getRandomDate(){
  var start = new Date(2018, 0, 1);
  var end = new Date(2018, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomDocument(){
  var doc = {};
  doc.date = getRandomDate();
  doc.subtext = gibberish(150);
  doc.docID = getRandomInt(RAND_DOC_LENGTH ** 4);
  doc.title = gibberish(15);


  if(Math.random() >= 0.5){
    doc.newspaper = "Google Inc";
    doc.url = "https://www.google.com";
  }else{
    doc.newspaper = "San Diego Supercomputer Center";
    doc.url = "http://www.sdsc.edu";
  }

  return doc;
}

function getInitialData(){
  return Promise.resolve(getRandomData());
}

function getRandomData(){
  var initData = {
    histogram : {
      alfa : 10,
      bravo : 45,
      charlie : 39,
      delta : 8,
      echo : 46,
      frank : 8,
      golf : 11,
      hotel : 29
    },
    documents:[]
  };

  for(var i = 0; i < RAND_DOC_LENGTH; i++){
    initData.documents.push(getRandomDocument());
  }
  return initData;
}

var wordHash = [];
function getAssociatedDocuments(word){
  if(wordHash[word])
    return Promise.resolve(wordHash[word]);

  var ret = [];
  $.each(docResults, function(i, val){
    $.each(val, function(j, val){
      if(Math.random() < 0.6){
        ret.push(val.docID);
      }
    });
  });

  wordHash[word] = ret;

  return Promise.resolve(wordHash[word]);
}

function loadData(data){
  updateHistogram(data.histogram);
  updateDocuments(data.documents);
}

function daysInMonth (month, year) {
  console.log(month, year, new Date(year, month, 0).getDate());
  return new Date(year, month, 0).getDate();
}

function monthFrom(d, months){
  if(!months && months !== 0)
    months = 1;
  d = new Date(d);

  var originalYear = d.getUTCFullYear();
  var originalMonth = d.getMonth();

  d.setDate(daysInMonth(originalMonth, originalYear));
  return d;
}

function updateDocuments(documents){
  $("#newspaperLoader").hide();
  documents.sort(function(a, b){
    return a.date - b.date;
  });

  var currentMonth = documents[0].date.getMonth();
  var index = 0;
  docResults = [[]];
  $.each(documents, function(i, d){
    if(d.date.getMonth() > currentMonth){
      index++;
      docResults.push([]);
      currentMonth = d.date.getMonth();
    }
    docResults[index].push(d);
  });
  docIndex = 0;
  destroyDocumentPanel();
}

function isVisible(d){
  if($.isEmptyObject(filterWords))
    return true;

  var clickedWords = Object.keys(filterWords);
  var lists = clickedWords.map(function(val, i){
    return filterWords[val].indexOf(d.docID) !== -1;
  });//returns an array of whether each word had the doc id
  //only need one to say its visible
  return lists.reduce(function(current, next){ return current && next; });
}

function refreshDocuments(){
  var vDocuments = docResults[docIndex];
  $.each(vDocuments, function(i, d){
    refreshDocument(d);
  });
}

function refreshDocument(d){
  var panel = $("#doc" + d.docID);
  var existed = !!panel.length;
  if(!existed)
    panel = createDocument(d);

  var visible = panel.is(':visible');
  var supposedToBeVisible = isVisible(d);

  if(existed){
    if(visible && !supposedToBeVisible){
      panel.slideUp();
    }else if(!visible && supposedToBeVisible){
      panel.slideDown();
    }
  }else{
    if(visible && !supposedToBeVisible){
      panel.hide();
    }else if(!visible && supposedToBeVisible){
      panel.show();
    }
  }
}

function createDocument(d){
  var li = $("<li>").addClass('newspaper');
  var title = $("<h3>").addClass('std-margin newspaper-header').text(d.title);
  var subHeading = $("<span>").addClass("std-margin newspaper-subheading");
  var subtext = $("<p>").addClass('std-margin newspaper-content').text(d.subtext).hide();
  var arrow = $("<i>").addClass('fas fa-angle-down newspaper-expander');

  var subHeadingText = d.newspaper + ' \u00B7 ' + d.date.toLocaleDateString();
  subHeading.text(subHeadingText);

  li.attr('id', 'doc' + d.docID);

  title.click(function(){
    createiFrame(d.url);
  });

  li.click(function() {
    var expander = $(this).find(".newspaper-expander");
    if(subtext.is(':visible')){
      subtext.slideUp(300, function(){
        expander.removeClass('fa-angle-up');
        expander.addClass('fa-angle-down');
      });
    }else{
      subtext.slideDown(300, function(){
        expander.removeClass('fa-angle-down');
        expander.addClass('fa-angle-up');
      });
    }
  });


  li.append(title);
  li.append(subHeading);
  li.append(arrow);
  li.append(subtext);
  li.hide();

  $("#newspaper-wrapper").append(li);

  return li;
}

function destroyDocumentPanel(){
  $("#newspaper-wrapper").empty();

  var startMonth = docResults[docIndex][0].date;
  var endMonth = new Date(startMonth.getUTCFullYear(), startMonth.getMonth() + 1, 0);

  var text = (startMonth.getMonth() + 1) + "/" + startMonth.getDate() + " - " + (endMonth.getMonth() + 1) + "/" + endMonth.getDate();
  $("#dateRangeText").text(text);

  refreshDocuments();

  new SimpleBar($("#newspaper-wrapper")[0]);

  if(docIndex === 0){
    $("#larrow").addClass('disabledButton');
  }else{
    $("#larrow").removeClass('disabledButton');
  }

  if(docIndex === docResults.length - 1){
    $("#rarrow").addClass('disabledButton');
  }else{
    $("#rarrow").removeClass('disabledButton');
  }
}



/*
 *   TOPIC GRAPH HANDLERS
 */

//data format to be later specified
function setTopicGraphData(data){

}

//open to other interpretations.
//This is just the handler for if the document list needs to be filtered
function onTopicClicked(topicName, docIDList){

}

