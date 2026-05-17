# UFW & SFTP Jailing Integration Guide

## Project Integration

The `harden-ufw-and-sftp.sh` script is designed to be used by DevOps teams and system administrators managing Ubuntu 22.04/24.04 VPS instances. This guide explains how to integrate it into your deployment pipeline.

## Scripts Overview

### Main Script
- **File**: `harden-ufw-and-sftp.sh` (14KB, executable)
- **Purpose**: Automated VPS hardening with UFW and SFTP jailing
- **Dependencies**: Ubuntu 22.04/24.04, root access, OpenSSH
- **Runtime**: ~2-3 minutes (includes apt updates)

### Documentation
1. **SFTP_UFW_HARDENING.md** (15KB)
   - Comprehensive technical documentation
   - Permission reference guides
   - Security best practices
   - Troubleshooting section

2. **README-UFW-SFTP.md** (2.7KB)
   - Quick start guide
   - Common commands
   - Security features overview
   - Quick troubleshooting

3. **examples-harden-ufw-and-sftp.sh** (12KB)
   - 10 detailed usage examples
   - Real-world scenarios
   - Automation templates
   - Testing procedures

## Deployment Integration

### Option 1: Manual Deployment

```bash
# On your Ubuntu VPS
cd /opt
git clone https://github.com/4yangXYAO/joki-blast-engine.git
cd joki-blast-engine/scripts

# Run the script
sudo ./harden-ufw-and-sftp.sh sftpuser
```

### Option 2: Ansible Integration

```yaml
---
- name: Harden VPS with UFW and SFTP
  hosts: web_servers
  become: yes
  tasks:
    - name: Clone joki-blast-engine repository
      git:
        repo: https://github.com/4yangXYAO/joki-blast-engine.git
        dest: /opt/joki-blast-engine
        version: main

    - name: Run hardening script
      script: /opt/joki-blast-engine/scripts/harden-ufw-and-sftp.sh {{ sftp_username }}
      vars:
        sftp_username: backupuser
```

### Option 3: Terraform Integration

```hcl
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"  # Ubuntu 22.04
  instance_type = "t3.micro"
  key_name      = aws_key_pair.deployer.key_name

  user_data = <<-EOF
              #!/bin/bash
              cd /tmp
              git clone https://github.com/4yangXYAO/joki-blast-engine.git
              cd joki-blast-engine/scripts
              chmod +x harden-ufw-and-sftp.sh
              ./harden-ufw-and-sftp.sh sftpuser 22
              EOF

  tags = {
    Name = "hardened-web-server"
  }
}
```

### Option 4: Docker Integration

```dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    openssh-server \
    openssh-sftp-server \
    ufw \
    git \
    sudo

# Clone repository
RUN git clone https://github.com/4yangXYAO/joki-blast-engine.git /opt/joki

# Make script executable
RUN chmod +x /opt/joki/scripts/harden-ufw-and-sftp.sh

# Create a startup script
RUN cat > /entrypoint.sh << 'EOF'
#!/bin/bash
# Enable SSH service
service ssh start

# Run hardening script
/opt/joki/scripts/harden-ufw-and-sftp.sh sftpuser

# Keep container running
tail -f /dev/null
EOF

RUN chmod +x /entrypoint.sh

EXPOSE 22
ENTRYPOINT ["/entrypoint.sh"]
```

## Key Features Implementation

### UFW Firewall
- ✅ Automatic enablement with safe defaults
- ✅ Deny incoming, allow outgoing
- ✅ SSH port configuration (default or custom)
- ✅ Extensible for additional ports

### SFTP Jailing
- ✅ Chroot directory creation at `/var/sftp/homes/{user}`
- ✅ Proper permission configuration to prevent escape
- ✅ SSH configuration with Match blocks
- ✅ User account creation/modification

### Security Measures
- ✅ Root ownership of jail boundary
- ✅ User-writable upload/download directories
- ✅ Shell access disabled
- ✅ Port forwarding disabled
- ✅ Agent forwarding disabled
- ✅ TTY allocation prevented

## File Structure Generated

After running the script on a user 'sftpuser':

```
/var/sftp/
├── homes/
│   └── sftpuser/                    (Owner: root, Perm: 755)
│       ├── uploads/                 (Owner: sftpuser, Perm: 755)
│       └── downloads/               (Owner: sftpuser, Perm: 755)

/etc/ssh/sshd_config                 (Updated with Match block)
└── /etc/ssh/sshd_config.orig        (Backup of original)

/var/log/harden-ufw-and-sftp.log    (Script execution log)
```

## Validation Checklist

After running the script, verify:

- [ ] UFW is enabled: `sudo ufw status`
- [ ] SSH rule is active: `sudo ufw status | grep 22`
- [ ] User exists: `getent passwd sftpuser`
- [ ] User home directory exists: `ls -la /var/sftp/homes/sftpuser/`
- [ ] Upload directory exists: `ls -la /var/sftp/homes/sftpuser/uploads/`
- [ ] SSH configuration updated: `grep "Match User sftpuser" /etc/ssh/sshd_config`
- [ ] SFTP connection works: `echo "quit" | sftp sftpuser@localhost`
- [ ] Jailing works: `sftp> cd /etc` should fail

## Operational Procedures

### Adding a New SFTP User

```bash
# Run script for new user
sudo ./scripts/harden-ufw-and-sftp.sh newuser

# Set user password
sudo passwd newuser

# Verify setup
sftp newuser@localhost
```

### Removing an SFTP User

```bash
# Remove user account
sudo userdel newuser

# Remove home directory
sudo rm -rf /var/sftp/homes/newuser

# Remove SSH configuration
sudo sed -i "/^Match User newuser$/,/^$/d" /etc/ssh/sshd_config

# Reload SSH
sudo systemctl reload ssh
```

### Modifying UFW Rules

```bash
# Allow additional port
sudo ufw allow 443/tcp

# Allow port range
sudo ufw allow 6000:6010/tcp

# Allow from specific IP
sudo ufw allow from 203.0.113.0/24 to any port 22

# Reload firewall
sudo ufw reload

# View rules
sudo ufw status numbered
```

### Monitoring & Logs

```bash
# Check script logs
sudo tail -f /var/log/harden-ufw-and-sftp.log

# Monitor SFTP usage
sudo grep "sftp-server" /var/log/auth.log | tail -10

# Monitor failed SSH attempts
sudo grep "Failed password" /var/log/auth.log

# Check firewall logs
sudo tail -f /var/log/ufw.log
```

## Security Best Practices

1. **Use SSH Keys**: Prefer SSH key authentication over passwords
2. **Change SSH Port**: Consider running SSH on a non-standard port
3. **Disable Root Login**: `sudo sshd_config` → `PermitRootLogin no`
4. **Limit Login Attempts**: Set `MaxAuthTries 3`
5. **Regular Updates**: `sudo apt update && sudo apt upgrade`
6. **Monitor Access**: Review SSH logs regularly
7. **Backup User Data**: Regular backups of SFTP directories
8. **Use Strong Passwords**: Generate strong passwords for SFTP users

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Connection refused | Check UFW: `sudo ufw status` |
| Permission denied | Check ownership: `ls -la /var/sftp/homes/` |
| Can't write files | Fix permissions: `sudo chown user:user uploads/` |
| SSH hangs | Check firewall logs: `sudo tail /var/log/ufw.log` |
| User escape attempt | Verify root ownership of jail boundary |

## Performance Considerations

- **Disk Space**: Minimal (< 1MB for script and config)
- **Memory**: Negligible impact (firewall rules very lightweight)
- **CPU**: Minimal (firewall filtering is efficient)
- **Network**: SFTP throughput unaffected by jailing

## Compatibility

- ✅ Ubuntu 22.04 LTS (Jammy)
- ✅ Ubuntu 24.04 LTS (Noble)
- ✅ OpenSSH 8.0+
- ✅ UFW 0.36+
- ✅ Bash 4.0+

## Script Statistics

- **Lines of Code**: ~500 lines
- **Functions**: 15+ helper functions
- **Error Handling**: Comprehensive validation and rollback
- **Logging**: Detailed logging to `/var/log/harden-ufw-and-sftp.log`
- **Execution Time**: 2-3 minutes
- **Idempotency**: Can be run multiple times safely

## Support & Documentation

1. **Quick Start**: See `README-UFW-SFTP.md`
2. **Full Documentation**: See `SFTP_UFW_HARDENING.md`
3. **Examples**: See `examples-harden-ufw-and-sftp.sh`
4. **Logs**: Check `/var/log/harden-ufw-and-sftp.log`
5. **SSH Config**: Review `/etc/ssh/sshd_config`

## License

This script is part of the Joki Blast Engine project and is provided under the MIT License.

## Contributing

For improvements or bug reports, please open an issue on the GitHub repository.

---

**Last Updated**: 2024-05-17
**Version**: 1.0.0
**Author**: Joki Blast Engine Team
