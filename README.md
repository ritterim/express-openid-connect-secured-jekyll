# Express OpenID Connect Secured Jekyll

An example of securing a Jekyll powered website with Express using OpenID Connect.

## Usage requirements

- Node.js
- Ruby v2
- `gem install bundler`

## Usage

- Copy **package.json** and **server.js** from this repository into the Jekyll site.
- Create **.env** in the Jekyll site using **.env.example** as a template.
- Add the following excludes in the Jekyll site **_config.yml**:
  - **node_modules/**
  - **package.json**
  - **server.js**
- Deploy the Jekyll blog as a Node.js application.

## Development quickstart

- `cp .env.example .env`
- Add configuration in **.env**
- `npm install`
- `npm start`

## Development choices rationale

This repository is designed being able to easily copy a small number of files into a Jekyll site to add authentication.

## Author

Ritter Insurance Marketing https://www.ritterim.com

## License

- **MIT** : http://opensource.org/licenses/MIT
