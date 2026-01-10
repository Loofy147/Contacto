# Configuration

This directory contains configuration files for the backend application. It's designed to manage settings for different environments (development, staging, production) in a secure and organized manner.

## Files

- `default.json`: Default configuration values that apply to all environments.
- `development.json`: Configuration overrides for the development environment.
- `staging.json`: Configuration overrides for the staging environment.
- `production.json`: Configuration overrides for the production environment.
- `custom-environment-variables.json`: Maps environment variables to configuration keys.

## Usage

The configuration is loaded using a library like `config`. The library automatically selects the correct configuration file based on the `NODE_ENV` environment variable. For example, if `NODE_ENV` is set to `production`, the configuration will be a combination of `default.json` and `production.json`.

Sensitive information like API keys and database credentials should be stored in environment variables and mapped in `custom-environment-variables.json`. **Do not commit sensitive information to the repository.**
