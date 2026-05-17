# UFW & SFTP Jailing Quick Reference

## Quick Start

### One-Liner to Harden Your VPS

```bash
sudo ./harden-ufw-and-sftp.sh sftpuser
```

### With Custom SSH Port

```bash
sudo ./harden-ufw-and-sftp.sh sftpuser 2222
```

## What Does This Script Do?

✅ **Enables UFW Firewall** with secure defaults (deny incoming, allow outgoing)
✅ **Creates SFTP Jailed User** completely isolated in their home directory
✅ **Configures SSH/SSHD** for secure SFTP-only access
✅ **Sets Correct Permissions** to prevent privilege escalation
✅ **Validates Configuration** and creates logs for debugging

## After Running the Script

### 1. Set a Password

```bash
sudo passwd sftpuser
```

### 2. Test SFTP Connection

```bash
sftp sftpuser@your.server.ip
```

### 3. Upload a File

```bash
sftp> cd uploads
sftp> put myfile.txt
sftp> quit
```

## Directory Structure

After running the script, users get this isolated environment:

```
/var/sftp/homes/sftpuser/
├── uploads/        ← User can upload files here
└── downloads/      ← User can download files from here
```

**User CANNOT access:**
- System directories (`/etc`, `/home`, `/root`, etc.)
- Other users' files
- Escape the jail

## Common Commands

### List All UFW Rules
```bash
sudo ufw status numbered
```

### Add Additional Ports
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### Create Multiple Users
```bash
sudo ./harden-ufw-and-sftp.sh user1
sudo ./harden-ufw-and-sftp.sh user2
sudo ./harden-ufw-and-sftp.sh user3
```

### Check Script Logs
```bash
sudo tail -f /var/log/harden-ufw-and-sftp.log
```

### Verify User Can't Escape Jail
```bash
# Try this in SFTP - should fail
sftp> cd /etc
# Should see: Couldn't stat "/etc": No such file
```

## Security Features

🔒 **Jailed SFTP**: User cannot access files outside their home directory
🔒 **No Shell Access**: User cannot open terminal/SSH shell
🔒 **No Port Forwarding**: User cannot tunnel through SFTP
🔒 **UFW Firewall**: Only necessary ports are open
🔒 **Correct Permissions**: Prevents privilege escalation

## Troubleshooting

### Can't Connect via SFTP
1. Check firewall: `sudo ufw status`
2. Check SSH: `sudo systemctl status ssh`
3. Check permissions: `ls -la /var/sftp/homes/`
4. Check logs: `sudo tail /var/log/harden-ufw-and-sftp.log`

### Can't Write to Upload Directory
```bash
sudo chown sftpuser:sftpuser /var/sftp/homes/sftpuser/uploads
sudo chmod 755 /var/sftp/homes/sftpuser/uploads
```

### SSH Connection Closed Immediately
```bash
# This is expected - user can only use SFTP, not shell
# Use: sftp sftpuser@server  (not ssh)
```

## For More Information

See `SFTP_UFW_HARDENING.md` for comprehensive documentation.
