
# Screenshotter

A Node server that takes screenshots of websites
with [pageres](https://github.com/sindresorhus/pageres).

## Install

```shell
npm install
```

## Running

```shell
npm start # listens on port 8090 by default
```

## Usage

### `POST /save`

Saves screenshots of `url` with dimensions `sizes` to the directory `dest`
in the server's local filesystem.

```typescript
interface Payload {
  url: string;
  dest: string;
  sizes?: string[]; // defaults to ["1024x768"]
  failOnWarnings?: boolean; // defaults to false
  options?: PageresOptions;
}
```

### `POST /stream`

Streams a screenshot of `url` with dimensions `size`.

```typescript
interface Payload {
  url: string;
  size?: string; // defaults to "1024x768"
  options?: PageresOptions;
}
```

## Pageres options and defaults

```typescript
interface PageresOptions {
  delay?: number;
  timeout?: number;
  crop?: boolean;
  css?: string;
  script?: string;
  cookies?: string[];
  filename?: string; // https://github.com/sindresorhus/pageres#filename
  incrementalName?: boolean;
  selector?: string;
  hide?: string[];
  username?: string;
  password?: string;
  scale?: number; // 1
  format?: 'png' | 'jpg'; // png
  userAgent?: string;
  headers?: object;
}

const defaultPageresOptions: PageresOptions = {
  delay: 0,
  timeout: 30,
  scale: 1,
  format: 'png',
  incrementalName: false,
  crop: true,
};
```

## Examples

### Save to the current directory

```shell
read -r -d '' BODY <<EOF
{
  "url": "https://lucify.com",
  "dest": "$PWD",
  "sizes": ["1024x768", "1920x1200"],
  "options": {
    "scale": 2
  }
}
EOF
echo $BODY | curl -v -X POST -H "Content-Type: application/json" -d '@-' localhost:8090/save
```

### Stream to a file

```shell
read -r -d '' BODY <<EOF
{
  "url": "https://lucify.com",
  "options": {
    "scale": 2
  }
}
EOF
echo $BODY | curl -v -X POST -H "Content-Type: application/json" -d '@-' localhost:8090/stream > img.jpg
```

## License

[MIT](LICENSE)
