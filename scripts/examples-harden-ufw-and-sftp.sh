#!/bin/bash

################################################################################
# VPS Hardening Script - Usage Examples
#
# This file demonstrates practical usage examples of the harden-ufw-and-sftp.sh
# script with real-world scenarios and test cases.
#
# Reference: scripts/harden-ufw-and-sftp.sh
################################################################################

# ==============================================================================
# EXAMPLE 1: Basic Single User Setup
# ==============================================================================

# Create a single SFTP user on default SSH port (22)
example_single_user_default_port() {
    cat << 'EOF'
# Create SFTP user 'backupuser' on default port
sudo ./harden-ufw-and-sftp.sh backupuser

# After script completes:
# 1. Set user password
sudo passwd backupuser

# 2. Test SFTP connection
sftp backupuser@your.server.ip

# 3. List directories
sftp> ls
uploads
downloads

# 4. Upload a file
sftp> cd uploads
sftp> put backup.tar.gz
sftp> quit
EOF
}

# ==============================================================================
# EXAMPLE 2: Custom SSH Port
# ==============================================================================

# Create SFTP user on non-standard SSH port for enhanced security
example_custom_ssh_port() {
    cat << 'EOF'
# Create SFTP user 'transferuser' on port 2222
sudo ./harden-ufw-and-sftp.sh transferuser 2222

# Test connection with custom port
sftp -P 2222 transferuser@your.server.ip

# Upload large file
echo "test" > testfile.txt
sftp -P 2222 transferuser@your.server.ip << EOF_SFTP
cd uploads
put testfile.txt
quit
EOF_SFTP
EOF
}

# ==============================================================================
# EXAMPLE 3: Multiple Users Setup
# ==============================================================================

# Create multiple SFTP users for different purposes
example_multiple_users() {
    cat << 'EOF'
# Create user for daily backups
sudo ./harden-ufw-and-sftp.sh dailybackup

# Create user for client file transfers
sudo ./harden-ufw-and-sftp.sh clientuser

# Create user for API data uploads
sudo ./harden-ufw-and-sftp.sh apidata

# Set passwords for each user
sudo passwd dailybackup
sudo passwd clientuser
sudo passwd apidata

# Verify users are configured
sudo grep "Match User" /etc/ssh/sshd_config
EOF
}

# ==============================================================================
# EXAMPLE 4: SSH Key Authentication
# ==============================================================================

# Use SSH keys instead of passwords for automated transfers
example_ssh_key_setup() {
    cat << 'EOF'
# Generate SSH key pair (on your local machine)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/sftpuser_key -N "passphrase"

# Create .ssh directory in user's SFTP jail
sudo mkdir -p /var/sftp/homes/sftpuser/.ssh
sudo chmod 700 /var/sftp/homes/sftpuser/.ssh

# Add public key to authorized_keys
sudo cat ~/.ssh/sftpuser_key.pub >> \
    /var/sftp/homes/sftpuser/.ssh/authorized_keys
sudo chmod 600 /var/sftp/homes/sftpuser/.ssh/authorized_keys

# Set correct ownership
sudo chown -R sftpuser:sftpuser /var/sftp/homes/sftpuser/.ssh

# Test SSH key authentication
sftp -i ~/.ssh/sftpuser_key sftpuser@your.server.ip

# In a script (automated backup upload)
#!/bin/bash
sftp -i ~/.ssh/sftpuser_key sftpuser@your.server.ip << EOF_SFTP
cd uploads
put backup-$(date +%Y%m%d).tar.gz
quit
EOF_SFTP
EOF
}

# ==============================================================================
# EXAMPLE 5: Automated Backup Upload
# ==============================================================================

# Automated daily backup upload to VPS
example_automated_backup() {
    cat << 'EOF'
#!/bin/bash
# backup-to-sftp.sh - Automated backup upload script

BACKUP_DIR="/path/to/backups"
SFTP_USER="backupuser"
SFTP_HOST="your.server.ip"
SFTP_PORT="22"
SSH_KEY="~/.ssh/backupuser_key"
ARCHIVE_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"

# Create backup
tar -czf "${BACKUP_DIR}/${ARCHIVE_NAME}" /important/data

# Upload via SFTP
sftp -i "${SSH_KEY}" -P "${SFTP_PORT}" "${SFTP_USER}@${SFTP_HOST}" << EOF_SFTP
cd uploads
put "${BACKUP_DIR}/${ARCHIVE_NAME}"
ls -la
quit
EOF_SFTP

# Verify upload
if [ $? -eq 0 ]; then
    echo "Backup uploaded successfully"
    rm -f "${BACKUP_DIR}/${ARCHIVE_NAME}"
else
    echo "Backup upload failed"
    exit 1
fi

# Schedule in crontab
# Run daily at 2 AM
# 0 2 * * * /usr/local/bin/backup-to-sftp.sh >> /var/log/backup-sftp.log 2>&1
EOF
}

# ==============================================================================
# EXAMPLE 6: Adding Additional Ports to UFW
# ==============================================================================

# Allow additional services through firewall
example_additional_firewall_ports() {
    cat << 'EOF'
# After running harden script, add more ports as needed

# Allow HTTP/HTTPS for web service
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow mail services
sudo ufw allow 25/tcp      # SMTP
sudo ufw allow 587/tcp     # SMTP TLS
sudo ufw allow 110/tcp     # POP3
sudo ufw allow 143/tcp     # IMAP

# Allow database access (if VPS is used as database server)
sudo ufw allow from 192.168.1.0/24 to any port 3306  # MySQL from local network
sudo ufw allow from 192.168.1.0/24 to any port 5432  # PostgreSQL from local network

# Apply and verify
sudo ufw reload
sudo ufw status numbered

# To remove a rule
sudo ufw delete allow 80/tcp
EOF
}

# ==============================================================================
# EXAMPLE 7: Monitoring and Logging
# ==============================================================================

# Monitor SFTP activity and access
example_monitoring_logging() {
    cat << 'EOF'
# View script execution log
sudo tail -f /var/log/harden-ufw-and-sftp.log

# Monitor SFTP connections
sudo grep "sftp-server\|sftpd" /var/log/auth.log | tail -20

# Monitor failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | grep sftpuser

# Monitor successful logins
sudo grep "Accepted password" /var/log/auth.log | grep sftpuser

# Real-time monitoring of UFW firewall
sudo tail -f /var/log/ufw.log

# Count connections by IP
sudo grep "sftpuser" /var/log/auth.log | awk '{print $11}' | sort | uniq -c

# Audit SFTP file transfers (if logging is enabled)
sudo ls -la /var/sftp/homes/sftpuser/uploads/
EOF
}

# ==============================================================================
# EXAMPLE 8: Testing and Validation
# ==============================================================================

# Comprehensive test suite for verifying setup
example_testing_validation() {
    cat << 'EOF'
#!/bin/bash
# sftp-validation-test.sh - Comprehensive validation tests

SFTP_USER="sftpuser"
SFTP_HOST="localhost"
TEST_FILE="test-$(date +%s).txt"

echo "=== SFTP Configuration Validation ==="

# Test 1: User exists
echo -n "✓ User exists: "
getent passwd "$SFTP_USER" > /dev/null && echo "PASS" || echo "FAIL"

# Test 2: SFTP connection
echo -n "✓ SFTP connection: "
echo "quit" | sftp -q "$SFTP_USER@$SFTP_HOST" 2>/dev/null && echo "PASS" || echo "FAIL"

# Test 3: Directory listing
echo -n "✓ Directory listing: "
OUTPUT=$(echo "ls" | sftp -q "$SFTP_USER@$SFTP_HOST" 2>/dev/null)
echo "$OUTPUT" | grep -q "uploads" && echo "PASS" || echo "FAIL"

# Test 4: Cannot escape jail
echo -n "✓ Jail containment: "
OUTPUT=$(echo "cd /etc" | sftp "$SFTP_USER@$SFTP_HOST" 2>&1)
echo "$OUTPUT" | grep -q "No such file" && echo "PASS" || echo "FAIL"

# Test 5: Can write to uploads
echo -n "✓ Write to uploads: "
echo "test data" > "$TEST_FILE"
(echo "cd uploads"; echo "put $TEST_FILE"; echo "quit") | \
    sftp "$SFTP_USER@$SFTP_HOST" > /dev/null 2>&1 && echo "PASS" || echo "FAIL"
rm -f "$TEST_FILE"

# Test 6: UFW status
echo -n "✓ UFW enabled: "
sudo ufw status | grep -q "Status: active" && echo "PASS" || echo "FAIL"

# Test 7: SSH configuration
echo -n "✓ SSH configuration: "
grep -q "Match User $SFTP_USER" /etc/ssh/sshd_config && echo "PASS" || echo "FAIL"

# Test 8: Shell access disabled
echo -n "✓ Shell access disabled: "
(echo "shell test"; echo "quit") | sftp "$SFTP_USER@$SFTP_HOST" 2>&1 | \
    grep -q "Invalid command" && echo "PASS" || echo "FAIL"

echo ""
echo "=== Validation Complete ==="
EOF
}

# ==============================================================================
# EXAMPLE 9: Troubleshooting Common Issues
# ==============================================================================

# Solutions to common problems
example_troubleshooting() {
    cat << 'EOF'
# Issue 1: Permission denied on upload
SOLUTION_1() {
    echo "Fixing uploads directory permissions..."
    sudo chown sftpuser:sftpuser /var/sftp/homes/sftpuser/uploads
    sudo chmod 755 /var/sftp/homes/sftpuser/uploads
    echo "Permissions fixed. Try uploading again."
}

# Issue 2: Cannot connect - connection refused
SOLUTION_2() {
    echo "Checking SSH service..."
    sudo systemctl status ssh
    echo "If not running, restart with:"
    echo "sudo systemctl restart ssh"
    echo "Then check firewall:"
    echo "sudo ufw status"
}

# Issue 3: SSHD configuration error after running script
SOLUTION_3() {
    echo "Restoring original sshd_config..."
    sudo cp /etc/ssh/sshd_config.orig /etc/ssh/sshd_config
    echo "Reloading SSH..."
    sudo systemctl reload ssh
    echo "Run the harden script again"
}

# Issue 4: User can access other users' files
SOLUTION_4() {
    echo "Checking directory permissions..."
    ls -la /var/sftp/homes/
    echo "Fixing ownership..."
    sudo chown root:root /var/sftp/homes/*/
    echo "Permissions fixed"
}

# Issue 5: UFW blocking legitimate connections
SOLUTION_5() {
    echo "Checking UFW rules..."
    sudo ufw status numbered
    echo "To debug, check logs:"
    echo "sudo tail -f /var/log/ufw.log"
}
EOF
}

# ==============================================================================
# EXAMPLE 10: Backup and Recovery
# ==============================================================================

# Backup and recover SFTP user data
example_backup_recovery() {
    cat << 'EOF'
# Backup user SFTP data
backup_sftp_user() {
    local USER=$1
    local BACKUP_NAME="sftp-${USER}-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    echo "Backing up SFTP user data for $USER..."
    sudo tar -czf "/tmp/${BACKUP_NAME}" \
        -C /var/sftp/homes "$USER"
    
    echo "Backup created: /tmp/${BACKUP_NAME}"
    ls -lh "/tmp/${BACKUP_NAME}"
}

# Restore user SFTP data
restore_sftp_user() {
    local USER=$1
    local BACKUP_FILE=$2
    
    echo "Restoring SFTP user data for $USER from $BACKUP_FILE..."
    sudo rm -rf "/var/sftp/homes/${USER}"
    sudo tar -xzf "$BACKUP_FILE" -C /var/sftp/homes
    
    # Fix permissions
    sudo chown root:root "/var/sftp/homes/${USER}"
    sudo chmod 755 "/var/sftp/homes/${USER}"
    sudo chown "${USER}:${USER}" "/var/sftp/homes/${USER}"/{uploads,downloads}
    
    echo "Restoration complete"
}

# Usage
backup_sftp_user "sftpuser"
restore_sftp_user "sftpuser" "/tmp/sftp-sftpuser-20240517-120000.tar.gz"
EOF
}

# ==============================================================================
# HELPER: Print all examples
# ==============================================================================

print_all_examples() {
    local examples=(
        "single_user_default_port"
        "custom_ssh_port"
        "multiple_users"
        "ssh_key_setup"
        "automated_backup"
        "additional_firewall_ports"
        "monitoring_logging"
        "testing_validation"
        "troubleshooting"
        "backup_recovery"
    )
    
    echo "Available examples:"
    echo ""
    for i in "${!examples[@]}"; do
        echo "$((i+1)). ${examples[$i]}"
    done
    echo ""
    echo "Run: example_<name>"
    echo "Example: example_ssh_key_setup"
}

# Display menu if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    print_all_examples
fi
