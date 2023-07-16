$(document).on('click', '[data-toggle="lightbox"]', function (event) {
    event.preventDefault();
    $(this).ekkoLightbox({
        alwaysShowClose: true,
        maxWidth: "1000",
        maxHeight: "700"
    });
});

