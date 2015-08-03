var Swiss = {

    browser : {
        on_dev :  (window.location.hostname==='localhost' || window.location.hostname==='127.0.0.1')
    },
    
    call_these_funcs : function( arr_with_callbacks){  
                                        $A(arr_with_callbacks).each(function(func){func(); });
                                  },
    
    does : function(class_name, method_name){
                    return window[class_name] && window[class_name][method_name];
                }, // end hasMethod
    
    reportError : function(msg){
                                if( Swiss.browser.on_dev )
                                    throw(  Swiss.getErrorMsg(msg) );
                                return( Swiss.getErrorMsg(msg) );
                            }, // end reportError

    getErrorMsg : function(options){
        
        options = options || {}
        
        // If this is just a string, then return it.  No more processing required.
        if($type(options)==='string')
            return options;
            
        if($type(options) != 'object')
            return ''+options;
        
        if(options['exception']){
            return 'Tell the programmer about this error: ' + options['exception'];  
        };
        
        if(options['header'] && options['val']){
            return "Contact support and tell them about this error: \n" + options['header'] + ': ' + options['val'] + '.';
        };
        
        if(options['request']){
            
            msg = 'Error: ' +  options['request'].status + '. The programmer seems to have made a typo in the code that powers this website...'; 
            msg += ' Contact the programmer and tell them what you wanted to do.';
            
            return msg;
        };
        
        if(options.error === 'template')
            return 'Contact the programmer and complain gently about this error: ' +
                    ( (options.msg ) ? options.msg : 'Template Error') + '.';
            
        if(options.error === 'arguments' ) {
            
            var msg = 'Error in function: ' + 
                        ( (options['function']) ? options['function'] : 'unknown function') + '.' +
                        ( (options.msg) ? "\n" + options.msg : '') ;
            
            (new Hash(options.arguments || {} )).each(function(val, key){
                msg += "\n " + key + ': ' + val + '. ';    
            });
            
            return msg;
        };

        
        return 'Unknown error. Contact programmer and tell them you found an error. ' + 
                'They are nice and gentle. Don\'t be shy ;) ';
    }, // getErrorMsg
    
    show_folder : function(raw_link, links_selector, folders_selector) {
       
        var current_link                     = $(raw_link);
        var all_links                           = $$(links_selector);
        var all_folders                        = $$(folders_selector);
        var target_folder                   = $$( '#' + current_link.getElement('a').get('href').split('#')[1] )[0];
        var select = { l : 'selected_link', f : 'selected_folder'};
        
        // De-select all links except the current one.
        all_links.each(function(ele){ 
            if(ele == current_link)
                ele.addClass( select.l );
            else
                ele.removeClass( select.l );
        });
        
        // Hide all folders except target folder.
        all_folders.each(function( f ){
            if( f == target_folder )
                f.addClass( select.f )
            else
                f.removeClass(select.f);
        });
        
        return target_folder;
        
    } // end show_binder
    
}; // end Swiss



/* 
 * ****************************************************************************
 * Custom additions to the Element methods using mooTool's 'implement' method.
 * ****************************************************************************
 */
Element.implement({
    
    /*
     * Parameters:
     *  css_selector - Required string. CSS selector to get the parent.
     *  top_ancestor - Optional element or CSS selector. Searching will start here and go on down.
     */
    getTheBoss : function(css_selector, top_ancestor ) {
                        
            if(!css_selector)
                return Swiss.reportError('CSS selector not defined for custom Element method .getTheBoss.');
        
            if(!top_ancestor)
                return  (this.match(css_selector) && this) || this.getParent(css_selector);
            

            top_ancestor = ($(top_ancestor)) 
                             ? $(top_ancestor)
                             : (this.match(top_ancestor) && this )  || this.getParent(top_ancestor) ;
            
            if(!top_ancestor)
                Swiss.reportError('Top ancestor not found in method: getTheBoss. Probably because you are outside the top ancestor.');
            
            if(top_ancestor.match(css_selector))
                return top_ancestor;
            
            return top_ancestor.getFirst(css_selector) || top_ancestor.getElement(css_selector);
    }, // end getTheBoss
    
    getEyeColor : function (){
        ele = this;
        
        var is_bgcolor      = function(color_string){ return $type(color_string)==='string' && color_string.indexOf('#') === 0; };
        var ele_parent      = ele.getParent();
        var bgcolor         = ele.getStyle('background-color');
        var default_color   = '#fff';
        
        if(  is_bgcolor( bgcolor ) )
            return bgcolor;
        
        while(  !is_bgcolor(bgcolor) &&  ele_parent){
                bgcolor = ele_parent.getStyle('background-color');
                ele_parent = ele_parent.getParent();
        };
        
        return (is_bgcolor(bgcolor)) ?  bgcolor : '#fff';

    }, // end getEyeColor
    
    flash_it : function(){

        var ele = this;
        var orig_color = ele.retrieve('highlight:original') || ele.retrieve('highlight:original', ele.getStyle('background-color') );
        var eye_end  = (orig_color==='transparent') ? ele.getEyeColor() : orig_color;
        var tween = this.get('tween');
        
        tween.options.duration = 900;
        
        tween.start('background-color', '#ffff88', eye_end).chain(
            function(){
                ele.setStyle('background-color', orig_color);
                tween.callChain(); 
            }
        );

        return this;
    }
}); // end Element.implement




function $first(selector) {
  return $$(selector)[0];
};



Element.implement({

  removeClasses : function(){

    var this_element = this;

    $A(arguments).each(function(arg){

      if($type(arg) == 'array')

        $A(arg).each(function(classname){ this_element.removeClass(classname) });

      else

        this_element.removeClass(arg);

    });
  }

});
String.implement({

  nl2br : function(){ // from: http://snipplr.com/view/634/replace-newlines-with-br-platform-safe/

        if(this.trim().length==0)
          return this;

      
        var text = escape(this);
        var re_nlchar = false;

        if(text.indexOf('%0D%0A') > -1){
          re_nlchar = /%0D%0A/g ;

        }else if(text.indexOf('%0A') > -1){
          re_nlchar = /%0A/g ;
        }else if(text.indexOf('%0D') > -1){

          re_nlchar = /%0D/g ;

        };

        if(!re_nlchar)

          return this;

      
        return( unescape( text.replace(re_nlchar,'<br />') ) );

      }

});

