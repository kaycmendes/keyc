


/**
 * Core configuration type for Keyc management
 * @typedef {Object} ConfigOptions
 * @property {string} [envPath='.env'] - Path to environment file
 * @property {Record<string, string>} [secrets={}] - Key/value pairs for sensitive data
 * @property {('aws'|'vercel'|'doppler'|'github')[]} [providers] - Supported secret providers
 * @property {import('zod').ZodSchema} [validate] - Zod schema for config validation
 * @property {() => Promise<void>} [onLoad] - Hook triggered after config load
 * @property {() => Promise<void>} [onSave] - Hook triggered before config save
 */

/**
 * Type definition for environment variable processing
 * @typedef {Object} EnvConfig
 * @property {boolean} [override=false] - Allow system env overrides
 * @property {string[]} [required=[]] - Mandatory environment variables
 * @property {Record<string, string>} [defaults={}] - Fallback values
 */

/**
 * Provider-specific configuration types
 * @typedef {Object} ProviderConfig
 * @property {'aws'} type - AWS provider type
 * @property {Object} options
 * @property {string} options.region - AWS region
 * @property {string} [options.profile] - AWS credentials profile
 * @property {string} [options.roleArn] - IAM role for cross-account access
 */

/** 
 * Unified configuration type combining all aspects
 * @typedef {ConfigOptions & {
 *   env: EnvConfig,
 *   providers: ProviderConfig[]
 * }} KeycConfig
 */

/**
 * Validation error type for config verification
 * @typedef {Object} ConfigError
 * @property {string} path - Dot-notation path to invalid field
 * @property {string} message - Human-readable error description
 * @property {string} expected - Expected type/value
 */

/**
 * Logging level type for configuration system
 * @typedef {'debug'|'info'|'warn'|'error'} LogLevel
 */





