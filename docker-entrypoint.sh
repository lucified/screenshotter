#!/bin/bash

if [ -n "$DNS_HOSTNAME" ]; then

  dns_ip=$(getent hosts ${DNS_HOSTNAME} | awk '{ print $1 }')
  if [ "$dns_ip" = '' ]; then
    echo "Local dns_ip not available"
  else
    until echo -e "nameserver $dns_ip\nnameserver 127.0.0.11" > /etc/resolv.conf; do
      echo "Failed to write to /etc/resolv.conf, sleeping"
      sleep 2
    done
    cat /etc/resolv.conf
  fi

fi
exec "$@"

