<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/cli
  <br>
</h1>

<h4 align="center">A command line tool for thrty, providing commands for @thrty/api packages</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/cli.svg">
    <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/cli
```

### Usage

```shell script
Usage: thrty [options] [command]

Options:
  -h, --help                                         display help for command

Commands:
  create-api-client [options] <glob>
  create-api-package [options] <packageName> <glob>
  help [command]                                     display help for command
```
```shell script
Usage: thrty create-api-client [options] <glob>

Arguments:
  glob                       Glob pattern to match API Lambda files

Options:
  -n, --name <string>        Name of the exported API client factory (default: "api")
  -o, --outPath <string>     Output path for the API client
  -c, --httpClient <string>  HTTP client to use (axios, fetch) (default: "axios")
  -m, --models <string>      Model generation strategy (zod) (default: "zod")
  -h, --help                 display help for command
```
```shell script
Usage: thrty create-api-package [options] <packageName> <glob>

Arguments:
  packageName                Name of the npm package
  glob                       Glob pattern to match API Lambda files

Options:
  -n, --name <string>        Name of the exported API client factory (default: "api")
  -o, --outDir <string>      Output directory for the package
  -c, --httpClient <string>  HTTP client to use (axios, fetch) (default: "axios")
  -m, --models <string>      Model generation strategy (zod) (default: "zod")
  -h, --help                 display help for command

```