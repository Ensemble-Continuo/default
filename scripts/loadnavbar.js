$(function () {
    // https://medium.com/@AmyScript/how-to-reduce-reuse-and-recycle-your-code-389e6742e4ac (PREHISTORIC)
    // https://stackoverflow.com/questions/5899525/very-simple-jquery-load-example-not-working
    $('#rnb').load('/reusenavbar.html', function (response, status, xhr) {
        if (status == "error") {
            var msg = "Welcome to my error: ";
            $("#rnb").html(msg + xhr.status + " " + xhr.statusText);
        }
    });
});