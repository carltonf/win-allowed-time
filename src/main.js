var $ = require('jquery');
var WeekHourGrid = require('./WeekHourGrid');
var configs = require('./configs');

// * Create WeekHourGrid
$(function(){
  $('svg')
    .attr('width', configs.svgConfig.w)
    .attr('height', configs.svgConfig.h);

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

  $('button#get-script').click(function(){
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

    $('textarea#script').val(res);
  });

  $('button#edit').one('click', function(e){
    $(this)
      .text("Editing...")
      .attr('disabled', true);

    $('textarea#script').removeAttr('readonly');
  });

  // TODO caching the blob url
  var scriptBlobURL = null;
  // the following doesn't work
  // $('#textarea#script').on('input', function(){
  //   if(scriptBlobURL){
  //     window.URL.revokeObjectURL(blobURL);
  //   }
  // });
  
  $('button#download').click(function(){
    if (scriptBlobURL){
      window.URL.revokeObjectURL(scriptBlobURL);
    }

    scriptBlobURL = window.URL.createObjectURL(
      new Blob([$('textarea#script').val()], {type: 'text/plain'})
    );

    $('<a>').attr('href', scriptBlobURL)
      .attr('download', 'allowedTime.bat')
      .text('download script')
    // get the DOM element to click, the jQuery one fails to initiate
    // downloading
    [0].click();
  });
});
