"use strict";
/* jshint undef: true, unused: true */

var SitePref;
SitePref = {
  compare : function(new_stem, old_stem){
    return ( new_stem.get('id') < old_stem.get('id'));
  }
};

/*
 * ****************************************************************************
 * Custom additions to the String using mooTool's 'implement' method.
 * ****************************************************************************
 */
String.implement( {

    dot_it : function(after){
        return (after) ? this + '.' : '.'+ this;
    },

    to_english : function(){
        return this.replace('_', ' ');
    },

    /*
     * Note: Does not do any clean, trim, or other cleaning operation on the string.
     */
    flat_camel : function(){
        var s                   = this;
        var new_name            = [];
        var prev_char_CAPITAL   = false;

        for(var i = 0 ;  i < s.length; i++){

            /*
             * Use toLowerCase instead of capitalize or toUpperCase when comparing.
             *  This is because if character is a non-letter (e.g. underscore)
             *  then '_'.capitalize() === s[i] would always be true.
             *  This will then turn the underscore into a double underscore.
             *  Using: (.toLowerCase()) != (char) :makes sure this does not happen.
             */
            if( s[i].toLowerCase() !== s[i]) {
              new_name[i] = (prev_char_CAPITAL || i === 0) ?
                s[i].toLowerCase() :
                  '_' + s[i].toLowerCase() ;
                prev_char_CAPITAL = true;
            } else {
                new_name[i] = s[i];
                prev_char_CAPITAL = false;
            }
        }

        return new_name.join('');
    }, // end to_underscore

    /*
     * Note: Does not do any clean, trim, or other cleaning operation on the string.
     */
    TallCamel : function(){
        var s           = this;
        var newName     = [];
        var prev_char_underscore = false;

        for(var i=0; i < s.length ; i++){
            if(s[i]==='_')
                 prev_char_underscore = true;
            else {
                if( i === 0 || prev_char_underscore)
                    newName[newName.length] = s[i].capitalize();
                else
                    newName[newName.length] = s[i];
                prev_char_underscore = false;
            }

        }
        return newName.join('');
    } // end TallCamel
});
