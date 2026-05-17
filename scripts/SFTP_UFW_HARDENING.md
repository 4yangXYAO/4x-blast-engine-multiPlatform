# VPS Hardening with UFW and Jailed SFTP Setup

This guide provides comprehensive documentation for the `harden-ufw-and-sftp.sh` script, which automates the hardening of Ubuntu 22.04/24.04 VPS with UFW firewall configuration and a fully functional jailed SFTP environment.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Features](#features)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Configuration](#configuration)
7. [SFTP Chroot Jail Structure](#sftp-chroot-jail-structure)
8. [Security Features](#security-features)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Usage](#advanced-usage)
12. [File Permissions Reference](#file-permissions-reference)

## Overview

The `harden-ufw-and-sftp.sh` script automates the complete hardening and configuration of an Ubuntu VPS by:

- **UFW Firewall Configuration**: Enables and configures the Uncomplicated Firewall with proper default policies
- **SFTP Jailing**: Creates a chrooted SFTP environment that restricts a user to their assigned directory
- **Permission Management**: Correctly sets up directory permissions and ownerships to prevent privilege escalation
- **SSH Hardening**: Configures OpenSSH to work seamlessly with the jailed environment

## Prerequisites

### System Requirements

- Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- Root or sudo access
- Minimum 1GB disk space
- OpenSSH server installed (included in standard Ubuntu installation)

### Before Running

1. Ensure you have remote access to your VPS (through console or existing SSH connection)
2. Have the root password or sudo privileges ready
3. Know which port you want to use for SSH (default: 22)

## Features

### UFW Firewall

- **Automatic Enablement**: Enables UFW firewall with safe defaults
- **Default Policies**: Configures deny-incoming and allow-outgoing policies
- **SSH Protection**: Automatically allows SSH access (customizable port)
- **Stateful Filtering**: Enables connection tracking for established connections

### SFTP Jailing

- **Chroot Environment**: Creates isolated directory structure at `/var/sftp/homes/{username}`
- **User Restriction**: Prevents users from accessing files outside their jail
- **Upload/Download Directories**: Pre-creates structured directories for file transfers
- **Shell Access Disabled**: Ensures users cannot open SSH shell connections
- **Port Forwarding Disabled**: Prevents tunnel creation through SFTP

### Security Features

- **Correct Ownership**: Chroot directories owned by root to prevent escape
- **User Writable Directories**: Only `/uploads` and `/downloads` are writable by the user
- **No TTY Allocation**: Prevents interactive shell sessions
- **Port Forwarding Blocked**: `-o AllowTcpForwarding no` in SSH config
- **Agent Forwarding Disabled**: Prevents SSH agent use

## Installation

### 1. Download the Script

```bash
cd /opt  # or your preferred location
sudo git clone https://github.com/4yangXYAO/joki-blast-engine.git
cd joki-blast-engine/scripts
```

### 2. Make Script Executable

```bash
sudo chmod +x harden-ufw-and-sftp.sh
```

### 3. Verify Script Integrity (Optional)

```bash
# View first few lines to ensure proper bash script format
head -20 harden-ufw-and-sftp.sh
```

## Usage

### Basic Usage

```bash
sudo ./harden-ufw-and-sftp.sh <username>
```

**Example**: Create SFTP user on default SSH port (22)

```bash
sudo ./harden-ufw-and-sftp.sh sftpuser
```

### Custom SSH Port

```bash
sudo ./harden-ufw-and-sftp.sh <username> <ssh_port>
```

**Example**: Create SFTP user on port 2222

```bash
sudo ./harden-ufw-and-sftp.sh sftpuser 2222
```

### Multiple Users

To set up multiple jailed SFTP users, run the script multiple times with different usernames:

```bash
sudo ./harden-ufw-and-sftp.sh user1
sudo ./harden-ufw-and-sftp.sh user2
sudo ./harden-ufw-and-sftp.sh user3
```

Each user gets their own isolated home directory and can be managed independently.

## Configuration

### Script Variables

Edit the following variables at the top of the script to customize behavior:

```bash
SFTP_CHROOT_DIR="/var/sftp"           # Base chroot directory
SFTP_HOME_DIR="${SFTP_CHROOT_DIR}/homes"  # User homes within chroot
```

### UFW Configuration

The script automatically configures:

- **Default Policies**:
  - Incoming: DENY
  - Outgoing: ALLOW
  - Routed: ALLOW

- **Allowed Ports**:
  - SSH (specified port, default 22/tcp)

### SSH Configuration

The script modifies `/etc/ssh/sshd_config` to add:

```
Match User <username>
    ChrootDirectory /var/sftp/homes/<username>
    AllowAgentForwarding no
    AllowTcpForwarding no
    PermitTTY no
    PermitTunnel no
    X11Forwarding no
    ForceCommand internal-sftp -d /
```

## SFTP Chroot Jail Structure

### Directory Hierarchy

```
/var/sftp/                                  (root:root, 755)
├── homes/                                  (root:root, 755)
│   └── sftpuser/                          (root:root, 755)
│       ├── uploads/                        (sftpuser:sftpuser, 755)
│       └── downloads/                      (sftpuser:sftpuser, 755)
```

### Permission Reference

| Directory | Owner | Permissions | Purpose |
|-----------|-------|-------------|---------|
| `/var/sftp` | root:root | 755 | Base chroot directory |
| `/var/sftp/homes` | root:root | 755 | User homes parent |
| `/var/sftp/homes/{user}` | root:root | 755 | User chroot home (jail boundary) |
| `/var/sftp/homes/{user}/uploads` | user:user | 755 | User-writable upload directory |
| `/var/sftp/homes/{user}/downloads` | user:user | 755 | User-writable download directory |

### Why These Permissions?

1. **Root ownership of chroot**: Prevents users from modifying the jail boundary
2. **755 on jailed root**: Allows user to read/execute but not modify
3. **User ownership of subdirs**: Allows users to manage their own upload/download directories
4. **755 on user dirs**: Read/write/execute for owner, read/execute for others (prevents other users accessing files)

## Security Features

### Jailing Security

1. **Forced Chroot**: `ChrootDirectory` forces user into specified directory
2. **SFTP Only**: `ForceCommand internal-sftp` prevents shell access
3. **No TTY**: `PermitTTY no` disables shell allocation
4. **No Tunneling**: `PermitTunnel no` prevents tunnel creation
5. **No Forwarding**: `AllowTcpForwarding no` blocks port forwarding

### UFW Security

1. **Deny by Default**: Closes all unnecessary ports
2. **Explicit Allow**: Only explicitly allowed ports are open
3. **Connection Tracking**: Stateful firewall prevents spoofing
4. **Logging**: Failed connection attempts can be logged

### User Account Security

- **No Shell**: User shell set to `/usr/sbin/nologin`
- **Restricted Home**: Home directory is within chroot jail
- **Limited Capabilities**: User cannot perform privileged operations

## Testing

### 1. Test SFTP Connection

```bash
# From local machine
sftp -P 22 sftpuser@your.vps.ip.address

# If using custom port
sftp -P 2222 sftpuser@your.vps.ip.address
```

### 2. Interactive SFTP Session

```bash
sftp> ls
uploads downloads

sftp> cd uploads
sftp> put localfile.txt
sftp> ls
localfile.txt

sftp> get remotefile.txt
sftp> quit
```

### 3. Verify Jailing

```bash
# This should fail
sftp> cd /etc
Couldn't stat "/etc": No such file (in read-only /)

# Only directories within the jail are accessible
sftp> cd /
sftp> ls
uploads downloads
```

### 4. Test from Command Line

```bash
# Upload file
echo "test content" | sftp -b - sftpuser@your.vps.ip.address << 'EOF'
cd uploads
put -
EOF

# List files
sftp -P 22 sftpuser@your.vps.ip.address << 'EOF'
ls -la
ls -la uploads
quit
EOF
```

### 5. Check UFW Rules

```bash
# View all UFW rules
sudo ufw status numbered

# View UFW logs
sudo tail -f /var/log/ufw.log
```

### 6. SSH Shell Access Verification

```bash
# This should fail (user cannot open shell)
ssh sftpuser@your.vps.ip.address

# Expected result:
# This service allows sftp connections only.
# Connection closed.
```

## Troubleshooting

### Issue: Permission denied on SFTP connect

**Cause**: SSH key permissions or user permissions incorrect

**Solution**:
```bash
# Check user home directory permissions
ls -la /var/sftp/homes/

# Fix permissions
sudo chown root:root /var/sftp/homes/sftpuser
sudo chmod 755 /var/sftp/homes/sftpuser

# Restart SSH
sudo systemctl restart ssh
```

### Issue: Cannot write files to uploads directory

**Cause**: Incorrect ownership or permissions on uploads directory

**Solution**:
```bash
# Fix ownership and permissions
sudo chown sftpuser:sftpuser /var/sftp/homes/sftpuser/uploads
sudo chmod 755 /var/sftp/homes/sftpuser/uploads

# Verify
ls -la /var/sftp/homes/sftpuser/
```

### Issue: SSH key authentication not working

**Cause**: SSH public key not properly configured for jailed user

**Solution**:
```bash
# Set up authorized_keys for user
sudo mkdir -p /var/sftp/homes/sftpuser/.ssh
sudo chmod 700 /var/sftp/homes/sftpuser/.ssh
sudo echo "your-public-key" >> /var/sftp/homes/sftpuser/.ssh/authorized_keys
sudo chmod 600 /var/sftp/homes/sftpuser/.ssh/authorized_keys
sudo chown -R sftpuser:sftpuser /var/sftp/homes/sftpuser/.ssh
```

### Issue: UFW blocking SSH access

**Cause**: UFW rules not properly configured

**Solution**:
```bash
# Check UFW status
sudo ufw status verbose

# Allow SSH if blocked
sudo ufw allow 22/tcp

# Or for custom port
sudo ufw allow 2222/tcp

# Reload UFW
sudo ufw reload
```

### Issue: SSHD configuration test fails

**Cause**: Syntax error in sshd_config

**Solution**:
```bash
# Test SSHD configuration
sudo sshd -t

# If error, check the logs
sudo systemctl status ssh

# Review sshd_config syntax
sudo nano /etc/ssh/sshd_config

# Restore from backup if needed
sudo cp /etc/ssh/sshd_config.orig /etc/ssh/sshd_config
```

### Check Script Logs

```bash
# View all logs from the script
sudo tail -f /var/log/harden-ufw-and-sftp.log

# Filter by level
sudo grep "ERROR" /var/log/harden-ufw-and-sftp.log
sudo grep "INFO" /var/log/harden-ufw-and-sftp.log
```

## Advanced Usage

### Multiple SFTP Users with Different Permissions

```bash
# Create users with different purposes
sudo ./harden-ufw-and-sftp.sh backupuser
sudo ./harden-ufw-and-sftp.sh transferuser
sudo ./harden-ufw-and-sftp.sh datauser
```

### Using SSH Keys Instead of Passwords

```bash
# Generate SSH key pair on local machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/sftpuser_key

# Add public key to authorized_keys
sudo mkdir -p /var/sftp/homes/sftpuser/.ssh
sudo cp ~/.ssh/sftpuser_key.pub /var/sftp/homes/sftpuser/.ssh/authorized_keys
sudo chmod 700 /var/sftp/homes/sftpuser/.ssh
sudo chmod 600 /var/sftp/homes/sftpuser/.ssh/authorized_keys
sudo chown -R sftpuser:sftpuser /var/sftp/homes/sftpuser/.ssh

# Test with SSH key
sftp -i ~/.ssh/sftpuser_key sftpuser@your.vps.ip.address
```

### Allowing Additional Ports Through UFW

```bash
# After running the script, allow additional ports
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 25/tcp      # SMTP
sudo ufw reload

# Verify rules
sudo ufw status numbered
```

### Creating Custom Subdirectories

```bash
# After user is created, add more structured directories
sudo mkdir -p /var/sftp/homes/sftpuser/{documents,media,archives}
sudo chown sftpuser:sftpuser /var/sftp/homes/sftpuser/{documents,media,archives}
sudo chmod 755 /var/sftp/homes/sftpuser/{documents,media,archives}
```

### Disabling SFTP User Temporarily

```bash
# Lock the user account
sudo passwd -l sftpuser

# Unlock when needed
sudo passwd -u sftpuser
```

### Removing SFTP User

```bash
# Remove user account
sudo userdel sftpuser

# Remove user home directory
sudo rm -rf /var/sftp/homes/sftpuser

# Remove SSH configuration for user
sudo nano /etc/ssh/sshd_config
# Find and remove the Match block for the user

# Reload SSH
sudo systemctl reload ssh
```

## File Permissions Reference

### Understanding Linux Permissions

```
rwx rwx rwx
│   │   └─── Group permissions
│   └─────── Other permissions
└─────────── Owner permissions

r = read (4)
w = write (2)
x = execute/enter (1)

Examples:
755 = rwx r-x r-x = owner can do all, others can read/enter
700 = rwx --- --- = only owner can access
644 = rw- r-- r-- = owner can read/write, others can only read
```

### Chroot Jail Permission Rules

1. **Chroot root directory must be owned by root** and not writable by anyone else
   - Prevents user from escaping jail by modifying jail boundary
   - Format: `755` (rwx r-x r-x)

2. **User writable directories must be owned by the user**
   - Allows user to manage their own files
   - Format: `755` (rwx r-x r-x)

3. **SSH key directory must be restricted**
   - Format: `700` (rwx --- ---)
   - Only user can access their SSH keys

4. **Configuration files should not be world-readable**
   - Format: `600` (rw- --- ---)
   - Prevents sensitive data exposure

## Security Considerations

### Best Practices

1. **Use SSH Keys**: Prefer SSH keys over passwords for jailed users
2. **Monitor Access**: Regularly check SSH logs for unauthorized access attempts
3. **Update System**: Keep Ubuntu packages updated with security patches
4. **Backup Data**: Regularly backup user data from SFTP directories
5. **Quota Management**: Consider implementing disk quotas for users
6. **Firewall Maintenance**: Review UFW rules periodically

### Additional Hardening

```bash
# Disable root login
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (require SSH keys)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Limit authentication attempts
sudo sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config

# Reload SSH
sudo systemctl reload ssh
```

### Monitoring

```bash
# Monitor failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# Monitor SFTP usage
sudo grep "sftp-server" /var/log/auth.log | tail -20

# Monitor firewall activity
sudo tail -f /var/log/ufw.log
```

## Conclusion

The `harden-ufw-and-sftp.sh` script provides a comprehensive, automated solution for hardening Ubuntu VPS with UFW firewall and secure SFTP jailing. By following the configuration guidelines and security best practices outlined in this documentation, you can maintain a secure and reliable SFTP service for your users.

For issues or questions, refer to the [Troubleshooting](#troubleshooting) section or consult the script logs at `/var/log/harden-ufw-and-sftp.log`.
