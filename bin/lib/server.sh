
# === {{CMD}} start
# === {{CMD}} pid    # prints pid number. Exits 1 if no pid found.
# === {{CMD}} reload
# === {{CMD}} quit   # (graceful shutdown)
server () {
  local CONF="$PWD/config/nginx.conf"
  local CMD="nginx/sbin/nginx -c "$CONF""
  case "$1" in
    start)
      $CMD -t

      if ! $0 server pid >/dev/null; then
        $CMD
        bash_setup BOLD "=== NGINX has {{started}}."
        return 0
      fi

      $0 server reload
      ;;

    pid)
      found=""
      while read FILE; do
        cat "$FILE"
        found="yes"
      done < <(find nginx -type f -iname "*.pid" ! -size 0)

      if [[ -z "$found" ]]; then
        exit 1
      fi
      ;;

    reload)
      if ! $0 server pid >/dev/null; then
        $0 server start
        return 0
      fi

      $CMD  -s reload
      bash_setup BOLD "=== NGINX .conf has been {{reloaded}}."
      ;;

    quit)
      $CMD  -s quit
      ;;

    *)
      bash_setup RED "!!! Unknown server command: {{$@}}"
      exit 1
  esac
} # === end function
