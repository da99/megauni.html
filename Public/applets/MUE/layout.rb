
require "erector"

module Megauni
  module WWW_App

    def var *args
      @vars ||= begin
                  v = {}
                  v.default_proc = lambda { |h,k|
                    fail ArgumentError, "Key not found: #{k.inspect}"
                  }
                  v
                end
      return @vars[args.first] if args.size == 1
      name, val  = args
      var!(name, val) unless @vars.has_key?(name)
      val
    end # === def var

    def var! name, val
      @vars[name] = val 
      eval <<-EOF, nil, __FILE__, __LINE__ + 1
            def #{name}
              @vars[:#{name}]
            end
            EOF
      var name
    end

  end # === class WWW_App =========================
end # === Megauni


module Megauni

  class MUE < Erector::Widget

    def nav_bar
      div.nav_bar! {
        a('megauni home', href: '/')
        a('Log-Out',      href: '/log-out')
      }
    end

    def content
      html {

        head {
          megauni :head do

            link media: 'all', rel: 'stylesheet', type: 'text/css', href: '/css/vanilla.reset.css'
            link media: 'all', rel: 'stylesheet', type: 'text/css', href: '/css/fonts.css'
            link media: 'all', rel: 'stylesheet', type: 'text/css', href: '/css/otfpoc.css'
            link media: 'all', rel: 'stylesheet', type: 'text/css', href: '/applets/MUE/style.css'
            if @file
              link media: 'all', rel: 'stylesheet', type: 'text/css', href: "/applets/#{File.basename File.dirname(@file)}/style.css"
            end
          end

          title('No title') unless @megauni[:title_used]
        } # === head

        body {
          megauni :body
        }

        megauni :tail do
          script(src: '/scripts/turu/turu.js')
          script(src: '/scripts/jquery/dist/jquery.min.js')
          script(src: '/scripts/lodash/lodash.min.js')
        end
      } # === html
    end # === def content

    def initialize *args
      @megauni = {
        :head_top=>[], :head_bottom=>[],
        :body_top=>[], :body_bottom=>[],
        :tail_top=>[], :tail_bottom=>[]
      }
      super
    end

    def title *args
      @megauni[:title_used] = true
      super
    end

    def megauni name
      @megauni[:"#{name}_top"].each { |b| b.call }
      yield if block_given?
      @megauni[:"#{name}_bottom"].each { |b| b.call }
    end

    def prepend name, &blok
      @megauni[:"#{name}_top"] << blok
    end

    def append name, &blok
      @megauni[:"#{name}_bottom"] << blok
    end

  end # === class MUE

end # === module Megauni






