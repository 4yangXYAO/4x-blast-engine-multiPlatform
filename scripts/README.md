# Joki Blast Engine - Scripts Directory

This directory contains utility and setup scripts for the Joki Blast Engine project.

## Table of Contents

- [Database Scripts](#database-scripts)
- [Development Scripts](#development-scripts)
- [Deployment & Setup Scripts](#deployment--setup-scripts)

## Database Scripts

### `db-init.ts`
Initializes the SQLite database with required tables and schema.

```bash
npm run db:init
```

### `db-validate.ts`
Validates the database schema and data integrity.

```bash
npm run db:validate
```

## Development Scripts

### `dev-start.js`
Starts the development environment.

### `validate-config.js`
Validates configuration files against schema.

```bash
npm run validate:config
```

### Facebook Integration Scripts

These scripts handle Facebook integration testing and debugging:
- `test-fb.ts` - Basic Facebook adapter tests
- `test-fb-notif-adapter.ts` - Facebook notification adapter tests
- `fetch-fb-html.ts` - Fetch Facebook HTML for analysis
- `playwright-fb-gql.ts` - GraphQL testing with Playwright
- `debug-fb-notif.ts` - Debug Facebook notifications

## Deployment & Setup Scripts

### SFTP Jailed User Setup
**File:** `setup-sftp-jailed-user.sh`

Sets up a secure SFTP user with chroot jail for file uploads. Allows other users to access uploaded files. Compatible with Ubuntu 22.04 LTS and 24.04 LTS.

#### Quick Start

```bash
# Make script executable (if not already)
chmod +x scripts/setup-sftp-jailed-user.sh

# Create a jailed SFTP user
sudo ./scripts/setup-sftp-jailed-user.sh sftp_user /data/sftp
```

#### What It Does

✅ Creates a chrooted SFTP-only user
✅ Configures SSH with security restrictions
✅ Sets up directory permissions for cross-user access
✅ Validates Ubuntu 22.04/24.04 compatibility
✅ Configures ACLs for flexible permission management

#### Features

- **Security**: User restricted to jail directory, no shell access
- **File Sharing**: Multiple users can read uploaded files
- **Compatibility**: Works on Ubuntu 22.04 LTS and 24.04 LTS
- **Flexible Permissions**: Uses Linux ACLs for fine-grained control

#### Example Usage

```bash
# Set up upload user for Joki Blast Engine
sudo ./scripts/setup-sftp-jailed-user.sh blast_uploader /opt/blast/uploads

# Connect to upload files
sftp blast_uploader@server_ip

# Grant access to another user
sudo usermod -aG blast_uploader app_user

# View uploaded files
ls -la /opt/blast/uploads/
```

#### Full Documentation

See `SFTP_JAILED_USER_SETUP.md` for comprehensive setup guide, troubleshooting, and advanced configuration.

#### Requirements

- Ubuntu 22.04 LTS or 24.04 LTS
- OpenSSH server
- Root access for setup
- ACL utilities (auto-installed)

## Running Scripts

### TypeScript Scripts

```bash
# Using ts-node
ts-node scripts/your-script.ts

# Or via npm scripts (for configured scripts)
npm run db:init
```

### Bash Scripts

```bash
# Make executable first
chmod +x scripts/your-script.sh

# Run directly
./scripts/your-script.sh

# Or with bash
bash scripts/your-script.sh
```

## Creating New Scripts

When adding new scripts:

1. **TypeScript**: Place in this directory with `.ts` extension
   - Use ts-node for execution
   - Add npm script to `package.json` if commonly used

2. **Bash**: Place in this directory with `.sh` extension
   - Make executable: `chmod +x script.sh`
   - Include proper error handling and logging
   - Document usage in this README

3. **Documentation**: Add comprehensive README or documentation file
   - Include usage examples
   - List dependencies and requirements
   - Add troubleshooting section

## Contributing

- Keep scripts focused and single-purpose
- Add error handling and validation
- Document assumptions and requirements
- Test on target systems (Ubuntu 22.04/24.04 for bash scripts)
- Update this README when adding new scripts
