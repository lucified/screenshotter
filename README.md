
# Screenshotter

A Node server that takes screenshots of websites
with [node-webshot](https://github.com/brenden/node-webshot).

## Install

```shell
npm install
```

## Running

```shell
npm start # listens on 8080 by default
```

## Usage

You can either get the image via an HTTP response, or instruct `screenshotter`
to save the screenshot in a path within its local filesystem.

### Get the screenshot in the HTTP response

The following shell script uses `curl` to request a screenshot for `lucify.com`,
receives it in the body of a HTTP response, and pipes the result into `img.jpg`.

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

### Save the screenshot in a file

The following shell script uses `curl` to request the screenshotter running at `localhost:8080`
to take a screenshot of `lucify.com` and store it in its local filesystem in `/tmp/screenshot.jpg`.
On success, the screenshotter responds with status code `200`.

```shell
read -r -d '' BODY <<EOF
{
  "url": "lucify.com",
  "fileName": "/tmp/screenshot.jpg",
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

## Docker

Screenshotter can be run in Docker. Docker needs to be installed in order to run these commands.

Build Docker image with
```shell
docker build -t screenshotter .
```

You can then run it with
```shell
docker run --rm -ti -e 'DEBUG=1' -p 8080:8080 screenshotter
```

## Remarks

There's an issue with `webshot` on newer node versions, so we install it straight
from a [Pull Request](https://github.com/brenden/node-webshot/pull/150).

## Lucify-specific documentation

[Documentation](lucify-docs.md) for Lucify's internal use.
