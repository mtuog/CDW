(function ($) {
    "use strict";  // Sử dụng strict mode để giúp viết code chính xác hơn

    $(document).ready(function () {
        $('.wrap-slick1').each(function () {
            var wrapSlick1 = $(this);
            var slick1 = $(this).find('.slick1');
            if (slick1.length === 0) return;  // Kiểm tra sự tồn tại của slick1

            var itemSlick1 = $(slick1).find('.item-slick1');
            var layerSlick1 = $(slick1).find('.layer-slick1');
            var actionSlick1 = [];

            $(slick1).on('init', function () {
                var layerCurrentItem = $(itemSlick1[0]).find('.layer-slick1');

                actionSlick1.forEach(function (timeout) {
                    clearTimeout(timeout);
                });

                $(layerSlick1).each(function () {
                    $(this).removeClass($(this).data('appear') + ' visible-true');
                });

                layerCurrentItem.each(function (index, element) {
                    actionSlick1[index] = setTimeout(function () {
                        $(element).addClass($(element).data('appear') + ' visible-true');
                    }, $(element).data('delay'));
                });
            });

            var showDot = $(wrapSlick1).find('.wrap-slick1-dots').length > 0;

            $(slick1).slick({
                pauseOnFocus: false,
                pauseOnHover: false,
                slidesToShow: 1,
                slidesToScroll: 1,
                fade: true,
                speed: 1000,
                infinite: true,
                autoplay: true,
                autoplaySpeed: 6000,
                arrows: true,
                appendArrows: wrapSlick1,
                prevArrow: '<button class="arrow-slick1 prev-slick1"><i class="zmdi zmdi-caret-left"></i></button>',
                nextArrow: '<button class="arrow-slick1 next-slick1"><i class="zmdi zmdi-caret-right"></i></button>',
                dots: showDot,
                appendDots: wrapSlick1.find('.wrap-slick1-dots'),
                dotsClass: 'slick1-dots',
                customPaging: function (slick, index) {
                    var linkThumb = $(slick.$slides[index]).data('thumb');
                    var caption = $(slick.$slides[index]).data('caption');
                    return '<img src="' + linkThumb + '">' +
                        '<span class="caption-dots-slick1">' + caption + '</span>';
                },
            });

            $(slick1).on('afterChange', function (event, slick, currentSlide) {
                var layerCurrentItem = $(itemSlick1[currentSlide]).find('.layer-slick1');

                actionSlick1.forEach(function (timeout) {
                    clearTimeout(timeout);
                });

                $(layerSlick1).each(function () {
                    $(this).removeClass($(this).data('appear') + ' visible-true');
                });

                layerCurrentItem.each(function (index, element) {
                    actionSlick1[index] = setTimeout(function () {
                        $(element).addClass($(element).data('appear') + ' visible-true');
                    }, $(element).data('delay'));
                });
            });
        });

        /*==================================================================
        [ Slick2 ]*/
        $('.wrap-slick2').each(function () {
            var slick2 = $(this).find('.slick2');
            if (slick2.length === 0) return;  // Kiểm tra xem slick2 có tồn tại hay không
        
            $(slick2).slick({
                slidesToShow: 4,
                slidesToScroll: 4,
                infinite: false,
                autoplay: false,
                autoplaySpeed: 6000,
                arrows: true,
                appendArrows: $(this),
                prevArrow: '<button class="arrow-slick2 prev-slick2"><i class="fa fa-angle-left" aria-hidden="true"></i></button>',
                nextArrow: '<button class="arrow-slick2 next-slick2"><i class="fa fa-angle-right" aria-hidden="true"></i></button>',
                responsive: [
                    {
                        breakpoint: 1200,  // Không thay đổi, giữ nguyên vì đã đúng
                        settings: 'unslick'  // Trở lại setup mặc định khi kích thước nhỏ hơn 1200
                    },
                    {
                        breakpoint: 992,
                        settings: {
                            slidesToShow: 3,
                            slidesToScroll: 3
                        }
                    },
                    {
                        breakpoint: 768,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 2
                        }
                    },
                    {
                        breakpoint: 576,
                        settings: {
                            slidesToShow: 1,
                            slidesToScroll: 1
                        }
                    }
                ]
            });
        });
        
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var nameTab = $(e.target).attr('href');
            $(nameTab).find('.slick2').slick('reinit');
        });
        

        /*==================================================================
        [ Slick3 ]*/
       $('.wrap-slick3').each(function () {
    var slick3 = $(this).find('.slick3');
    if (slick3.length === 0) return;  // Kiểm tra xem slick3 có tồn tại hay không

    $(slick3).slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        fade: true,
        infinite: true,
        autoplay: false,
        autoplaySpeed: 6000,
        arrows: true,
        appendArrows: $(this).find('.wrap-slick3-arrows'),
        prevArrow: '<button class="arrow-slick3 prev-slick3"><i class="fa fa-angle-left" aria-hidden="true"></i></button>',
        nextArrow: '<button class="arrow-slick3 next-slick3"><i class="fa fa-angle-right" aria-hidden="true"></i></button>',
        dots: true,
        appendDots: $(this).find('.wrap-slick3-dots'),
        dotsClass: 'slick3-dots',
        customPaging: function (slick, index) {
            var portrait = $(slick.$slides[index]).data('thumb');
            return '<img src="' + portrait + '"> <div class="slick3-dot-overlay"></div>';
        },
    });
});
});

}) (jQuery);
