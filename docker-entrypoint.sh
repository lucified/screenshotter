#!/bin/bash

if [ "$1" = 'npm'  ] || [ "$1" = '/bin/bash'  ]; then

  if [[ -z "$DEBUG" ]] ; then
    exec 3>&1 &>/dev/null
  else
    exec 3>&1
  fi


  dns_ip=$(getent hosts ${DNS_HOSTNAME:-bind.local} | awk '{ print $1 }')
  if [ "$dns_ip" = '' ]; then
    echo "Local dns_ip not available" >&3
  else
    until echo -e "nameserver $dns_ip\nnameserver 127.0.0.11" > /etc/resolv.conf; do
      echo "Failed to write to /etc/resolv.conf, sleeping" >&3
      sleep 2
    done
    cat /etc/resolv.conf >&3
  fi

fi

exec "$@"

