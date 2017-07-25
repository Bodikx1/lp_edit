$(function() {

  $('a.popunder.button-cta.js-nextpage-uf').click(function(){
     $('html, body').animate({scrollTop:$('.headline-wrap').offset().top - 20},1500);
  });

  $('input').prop({'checked': true});

  var counter = 0;

  var button = $('<button/>',{
    'class': 'submit',
    'text': 'submit'
  }).appendTo($('div.field_product_grid'));


  $('label[for^="yes"]').click(function(){
    counter++;
    if(counter>3){
      button.fadeIn(3000);
    };
    if(counter===4){
      var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      $('html, body').animate({scrollTop: currentScroll + 200},1000);
    }
  });

  $('label[for^="no"]').click(function(){

    if(counter>0){
      counter--;
      if(counter<4){
        button.hide(3000);
      }
    };
    if(counter===3){
      var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      $('html, body').animate({scrollTop: currentScroll - 200},1000);
    }
  });

});
