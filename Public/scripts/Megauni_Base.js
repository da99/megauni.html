
var url_regexp = /(https?:[^\s]+\.(jpg|gif|png|jpeg))/gi;


var Form_Image_Dimension_Cacher = function(form_name) {

  this.form           = $('#' + form_name);
  this.textarea       = $("#" + form_name + ' textarea[name=body]');
  this.textarea_cache = $("#" + form_name + ' input[name=body_images_cache]');
  
  this.cache_dimensions = function(){
  
    var cacher        = this;
    this.images       = [];
    this.total_images = 0;
    this.txt          = this.textarea.val();
    this.matches      = this.txt.match(url_regexp);
    this.total_images = this.matches.length;
  
    $.each(this.matches, function(i,val){ cacher.image_processor(i,val,cacher.total_images) });

  };

  this.finish = function(){
    if(this.onfinish == 'submit') {
      this.form.submit();
    } else {
      if(this.onfinish)
        this.onfinish();
    };
    return this.form;
  };

  this.image_failed = function(){
    this.total_images--;
    this.image_ready();
  };

  this.image_ready = function(){
    if(this.images.length >= this.total_images) {
      this.textarea_cache.val(this.images.join("\n"));
      this.finish();
    };
  };

  this.image_processor = function(i, val) {
    var img = new Image();
    var cacher = this;

    img.onerror = img.onabort = img.onAbort = img.onError = function() {
      cacher.image_failed();
    };

    img.onload = function(){
      cacher.images.push(val + ' ' + this.width + ' ' + this.height);
      cacher.image_ready();
    };

    img.src = val;
  };


}; // Form_Image_Dimension_Cacher


var Form_Submitter = {

  submit : function(button){
            var form = $(button).parents('form')[0];
            var cacher = new Form_Image_Dimension_Cacher('form_club_message_create');
            cacher.onfinish = 'submit';
            cacher.cache_dimensions();
           }
};




// 
// var img_srcs = ['http://farm5.static.flickr.com/4031/4642110880_5c18162b34.jpg',
// 'htTp://farm5.static.flickr.com/4025/4642110868_7e82baafe6.jpg',
// 'htTp://farm5.tatic.flickr.com/025/4642110868_7e82baafe6.jpg'];
// 

// var the_body = $('#form_club_message_create textarea[name=body]');
// /* the_body.val( img_srcs.join(" --- text -- ") ); */
// var the_cache = $('#form_club_message_create input[name=body_images_cache]');
