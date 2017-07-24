$(function() {

  $('a.popunder.button-cta.js-nextpage-uf').click(function(){
     $('html, body').animate({scrollTop: 913},1500);
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
    }
  });

  $('label[for^="no"]').click(function(){

    if(counter>0){
      counter--;
      if(counter<4){
        button.hide(3000);
      }
    };
  });

});
