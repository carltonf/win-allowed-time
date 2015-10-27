// Page Controls
// 
// This module exports nothing. Require it directly in the "main" to have
// controls setup.

var $ = require('jquery');
var timeGrid = app.timeGrid;

// * Helpers
function getPrefixStr(){
  return 'net user '
    + ( $('#username').val() || "UserName" )
    + ' /time:';
}

// * Reset
$('button#reset-grid').click(function(){
  timeGrid.reset();
  $('textarea#script').val(getPrefixStr());
});

// * User Name
$('input#username').change(updateScript);

// * Script Text Area
$('#draw>svg g.tile-group-grid').mouseup(updateScript);

function updateScript(){
  var timeStr = timeGrid.gridData.serialize(),
      prefixStr = getPrefixStr(),
      res = "";

  if(!timeStr){
    res = prefixStr;
  }
  else {
    res = prefixStr + '^' + '\n'
      + timeStr.split(';').join(';^\n');
  }

  $('textarea#script')
    .val(res)
  // change the value of <textarea> would not trigger change.
    .trigger('change');
}

// * Editting
$('button#edit').one('click', function(e){
  $(this)
    .text("Editing...")
    .attr('disabled', true);

  $('textarea#script').removeAttr('readonly');
});

// * Script downloading
// caching the blob download link
var $scriptDownloadLink = null;
$('textarea#script').on('change', function(){
  if($scriptDownloadLink){
    window.URL.revokeObjectURL( $scriptDownloadLink.attr('href') );
    $scriptDownloadLink = null;
  }
});

$('button#download').click(function(){
  if (!$scriptDownloadLink){
    var scriptBlobURL = window.URL.createObjectURL(
      // The API value has undergoes some transformation to have all CR
      // replaced with LF or ignored. To have windows CRLF style line
      // breaking, manually transform the string. For more details, see
      // https://html.spec.whatwg.org/multipage/forms.html#concept-textarea-api-value
      new Blob([$('textarea#script').val().split('\n').join('\r\n')],
               {type: 'text/plain'})
    );

    $scriptDownloadLink = $('<a>')
      .attr('href', scriptBlobURL)
      .attr('download', 'allowedTime.bat');
  }

  // get the DOM element to use HTMLElement.click, the jQuery.fn.click is to
  // 'trigger' event, which would not work in this case as 'a' is not inserted
  // into DOM.
  $scriptDownloadLink[0].click();
});
