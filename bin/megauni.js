#!/usr/bin/env bash
# -*- bash -*-
#
#
action="$1"
orig_args="$@"
layout="Public/applets/MUE/layout.mustache"
shift
set -u -e -o pipefail

# ==============================================================
# === Color codes: =============================================

# FROM: http://www.ibm.com/developerworks/aix/library/au-learningtput/
green=$(tput setaf 2)
green_bg=$(tput setb 2)
white=$(tput setaf 7)
bold_white_on_green=$(tput bold)${white}${green_bg}
bold_white=$(tput bold)${white}
reset_color=$(tput sgr0)

# FROM: http://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux
Color_Off='\e[0m'
BRed='\e[1;31m'
Red='\e[0;31m'
Green='\e[0;32m'
Orange='\e[0;33m'
# ==============================================================

start_server () {
  (iojs server.js) &
  server_pid="$!"
  echo "=== Started server: $server_pid - $$"
}

shutdown_server () {
  if [[ ! -z "$server_pid"  ]]; then
    if kill -0 "$server_pid" 2>/dev/null; then
      echo "=== Shutting server down: $server_pid - $$ ..."
      kill -SIGINT "$server_pid"
      server_pid=""
    fi
  fi
}

jshint () {
  echo -n "=== Running jshint: $1: "
  set +e
  js_hint_results="$($0 jshint "$1" 2>&1)"
  js_hint_exit_code="$?"
  set -e
  if [[ js_hint_exit_code -eq "0" ]]; then
    echo -e "${green}Passed${reset_color}"
  else
    echo -e "${Red}Fail${reset_color}"
    echo "$js_hint_results"
  fi
}


case "$action" in

  "help")
    echo ""
    echo "  $ bin/megauni.js  watch"
    echo "  $ bin/megauni.js  deploy"
    echo ""
    echo "  $ bin/megauni.js  render_stylus"
    echo "  $ bin/megauni.js  render   path/to/file.rb"
    echo ""
    exit 0
    ;;

  "deploy")
    bin/megauni npm install
    node_modules/bower/bin/bower install
    ;;

  "render_stylus")
    for f in ./Public/applets/*/*.styl
    do
      if [[ ! "$f" =~ "vars.styl" ]] ; then
        bin/megauni stylus $f
      fi
    done
    ;;

  "render")
    echo "Rendering: $1"
    name="$1"
    shift

    if [[ -f "$name" ]]; then
      dir="$(dirname "$name")"
      name="$(basename "$dir")"
    else
      dir="./Public/applets/$name"
    fi

    markup="$dir/markup.html"

    if [[ ! -d "$dir" ]]; then
      echo "Not found: $dir" 1>&2
      exit 1
    fi

    err=""
    ruby -r"./Public/applets/MUE/layout" -r"${dir}/markup.rb" -e "
      File.write(\"$markup\", HTML);
    " || err="true"

    if [[ -z "$err" ]]; then
      if [[ -f "$markup" ]]; then
        echo "$markup"
      fi

      if [[ "$@" =~ "print" ]]; then
        cat "$markup"
      fi
    fi # === if no err

    ;;

  "render_mustache")
    iojs bin/render.js "$@"
    ;;

  "watch")

    js_files="$(echo -e ./*.js specs/*.js)"

    # === Regular expression:
    IFS=$' '

    for file in $js_files
    do
      if [[ -f "$file" ]]; then
        jshint "$file"
      fi
    done

    iojs render.js clear!
    iojs render.js Public/applets/*/*.mustache

    re='^[0-9]+$'
    start_server

    echo "=== Watching:"
    IFS=$' '
    inotifywait --quiet --monitor --event close_write  "$0" $js_files Public/applets/*/*.mustache  | while read CHANGE
    do
      IFS=$'\n'
      dir=$(echo "$CHANGE" | cut -d' ' -f 1)
      op=$(echo "$CHANGE" | cut -d' ' -f 2)
      path="${dir}$(echo "$CHANGE" | cut -d' ' -f 3)"
      file="$(basename $path)"

      echo -e "=== $CHANGE (${path})"

      if [[ "$path" =~ "$0" ]]; then
        echo "=== Reloading..."
        shutdown_server
        exec "$0" "$orig_args"
      fi

      if [[ "$file" =~ ".mustache" ]]; then
        if [[ "$file" == "layout.mustache" ]]; then
          iojs render.js clear!
          iojs render.js "$layout" Public/applets/*/*.mustache
        else
          iojs render.js "$layout" "$path"
        fi
      fi

      if [[ "$path" =~ ".js" ]]; then
        jshint $path

        if [[ js_hint_exit_code -eq "0" ]]; then
          if [[ "$file" =~ "server.js" ]]; then
            shutdown_server
            start_server
          fi
        fi

        echo ""

      fi
    done

    ;;

  *)

    file="$( echo node_modules/*/bin/$action )"

    if [[ -f "$file"  ]]; then
      $file "$@"
      exit 0
    fi

    echo "Unknown action: $action" 1>&2
    exit 1
    ;;

esac # === case $action
