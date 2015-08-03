require 'RedCloth'

module Dot_Why
  class Template

    def_sections :scripts, :styles, :js_templates

    def Nav_Bar!
      mustache "logged_in?" do
        div.Nav_Bar! {
          a.Log_Out!('Log-out', :href=>'/log-out')
          mustache "^is_customer_lifes" do
            a.home('My Account', :href=>'/')
          end

          mustache "my_other_screen_names" do
            a.screen_name('{{href}}', :href=>'{{href}}')
          end
        }
      end
    end

    def red_cloth *args
      str = args.last.strip
      if args.size == 2
        tag = args.first
        text! RedCloth.new("<#{tag}>#{str}</#{tag}>").to_html
      else
        text! RedCloth.new(str).to_html
      end
    end

    def as_this_life_menu
      select(name:"as_this_life") {
        mustache :screen_names do
          option('{{screen_name}}', value="{{screen_name}}")
        end
      }
    end

    def file_stamp
      '{{file_stamp}}'
    end

    def span_as
      span.as_this_life {
        span.as " as: "
        as_this_life_menu()
      }
    end

    def inline_mustache raw_cond, var
      cond = raw_cond.to_s
      pre  = cond['^'] ? cond : "##{cond}"
      post = cond.sub('^', '')

      "{{#{pre}}}#{var}{{/#{post}}}"
    end

    def mustache raw_name
      name = raw_name.to_s
      pre  = name['^'] ?  name : "##{name}"
      post = name.sub('^', '')

      text "{{#{pre}}}"
      yield
      text "{{/#{post}}}"
    end

    def applet *args
      section :styles do
        stylesheet "/applets/#{args.first}/style"
      end

      section :scripts do
        script "/applets/#{args.first}/script"
      end

      file_name = "Public/applets/#{args.first}/markup.rb"
      eval File.read(file_name), nil, file_name, 1
    end

    def title txt = nil
      if txt
        @_title = txt
      else
        super(@_title)
      end
    end

    def partials_for file
      require "./Server/#{view_name}/index"
      Object.const_get(view_name_class_name).partials
      .each { |f|
        partial "./Server/#{view_name}", "#{f}/markup.rb"
      }
    end

    def view_name_class_name
      view_name.gsub('/', '__')
    end

    def view_name
      @view_name ||= begin
                       name = main_file.sub('/markup.rb', '')
                       dir = File.basename(File.dirname name)
                       file = File.basename name
                       "#{dir}/#{file}"
                     end
    end

    def on_off val, show_more

      _class = (!val || val === 'off') ? 'off' : 'on'

      span(:class=>"on_off #{_class}") do
        a.on  "On",  :href=>"#on"
        a.off "Off", :href=>"#off"
        a.show_more("Settings", :href=>"#more_settings") if show_more
      end

    end

    def content
      view_name_underscore = view_name.to_s.gsub('/', '__')
      eval_main

      rawtext "<!DOCTYPE html>"
      html(:lang=>'en') do
        head do
          title
          meta(:"http-equiv"=>"Content-Type",  :content=>"text/html charset=UTF-8" )
          meta(:"http-equiv"=>"Cache-Control", :content=>"no-cache, max-age=0, must-revalidate, no-store, max-stale=0, post-check=0, pre-check=0" )
          link(:rel=>'shortcut icon', :href=>'/favicon.ico')

          stylesheet 'lenka-stabilo'
          stylesheet 'circus'
          stylesheet 'vanilla.reset'
          stylesheet 'okdoki'
          stylesheet 'forms'

          section :styles do
            stylesheet "/temp/#{view_name_underscore}__style"
          end

          section :scripts do
            script "/temp/#{view_name_underscore}__script"
          end

          section :styles

        end

        body do

          section :main

          script("{{_csrf}}", type: "text/_csrf", id: "CSRF")

          script(type: "text/x-okdoki", id: "js_templates") {
            div.loading.msg('')
            div.success.msg('')
            div.errors.msg('')
            section :js_templates
          }

          section :scripts, :top do
            script('/js/vendor/all')

            script("/js/Common")
            script("/js/Box")
            script("/js/Event")
            script("/js/DOM")
            script("/js/Ajax")
            script("/js/Adaptive")
            script("/js/Time")
            script("/js/Template")
            script("/js/Form")

            script("/js/Screen_Name")
            script("/js/Customer")
          end

          section :scripts
        end
      end
    end
  end

end # === module
