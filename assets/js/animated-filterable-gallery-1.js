var slug = function (str) {
    var $slug = '';
    var trimmed = $.trim(str);
    $slug = trimmed.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return $slug.toLowerCase();
}

$("ul.filters li a").on('click', function () {
    $("ul.filters").find('.active').removeClass('active')
    $(this).parent().addClass('active')
    let filterValue = slug(this.text)
    if (filterValue == 'all') {
        $("div.gallery-pt--body>.item").show()
    } else {
        let parent = $('div.gallery-pt--body')
        parent.parent().height(parent.parent().height())
        parent.slideUp(500, function () {
            $(this).find('img[data-album!="' + filterValue + '"]').closest('div.item')
                .hide()
                .parent().find('img[data-album="' + filterValue + '"]').closest('div.item')
                .show()
        }).slideDown()

    }
});
