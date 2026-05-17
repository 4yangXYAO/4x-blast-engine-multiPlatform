# SFTP Jailed User Setup Guide

This document describes how to set up a secure SFTP user with chroot jail restrictions for file uploads. The setup is compatible with **Ubuntu 22.04 LTS** and **Ubuntu 24.04 LTS**.

## Overview

The `setup-sftp-jailed-user.sh` script automates the creation of:
- A jailed SFTP user with SSH chroot restrictions
- Secure directory structure with proper permissions
- Cross-user file access capabilities using ACLs
- SSH configuration optimized for SFTP-only access

## Features

✅ **Security**
- User restricted to a chroot jail directory
- SFTP-only access (no SSH shell)
- No port forwarding or agent forwarding allowed
- No X11 forwarding enabled

✅ **File Sharing**
- Multiple users can read uploaded files
- Sticky bit prevents accidental file deletion
- ACL support for flexible permission management

✅ **Ubuntu Compatibility**
- Tested on Ubuntu 22.04 LTS
- Tested on Ubuntu 24.04 LTS
- Auto-detects and validates system configuration

## Installation & Setup

### Prerequisites

```bash
# SSH server must be installed
sudo apt-get install openssh-server openssh-sftp-server

# ACL utilities (recommended for flexible permissions)
sudo apt-get install acl
```

### Basic Setup

1. **Make the script executable:**
   ```bash
   chmod +x scripts/setup-sftp-jailed-user.sh
   ```

2. **Run the setup script:**
   ```bash
   sudo ./scripts/setup-sftp-jailed-user.sh sftp_user /data/sftp
   ```
   
   This creates:
   - User: `sftp_user`
   - Jail directory: `/data/sftp`
   - Upload directory: `/data/sftp/uploads`

### Multiple Users

To create multiple jailed users:

```bash
# Create additional SFTP users
sudo ./scripts/setup-sftp-jailed-user.sh blast_uploader /data/sftp/blast
sudo ./scripts/setup-sftp-jailed-user.sh media_uploader /data/sftp/media
sudo ./scripts/setup-sftp-jailed-user.sh logs_uploader /data/sftp/logs
```

## Usage

### Connect via SFTP

From a client machine:

```bash
# Interactive SFTP shell
sftp sftp_user@server_ip

# Or use SCP-style commands
sftp sftp_user@server_ip:/uploads/file.txt /local/path/
```

### Upload Files

```bash
# In SFTP interactive session
cd uploads
put local_file.txt
put multiple_*.txt

# Or from command line
echo "put document.pdf /uploads/" | sftp sftp_user@server_ip
```

### Access Uploaded Files

Assuming you've granted access to other users:

```bash
# View files in the upload directory
ls -la /data/sftp/uploads/

# Read a file uploaded by the jailed user
cat /data/sftp/uploads/document.pdf

# Access via local application
/path/to/app /data/sftp/uploads/data.csv
```

## Permission Management

### Grant Access to Other Users

To allow another user to read/access uploaded files:

```bash
# Method 1: Add user to the sftp_user group
sudo usermod -aG sftp_user other_username

# Method 2: Set ACL permissions for specific user
sudo setfacl -m u:other_username:rx /data/sftp/uploads

# Method 3: Set ACL for all future files
sudo setfacl -d -m u:other_username:rx /data/sftp/uploads
```

### View Current Permissions

```bash
# Check standard permissions
ls -ld /data/sftp/uploads

# Check ACL permissions
getfacl /data/sftp/uploads
```

### Restrict Access

```bash
# Remove user from group
sudo deluser other_username sftp_user

# Remove user-specific ACL
sudo setfacl -x u:other_username /data/sftp/uploads
```

## Directory Structure

After setup, the jail directory structure looks like:

```
/data/sftp                    # Jail root (owned by root, mode 755)
├── uploads/                  # Upload directory (owned by root:sftp_user, mode 775)
│   ├── file1.txt            # Uploaded by sftp_user
│   ├── file2.pdf
│   └── document.csv
└── [internal SSH structures] # Created automatically by SSH
    └── dev/                  # Required for SFTP functionality
```

## SSH Configuration

The script creates a custom SSH configuration file at:

```
/etc/ssh/sshd_config.d/99-sftp-jail-<username>.conf
```

Example content:
```
Match User sftp_user
    ChrootDirectory /data/sftp
    AllowTcpForwarding no
    AllowAgentForwarding no
    AllowStreamLocalForwarding no
    PermitTTY no
    PermitUserEnvironment no
    X11Forwarding no
    ForceCommand internal-sftp -l INFO
```

## Troubleshooting

### Connection Issues

**Problem:** "Permission denied (publickey)."

**Solution:** 
- Verify user exists: `id sftp_user`
- Check SSH key permissions: `ls -la ~/.ssh`
- View SSH logs: `journalctl -u ssh -f`

### Permission Denied on Upload

**Problem:** "Permission denied" when uploading files.

**Solution:**
```bash
# Check directory permissions
ls -ld /data/sftp/uploads

# Fix permissions if needed
sudo chmod 775 /data/sftp/uploads
sudo chown root:sftp_user /data/sftp/uploads
```

### Cannot Access Files from Other User

**Problem:** Other user cannot read uploaded files.

**Solution:**
```bash
# Add user to group
sudo usermod -aG sftp_user other_username

# Set default ACL for new files
sudo setfacl -d -m u:other_username:rx /data/sftp/uploads

# User must log out and log back in for group changes to take effect
su - other_username
```

### SSH Service Not Responding

**Problem:** Cannot connect via SFTP.

**Solution:**
```bash
# Check if SSH is running
sudo systemctl status ssh

# Start SSH if not running
sudo systemctl start ssh

# Verify SSH configuration
sudo sshd -t

# Check for errors
sudo journalctl -u ssh --no-pager | tail -20
```

## Security Considerations

1. **Jail Root Ownership:**
   - The jail root directory MUST be owned by `root` (not the user)
   - This is enforced by SSH for security reasons
   - The script ensures this automatically

2. **Upload Directory:**
   - Owned by `root` but group-accessible to the jailed user
   - Uses sticky bit (`+t`) to prevent users from deleting each other's files

3. **File Permissions:**
   - Default permissions allow read-only access to other users
   - Write access is restricted to the uploading user and administrators
   - ACLs provide fine-grained control

4. **SSH Configuration:**
   - No shell access (uses `/usr/sbin/nologin`)
   - No port forwarding or tunneling allowed
   - SFTP-only access via `internal-sftp` subsystem

## Advanced Configuration

### Enable Verbose Logging

Edit `/etc/ssh/sshd_config.d/99-sftp-jail-<username>.conf`:

```bash
sudo sed -i 's/# LogLevel VERBOSE/LogLevel VERBOSE/' \
  /etc/ssh/sshd_config.d/99-sftp-jail-sftp_user.conf

sudo systemctl reload ssh
```

### Require Key-Based Authentication

Edit the match block to add:

```
PubkeyAuthentication yes
PasswordAuthentication no
```

Then reload SSH.

### Set Bandwidth Limits

Use `tc` (traffic control) to limit user bandwidth:

```bash
# Limit to 1Mbps
sudo tc qdisc add dev eth0 root handle 1: htb default 10
sudo tc class add dev eth0 parent 1: classid 1:10 htb rate 1mbit
```

## Example: Integration with Joki Blast Engine

To use this jailed user for file uploads to the Joki Blast Engine:

```bash
# 1. Set up jailed user
sudo ./scripts/setup-sftp-jailed-user.sh blast_uploader /opt/blast/uploads

# 2. Note: Files inside the chroot jail are isolated from the system
# The jailed user sees /opt/blast/uploads as their root directory
# To share files with the Joki application, either:

# Option A: Have the Joki app read directly from the jail directory
#           (recommended for security)
# In your env config, set: UPLOAD_DIR=/opt/blast/uploads/uploads

# Option B: Set up a cron job to copy/process files from jail to app directory
# Example crontab entry:
# */5 * * * * cp -r /opt/blast/uploads/uploads/* /var/lib/joki/data/ 2>/dev/null

# 3. Grant access to the blast engine service user
sudo usermod -aG blast_uploader joki_service_user

# 4. The service user can now read files from the uploads directory
# List available uploads: ls -la /opt/blast/uploads/uploads/
```

**Important Note on Chroot Jails:**
- Symlinks don't cross chroot boundaries (security feature)
- Inside the jail, `/opt/blast/uploads` appears as `/` to the jailed user
- Any absolute paths in configs must account for the jail perspective
- Best practice: have external processes read from the jail directory directly

## Cleanup

To remove a jailed SFTP user:

```bash
# Remove SSH configuration
sudo rm /etc/ssh/sshd_config.d/99-sftp-jail-sftp_user.conf

# Reload SSH
sudo systemctl reload ssh

# Delete user
sudo userdel sftp_user

# Optionally, remove jail directory
sudo rm -rf /data/sftp
```

## References

- OpenSSH Documentation: https://man.openbsd.org/sshd_config
- Linux ACL Manual: `man setfacl`
- Ubuntu SSH Server: https://help.ubuntu.com/community/SSH

## Support

For issues or improvements, please refer to:
- SSH logs: `journalctl -u ssh -f`
- System logs: `journalctl -f`
- Test SFTP: `sftp -v user@localhost`
