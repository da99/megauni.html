
HTML = Megauni::MUE.new(file: __FILE__, auth_token: '{$str.auth_token$}').instance_eval {

  append(:head) { title "megaUNI Homepage" }

  append(:tail) {
    script(src: '/scripts/da99.applet.js/applet.js')
    script(src: '/applets/homepage/script.js')
  }

  append(:body) {

    script.Welcome!(type: 'text/applet') {
      div.block(show_if: 'logged_in?') {
        p 'You are logged in.'
      }
    } # --- Welcome!

    script.New_Session!(type: 'text/applet') {
      div.block(show_if: '!logged_in?') {

        h3 "Log-In"

        div.content {

          form.sign_in!(action: '/sign-in', method: 'post') {

            div.fields {

              div.field.screen_name {
                label("Screen name:", for: "LOGIN_SCREEN_NAME")
                input(type: 'text', name: "screen_name", value: "")
              }

              div.field.passphrase {
                label("Pass phrase:", for: "LOGIN_PASS_PHRASE")
                input(type: 'password', name: "pswd", value: "")
              }

              div.field.buttons {
                button.submit "Log-In"
              }

            } # --- div.fields
          } # --- form
        } # --- div.content
      } # --- div.block
    } # --- script

    script.New_Customer!(type: 'text/applet') {
      div.block(show_if: '!logged_in?') {

        h3 "Create a New Account"
        div.content {

          form.create_account!(action: '/user', method: 'post') {

            div.fields {

              div.field.screen_name {
                label("Screen name:", for: 'NEW_CUSTOMER_SCREEN_NAME')
                input(type: :text, name: "screen_name", value: "")
              }

              div.field.pswd {
                label(:for => :NEW_CUSTOMER_PASS_PHRASE) {
                  span.main "Pass phrase"
                  span.sub  " (for better security, use spaces and words)"
                  span.main ":"
                }
                input(type: :password, name: :pswd, value: "")
              }

              div.field.confirm_pass_phrase {
                label(:for => :NEW_CUSTOMER_CONFIRM_PASS_PHRASE) {
                  span.main "Re-type the pass phrase:"
                }
                input(type: :password, name: :confirm_pass_word, value: "")
              }


              div.buttons {
                input(type: 'hidden', name: "_csrf", value: "{{_csrf}}")
                button.submit "Create Account"
              }

            } # --- div.fields

          } # --- form

        } # --- div.content
      } # === div block
    } # --- script

    div.block.intro! {

      h1.site {

        span.main "mega"
        span.sub  "UNI"
      }

      p { a('/home', href: '/home')   }
      p { a('/@da99', href: '/@da99') }
      p { a('/!4567', href:'/!4567')  }
      p { a('/nowhere', href:'/nowhere')    }

      div.disclaimer {
        p  {
          rawtext %^
          &copy; 2012-<span id="copyright_year_today">2015</span> megauni.com. Some rights reserved.
          ^
        }

        p "All other copyrights belong to their respective owners, who have no association to this site:"

        p {
          span  "Logo font: "
          a("Aghja", href:"http://openfontlibrary.org/en/font/otfpoc")
        }

        p {
          span   "Palettes: "
          a("dvdcpd", href: "http://www.colourlovers.com/lover/dvdcpd")
          a("shari_foru", href: "http://www.colourlovers.com/palette/154398/bedouin")
        }

      } # === div.disclaimer

    } # div block
  } # === append :body

  to_html(:prettyprint=>true)
}


