var $ = require('jquery');
var WeekHourGrid = require('./WeekHourGrid');
var configs = require('./configs');

$(function(){
  $('svg')
    .attr('width', configs.svgConfig.w)
    .attr('height', configs.svgConfig.h);

  // * Create WeekHourGrid
  var timeGrid = WeekHourGrid.create('#draw > svg', configs.gridConfig);
  console.log("Windows 7/8 Allowed Time Table loaded!");

  // * Controls
  function getPrefixStr(){
    return 'net user '
      + ( $('#username').val() || "UserName" )
      + ' /time:';
  }

  $('button#reset-grid').click(function(){
    timeGrid.reset();
    $('textarea#script').val(getPrefixStr());
  });

  $('input#username').change(updateScript);

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

  $('button#get-script').click(updateScript);

  $('button#edit').one('click', function(e){
    $(this)
      .text("Editing...")
      .attr('disabled', true);

    $('textarea#script').removeAttr('readonly');
  });

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
        new Blob([$('textarea#script').val()], {type: 'text/plain'})
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
});
