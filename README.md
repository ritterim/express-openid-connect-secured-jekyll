# Express OpenID Connect Secured Jekyll

An example of securing a Jekyll powered website with Express using OpenID Connect.

## Usage requirements

- Node.js
- Ruby v2
- `gem install bundler`
- HTTPS is required for the `express-session` cookie, unless the `EXPRESS_INSECURE` environment variable is set to `"true"`.

## Usage quickstart

`ruby -e "$(curl -fsSL https://raw.githubusercontent.com/ritterim/express-openid-connect-secured-jekyll/master/install.rb)"`

## Manual usage

- Copy **package.json** and **server.js** from this repository into the Jekyll site.
- Create **.env** in the Jekyll site using **.env.example** as a template.
- Add the following `exclude` items in the Jekyll site **_config.yml**:
  - **node_modules/**
  - **package.json**
  - **server.js**
- Add **node_modules/** to **.gitignore** if the target is a Git repository and it does not already contain this entry.
- Deploy the Jekyll blog as a Node.js application.

## Public URLs

Set the `PUBLIC_URLS` environment variable using a comma or semicolon delimited string.

- Specifying `/assets` will everything under that path.
- Matches are case insensitive.
- **NOTE: Specifying a url of `/` will make the entire site public.**

**Example:**

```
/assets, /2017/01/01/a-test-post.html
```

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
