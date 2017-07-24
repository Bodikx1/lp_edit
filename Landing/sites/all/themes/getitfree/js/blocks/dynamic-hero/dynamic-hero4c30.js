'use strict';

var dynamicImage = jQuery('.dynImage').has("img").length;
if (dynamicImage == 0) {
  // Traversing to get image tag inside the dynamic hero view
  var elementBundle = '<a href="#?uf=bundle" class="js-nextpage-uf popunder"><img src="/sites/all/themes/getitfree/images/products.png" alt="Sample Bundle" class="img-responsive"></a>';
  // Setting fallback for image with missing utm_content
  $(".dynamic-image").children(0).children(0).html(elementBundle);

  // Displaying CTA button for missing utm_content
  var ctaButton = '<a href="#?uf=bundle" class="popunder button-cta js-nextpage-uf">Get my freebies delivered now</a>';
  $(".testimonial .field_cta_button").children(0).html(ctaButton);
}

// Inserts product bundle image incase image is broken on large
$('.on-error').on("error", function () {
  this.src = "/sites/all/themes/getitfree/images/products.png";
});