
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
        return 0
      fi

      bash_setup BOLD "=== Restarting {{NGINX}}"
      server reload
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
      $CMD  -s reload
      ;;

    quit)
      $CMD  -s quit
      ;;

    *)
      bash_setup RED "!!! Unknown server command: {{$@}}"
      exit 1
  esac
} # === end function
