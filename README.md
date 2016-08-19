
# Screenshotter

Sets up a node server that takes screenshots
with [node-webshot](https://github.com/brenden/node-webshot).

# Running

```shell
npm start # listens on 8080 by default
```

# Using

Get the image in the response:
```shell
read -r -d '' BODY <<EOF
{
  "url": "lucify.com",
  "options": {
    "streamType": "jpg",
    "quality": 90,
    "windowSize": {
      "width": 2000,
      "height": 1500
    }
  }
}
EOF
echo $BODY | curl -v -X POST -H "Content-Type: application/json" -d '@-' localhost:8080/ > img.jpg
```

Save to a file and just return 200 on success:
```shell
read -r -d '' BODY <<EOF
{
  "url": "lucify.com",
  "fileName": "~/screenshot.jpg",
  "options": {
    "streamType": "jpg",
    "quality": 90,
    "windowSize": {
      "width": 2000,
      "height": 1500
    }
  }
}
EOF
echo $BODY | curl -v -X POST -H "Content-Type: application/json" -d '@-' localhost:8080/
```
