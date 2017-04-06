console.log("The JS is here! Someone get the door");
$('#username').on("keypress", function(e) {
        if (e.keyCode == 13) {
            submitName();
            return false;
        }
});
$('#submitName').on("click", function(){
    submitName();
});
var submitName = function(){
    //TODO - valid name? Probably have to ask the server.
    var name = $('#username').val();
    console.log("TODO: Set our username equal to "+name+".");
    $('#selectName').hide();
    $('#selectRoom').show();
}
